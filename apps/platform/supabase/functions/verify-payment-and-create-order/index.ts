import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

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

function qrUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`
}

function buildEmailHtml(params: {
  customerName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  venueName: string
  venueAddress: string
  orderId: string
  tickets: { qrCode: string; typeName: string; index: number }[]
}) {
  const { customerName, eventTitle, eventDate, eventTime, venueName, venueAddress, orderId, tickets } = params

  const ticketCards = tickets.map(t => `
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${t.typeName}</p>
      <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;">Ticket ${t.index} of ${tickets.length}</p>
      <img src="${qrUrl(t.qrCode)}" width="160" height="160" alt="QR Code" style="display:block;margin:0 auto 12px;border-radius:8px;" />
      <p style="margin:0;font-family:monospace;font-size:11px;color:#6b7280;word-break:break-all;">${t.qrCode}</p>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:16px;padding:32px 24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Your tickets are confirmed</p>
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;line-height:1.2;">${eventTitle}</h1>
    </div>

    <!-- Greeting -->
    <p style="margin:0 0 20px;font-size:15px;color:#374151;">Hi <strong>${customerName}</strong>, your payment was successful. Present the QR code(s) below at the entrance.</p>

    <!-- Event details -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:40%;">Date</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:500;">${eventDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Time</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:500;">${eventTime}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Venue</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:500;">${venueName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;">Address</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;">${venueAddress}</td>
        </tr>
      </table>
    </div>

    <!-- Tickets -->
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827;">Your Tickets (${tickets.length})</h2>
    ${ticketCards}

    <!-- Order ref -->
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">Order reference: <span style="font-family:monospace;">${orderId.slice(0, 8).toUpperCase()}</span></p>
    <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-align:center;">Sent by Slayr Events · <a href="mailto:ticket@opensaucery.africa" style="color:#7c3aed;text-decoration:none;">ticket@opensaucery.africa</a></p>

  </div>
</body>
</html>`
}

async function sendTicketEmail(params: Parameters<typeof buildEmailHtml>[0] & { toEmail: string }) {
  const { toEmail, customerName, eventTitle, ...rest } = params
  const html = buildEmailHtml({ customerName, eventTitle, ...rest })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Slayr Events <ticket@opensaucery.africa>',
      to: toEmail,
      subject: `Your tickets for ${eventTitle} 🎟️`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reference, customer, items } = await req.json()

    if (!reference || !customer?.email || !items?.length) {
      return json({ error: 'Missing required fields' }, 400)
    }

    // 1. Verify payment with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    )
    const verifyData = await verifyRes.json()
    const txn = verifyData?.data

    if (!txn || txn.status !== 'success') {
      return json({ error: 'Payment verification failed' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 2. Idempotency check
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('paystack_reference', reference)
      .maybeSingle()

    if (existingOrder) {
      return json({ orderId: existingOrder.id })
    }

    // 3. Verify amount
    const subtotal = (items as any[]).reduce(
      (sum: number, i: any) => sum + i.unitPrice * i.quantity, 0
    )
    const fees = Math.round(subtotal * 0.1)
    const total = subtotal + fees

    if (txn.amount !== total) {
      return json({ error: 'Amount mismatch' }, 400)
    }

    // 4. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: customer.email,
        customer_first_name: customer.firstName,
        customer_last_name: customer.lastName,
        customer_phone: customer.phone || null,
        subtotal,
        fees,
        total,
        status: 'confirmed',
        paystack_reference: reference,
        paystack_verified: true,
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    // 5. Create order items
    const orderItemRows = (items as any[]).map((i: any) => ({
      order_id: order.id,
      event_id: i.eventId,
      ticket_type_id: i.ticketTypeId,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: i.unitPrice * i.quantity,
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemRows)
      .select('id, ticket_type_id, quantity')

    if (itemsError) throw itemsError

    // 6. Generate individual tickets
    const ticketRows: any[] = []
    for (const item of createdItems) {
      const input = (items as any[]).find((i: any) => i.ticketTypeId === item.ticket_type_id)
      for (let n = 0; n < item.quantity; n++) {
        ticketRows.push({
          order_id: order.id,
          order_item_id: item.id,
          event_id: input.eventId,
          ticket_type_id: item.ticket_type_id,
          qr_code: crypto.randomUUID(),
        })
      }
    }

    const { error: ticketsError } = await supabase.from('tickets').insert(ticketRows)
    if (ticketsError) throw ticketsError

    // 7. Increment sold counts
    for (const i of items as any[]) {
      const { error: rpcError } = await supabase.rpc('increment_sold', {
        p_ticket_type_id: i.ticketTypeId,
        p_quantity: i.quantity,
      })
      if (rpcError) throw rpcError
    }

    // 8. Send ticket email (non-fatal — order is already confirmed)
    try {
      // Fetch event + venue details for the email
      const eventId = (items as any[])[0].eventId
      const { data: eventData } = await supabase
        .from('events')
        .select('title, date, time, venues(name, address, city)')
        .eq('id', eventId)
        .single()

      if (eventData) {
        const venue = (eventData as any).venues
        const ticketTypeIds = [...new Set(ticketRows.map(t => t.ticket_type_id))] as string[]
        const { data: ticketTypes } = await supabase
          .from('ticket_types')
          .select('id, name')
          .in('id', ticketTypeIds)

        const typeNameMap: Record<string, string> = {}
        for (const tt of ticketTypes ?? []) typeNameMap[tt.id] = tt.name

        const emailTickets = ticketRows.map((t, idx) => ({
          qrCode: t.qr_code,
          typeName: typeNameMap[t.ticket_type_id] ?? 'Ticket',
          index: idx + 1,
        }))

        const dateFormatted = new Date(eventData.date).toLocaleDateString('en-NG', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
        const timeFormatted = new Date(`2000-01-01T${eventData.time}`).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true,
        })

        await sendTicketEmail({
          toEmail: customer.email,
          customerName: `${customer.firstName} ${customer.lastName}`,
          eventTitle: eventData.title,
          eventDate: dateFormatted,
          eventTime: timeFormatted,
          venueName: venue?.name ?? '',
          venueAddress: `${venue?.address ?? ''}, ${venue?.city ?? ''}`,
          orderId: order.id,
          tickets: emailTickets,
        })
      }
    } catch (emailErr) {
      // Log but don't fail the order
      console.error('Ticket email failed:', emailErr)
    }

    return json({ orderId: order.id })

  } catch (err: any) {
    console.error('verify-payment-and-create-order error:', err)
    return json({ error: err.message ?? 'Internal server error' }, 500)
  }
})
