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

    // Pull staff notify number + transfer account from event settings
    const { data: settings } = await supabase
      .from('event_payment_settings')
      .select('notify_whatsapp_number, transfer_bank_name, transfer_account_number, transfer_account_name, transfer_instructions')
      .eq('event_id', order.event_id)
      .maybeSingle()

    const customerNumber = normalizeNumber(order.customer_phone)
    const results: Record<string, unknown> = {}

    // The event staff-alert field may hold several numbers (comma / newline / semicolon separated).
    const notifyNumbers = (settings?.notify_whatsapp_number ?? '')
      .split(/[,\n;]+/)
      .map((s: string) => s.trim())
      .filter(Boolean)

    // Debug trace — surfaced in the response so we can see exactly what was
    // resolved and attempted without digging through function logs.
    const debug: Record<string, unknown> = {
      kind,
      order: {
        id: order.id,
        event_id: order.event_id,
        table_number: order.table_number,
        status: order.status,
        is_paid: order.is_paid,
        payment_method: order.payment_method,
      },
      customer: { raw: order.customer_phone, normalized: customerNumber },
      eventNotify: {
        raw: settings?.notify_whatsapp_number ?? null,
        parsed: notifyNumbers.map((n: string) => ({ raw: n, normalized: normalizeNumber(n) })),
      },
    }

    // A tidy receipt block reused across messages
    const receipt =
`${itemLines}

*Total: ${naira(order.total)}*`

    const orderMeta = `${eventTitle} · Table ${order.table_number} · Order #${ref}`

    // ── Build customer message ────────────────────────────────────────────
    let customerMsg = ''
    if (kind === 'placed') {
      if (order.is_paid) {
        customerMsg =
`Hi ${firstName}, thanks for your order — it's confirmed and we've started preparing it.

${receipt}

We'll have it brought to your table shortly. Enjoy the evening.

${orderMeta}`
      } else if (order.payment_method === 'transfer') {
        const acct = settings?.transfer_account_number
          ? `\nPlease transfer *${naira(order.total)}* to:

Bank: ${settings.transfer_bank_name}
Account number: *${settings.transfer_account_number}*
Account name: ${settings.transfer_account_name}${settings.transfer_instructions ? `\n\n${settings.transfer_instructions}` : ''}`
          : ''
        customerMsg =
`Hi ${firstName}, we've received your order.
${acct}

${receipt}

As soon as we confirm your payment, we'll start preparing it. If you've already sent it, please ignore this — we're on it.

${orderMeta}`
      } else {
        customerMsg =
`Hi ${firstName}, we've received your order. One of our attendants will come to your table shortly to collect payment.

${receipt}

Once that's done, we'll get straight to preparing it.

${orderMeta}`
      }
    } else if (kind === 'paid') {
      customerMsg =
`Hi ${firstName}, we've received your payment — thank you. Your order is now being prepared and will be brought to your table shortly.

${receipt}

${orderMeta}`
    } else if (kind === 'status') {
      if (order.status === 'preparing') {
        customerMsg = `Hi ${firstName}, your order is now being prepared and will be at your table soon.\n\n${orderMeta}`
      } else if (order.status === 'served') {
        customerMsg = `Hi ${firstName}, your order has been served — enjoy. Feel free to order again any time from your table.\n\n${orderMeta}`
      } else if (order.status === 'confirmed') {
        customerMsg = `Hi ${firstName}, your order has been confirmed. We'll begin preparing it shortly.\n\n${orderMeta}`
      } else if (order.status === 'cancelled') {
        customerMsg = `Hi ${firstName}, your order has been cancelled. If this wasn't expected or you're due a refund, please speak to a member of staff and we'll sort it out.\n\n${orderMeta}`
      }
    }

    if (customerNumber && customerMsg) {
      try { results.customer = await sendText(customerNumber, customerMsg) }
      catch (e) { results.customerError = (e as Error).message }
    }

    // ── Staff alert on new order ──────────────────────────────────────────
    if (kind === 'placed') {
      // The usher assigned to this table (matched by event + table number).
      // Two plain queries instead of a PostgREST embed: embedding event_ushers
      // depends on the FK relationship being readable through the API layer,
      // which proved fragile. A direct id lookup is read cleanly by service role.
      const { data: tableRow, error: tableErr } = await supabase
        .from('event_tables')
        .select('usher_id')
        .eq('event_id', order.event_id)
        .eq('table_number', order.table_number)
        .maybeSingle()

      let usher: { name: string; phone: string } | null = null
      let usherErr: string | null = null
      if (tableRow?.usher_id) {
        const { data: u, error: uErr } = await supabase
          .from('event_ushers')
          .select('name, phone')
          .eq('id', tableRow.usher_id)
          .maybeSingle()
        usher = u ?? null
        usherErr = uErr?.message ?? null
      }

      debug.usherLookup = {
        tableFound: !!tableRow,
        tableError: tableErr?.message ?? null,
        usherId: tableRow?.usher_id ?? null,
        usherFound: !!usher,
        usherError: usherErr,
        name: usher?.name ?? null,
        rawPhone: usher?.phone ?? null,
        normalized: usher?.phone ? normalizeNumber(usher.phone) : null,
      }

      // Collect recipients: the event-wide notify number + the table's usher.
      // Dedupe by normalised number so nobody gets the alert twice.
      const recipients: { label: string; number: string }[] = []
      const pushRecipient = (label: string, raw?: string | null) => {
        const n = raw ? normalizeNumber(raw) : null
        if (n && !recipients.some(r => r.number === n)) recipients.push({ label, number: n })
      }
      notifyNumbers.forEach((num: string, i: number) =>
        pushRecipient(notifyNumbers.length > 1 ? `event${i + 1}` : 'event', num))
      pushRecipient('usher', usher?.phone)
      debug.recipients = recipients

      if (recipients.length > 0) {
        const methodLabel = order.payment_method === 'pos' ? 'Pay at table (POS/cash)'
          : order.payment_method === 'transfer' ? 'Bank transfer'
          : 'Paid online'
        const paidTag = order.is_paid ? 'Paid' : 'Awaiting payment'
        const usherLine = usher ? `\nUsher: ${usher.name}` : ''
        const staffMsg =
`*New order — Table ${order.table_number}*

${order.customer_name}
${order.customer_phone}

${receipt}

Payment: ${methodLabel} (${paidTag})${usherLine}
Order #${ref}`
        for (const r of recipients) {
          try { results[r.label] = await sendText(r.number, staffMsg) }
          catch (e) { results[`${r.label}Error`] = (e as Error).message }
        }
      }
    }

    return json({ ok: true, results, debug })
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
