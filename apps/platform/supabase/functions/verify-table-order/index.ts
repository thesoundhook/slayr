import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY       = Deno.env.get('PAYSTACK_SECRET_KEY')!
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      reference,
      eventId,
      tableNumber,
      customerName,
      customerPhone,
      items,   // { menuItemId, name, quantity, unitPrice }[]
      subtotal,
      total,
    } = await req.json()

    // 1. Verify payment with Paystack
    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    })
    const psData = await psRes.json()

    if (!psData.status || psData.data?.status !== 'success') {
      return json({ error: 'Payment verification failed' }, 400)
    }

    const verified = psData.data
    const paidKobo = verified.amount as number  // Paystack returns amount in kobo

    // Allow ±1 kobo tolerance for rounding
    if (Math.abs(paidKobo - total) > 1) {
      return json({ error: `Amount mismatch: paid ${paidKobo}, expected ${total}` }, 400)
    }

    // 2. Create order with service-role client (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: order, error: orderErr } = await supabase
      .from('table_orders')
      .insert({
        event_id:           eventId,
        table_number:       tableNumber,
        customer_name:      customerName,
        customer_phone:     customerPhone,
        subtotal,
        total,
        status:             'confirmed',
        paystack_reference: reference,
        paystack_verified:  true,
      })
      .select()
      .single()

    if (orderErr) throw new Error(orderErr.message)

    // 3. Create order items
    const { error: itemsErr } = await supabase
      .from('table_order_items')
      .insert(items.map((item: { menuItemId: string; name: string; quantity: number; unitPrice: number }) => ({
        order_id:     order.id,
        menu_item_id: item.menuItemId,
        name:         item.name,
        quantity:     item.quantity,
        unit_price:   item.unitPrice,
        total_price:  item.unitPrice * item.quantity,
      })))

    if (itemsErr) throw new Error(itemsErr.message)

    return json({ orderId: order.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ error: message }, 500)
  }
})
