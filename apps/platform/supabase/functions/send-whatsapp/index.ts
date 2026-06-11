import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EVOLUTION_API_URL         = Deno.env.get('EVOLUTION_API_URL')!      // e.g. https://evolution-api-production-2277.up.railway.app
const EVOLUTION_API_KEY         = Deno.env.get('EVOLUTION_API_KEY')!
const EVOLUTION_INSTANCE        = Deno.env.get('EVOLUTION_INSTANCE')!     // e.g. Slayr.events

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Normalise a Nigerian (or international) number to Evolution's "234..." form.
function normalizeNumber(raw: string): string | null {
  if (!raw) return null
  let n = raw.replace(/[^\d]/g, '')
  if (n.startsWith('00')) n = n.slice(2)
  if (n.startsWith('0')) n = '234' + n.slice(1)          // 0803… → 234803…
  else if (n.length === 10) n = '234' + n               // 803… → 234803…
  // already starts with country code — leave as-is
  return n.length >= 11 ? n : null
}

function naira(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG')
}

async function sendText(number: string, text: string) {
  const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
    body: JSON.stringify({ number, text }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Evolution API ${res.status}: ${body}`)
  }
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId, kind } = await req.json() as { orderId: string; kind: 'placed' | 'paid' | 'status' }
    if (!orderId || !kind) return json({ error: 'orderId and kind are required' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: order, error } = await supabase
      .from('table_orders')
      .select('*, table_order_items(*), events(title)')
      .eq('id', orderId)
      .single()
    if (error) throw new Error(error.message)

    const eventTitle = (order.events?.title) ?? 'the event'
    const firstName  = (order.customer_name ?? '').split(' ')[0] || 'there'
    const ref        = order.id.slice(0, 8).toUpperCase()
    const itemLines  = (order.table_order_items ?? [])
      .map((i: { name: string; quantity: number; total_price: number }) => `• ${i.quantity}× ${i.name} — ${naira(i.total_price)}`)
      .join('\n')

    // Pull staff notify number from event settings
    const { data: settings } = await supabase
      .from('event_payment_settings')
      .select('notify_whatsapp_number')
      .eq('event_id', order.event_id)
      .maybeSingle()

    const customerNumber = normalizeNumber(order.customer_phone)
    const results: Record<string, unknown> = {}

    // ── Build customer message ────────────────────────────────────────────
    let customerMsg = ''
    if (kind === 'placed') {
      if (order.is_paid) {
        customerMsg =
`Hi ${firstName}! ✅ Your order *#${ref}* at *${eventTitle}* (Table ${order.table_number}) is confirmed and being prepared.

${itemLines}
*Total: ${naira(order.total)}*

We'll bring it over shortly. 🍽️`
      } else if (order.payment_method === 'transfer') {
        customerMsg =
`Hi ${firstName}! We've received your order *#${ref}* at *${eventTitle}* (Table ${order.table_number}).

${itemLines}
*Total: ${naira(order.total)}*

Please complete your transfer — we'll confirm it and start preparing your order.`
      } else {
        customerMsg =
`Hi ${firstName}! We've received your order *#${ref}* at *${eventTitle}* (Table ${order.table_number}).

${itemLines}
*Total: ${naira(order.total)}*

An attendant will come to your table to collect payment.`
      }
    } else if (kind === 'paid') {
      customerMsg = `Hi ${firstName}! 💸 Payment received for order *#${ref}*. Your order is now being prepared. 👨‍🍳`
    } else if (kind === 'status') {
      if (order.status === 'preparing') customerMsg = `👨‍🍳 Your order *#${ref}* is now being prepared, ${firstName}.`
      else if (order.status === 'served') customerMsg = `🍽️ Your order *#${ref}* has been served. Enjoy, ${firstName}!`
      else if (order.status === 'confirmed') customerMsg = `✅ Your order *#${ref}* has been confirmed, ${firstName}.`
      else if (order.status === 'cancelled') customerMsg = `Your order *#${ref}* has been cancelled. Please speak to a staff member if this is unexpected.`
    }

    if (customerNumber && customerMsg) {
      try { results.customer = await sendText(customerNumber, customerMsg) }
      catch (e) { results.customerError = (e as Error).message }
    }

    // ── Staff alert on new order ──────────────────────────────────────────
    if (kind === 'placed' && settings?.notify_whatsapp_number) {
      const staffNumber = normalizeNumber(settings.notify_whatsapp_number)
      if (staffNumber) {
        const paidTag = order.is_paid ? '✅ Paid' : '⏳ Unpaid'
        const staffMsg =
`🔔 *New order · Table ${order.table_number}*
${order.customer_name} (${order.customer_phone})

${itemLines}
*Total: ${naira(order.total)}* · ${order.payment_method.toUpperCase()} · ${paidTag}`
        try { results.staff = await sendText(staffNumber, staffMsg) }
        catch (e) { results.staffError = (e as Error).message }
      }
    }

    return json({ ok: true, results })
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
