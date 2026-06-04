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
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;border-radius:12px;overflow:hidden;border:1px solid #e2dff5;">
      <tr>
        <!-- Left perforated strip -->
        <td width="8" style="background:#f0edfb;"></td>
        <!-- Main body -->
        <td style="padding:20px 20px 20px 16px;background:#ffffff;vertical-align:top;">
          <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#7c6fc4;text-transform:uppercase;letter-spacing:0.08em;">${t.typeName}</p>
          <p style="margin:0 0 14px;font-size:18px;font-weight:700;color:#1a1333;line-height:1.3;">${eventTitle}</p>
          <table cellpadding="0" cellspacing="0" style="font-size:12px;color:#6b7280;">
            <tr><td style="padding:2px 8px 2px 0;white-space:nowrap;">📅</td><td>${eventDate}</td></tr>
            <tr><td style="padding:2px 8px 2px 0;">🕐</td><td>${eventTime}</td></tr>
            <tr><td style="padding:2px 8px 2px 0;">📍</td><td>${venueName}, ${venueAddress}</td></tr>
          </table>
        </td>
        <!-- Dashed divider -->
        <td width="1" style="border-left:2px dashed #d4cff0;"></td>
        <!-- QR stub -->
        <td width="100" style="background:#3d2e8c;padding:16px 12px;text-align:center;vertical-align:middle;border-radius:0 10px 10px 0;">
          <img src="${qrUrl(t.qrCode)}" width="72" height="72" alt="QR" style="display:block;margin:0 auto 8px;border-radius:4px;background:#fff;padding:4px;" />
          <p style="margin:0;font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.12em;">Ticket ${t.index}/${tickets.length}</p>
        </td>
      </tr>
    </table>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Wordmark -->
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:22px;font-weight:800;color:#3d2e8c;letter-spacing:-0.5px;">slayr</span>
    </div>

    <!-- Hero card -->
    <div style="background:#3d2e8c;border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.12em;">Booking confirmed</p>
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.25;">${eventTitle}</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">Hi ${customerName}, your tickets are ready.</p>
    </div>

    <!-- Event details pill row -->
    <div style="background:#ffffff;border-radius:12px;padding:16px 20px;margin-bottom:20px;border:1px solid #e8e4f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid #f3f0fb;font-size:12px;color:#9896a4;width:36%;">Date</td>
          <td style="padding:6px 0;border-bottom:1px solid #f3f0fb;font-size:13px;color:#1a1333;font-weight:600;">${eventDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid #f3f0fb;font-size:12px;color:#9896a4;">Time</td>
          <td style="padding:6px 0;border-bottom:1px solid #f3f0fb;font-size:13px;color:#1a1333;font-weight:600;">${eventTime}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#9896a4;">Venue</td>
          <td style="padding:6px 0;font-size:13px;color:#1a1333;font-weight:600;">${venueName}</td>
        </tr>
      </table>
    </div>

    <!-- Instruction -->
    <p style="margin:0 0 16px;font-size:13px;color:#6b6880;text-align:center;">Present the QR code${tickets.length > 1 ? 's' : ''} below at the entrance.</p>

    <!-- Tickets -->
    ${ticketCards}

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;">
      <p style="margin:0 0 4px;font-size:11px;color:#b0acbf;">Order ref: <span style="font-family:monospace;letter-spacing:0.05em;">${orderId.slice(0, 8).toUpperCase()}</span></p>
      <p style="margin:0;font-size:11px;color:#b0acbf;">Sent by Slayr Events · <a href="mailto:ticket@opensaucery.africa" style="color:#3d2e8c;text-decoration:none;">ticket@opensaucery.africa</a></p>
    </div>

  </div>
</body>
</html>`
}

async function sendTicketEmail(
  params: Parameters<typeof buildEmailHtml>[0] & { toEmail: string },
  log: (msg: string, extra?: Record<string, unknown>) => void,
) {
  const { toEmail, customerName, eventTitle, ...rest } = params
  const html = buildEmailHtml({ customerName, eventTitle, ...rest })

  log('[email] preparing Resend request', {
    toEmail,
    eventTitle,
    ticketCount: params.tickets.length,
    htmlLength: html.length,
    hasResendKey: !!RESEND_API_KEY,
    resendKeyPrefix: RESEND_API_KEY ? RESEND_API_KEY.slice(0, 6) + '...' : null,
  })

  const startedAt = Date.now()
  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
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
  } catch (fetchErr) {
    log('[email] fetch to Resend threw before response', {
      durationMs: Date.now() - startedAt,
      error: (fetchErr as Error).message,
    })
    throw fetchErr
  }

  const durationMs = Date.now() - startedAt
  const responseBody = await res.text()

  if (!res.ok) {
    log('[email] Resend returned non-2xx', {
      status: res.status,
      durationMs,
      body: responseBody,
    })
    throw new Error(`Resend error ${res.status}: ${responseBody}`)
  }

  log('[email] Resend accepted email', {
    status: res.status,
    durationMs,
    body: responseBody,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const reqId = crypto.randomUUID().slice(0, 8)
  const startedAt = Date.now()
  const log = (msg: string, extra?: Record<string, unknown>) => {
    console.log(`[verify-payment][${reqId}] ${msg}`, extra ? JSON.stringify(extra) : '')
  }

  log('--- request received', {
    method: req.method,
    hasPaystackKey: !!PAYSTACK_SECRET_KEY,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
    hasResendKey: !!RESEND_API_KEY,
  })

  try {
    const { reference, customer, items } = await req.json()
    log('step 0: parsed body', {
      reference,
      customerEmail: customer?.email,
      customerFirstName: customer?.firstName,
      customerLastName: customer?.lastName,
      itemCount: items?.length,
    })

    if (!reference || !customer?.email || !items?.length) {
      log('step 0: missing required fields — bailing')
      return json({ error: 'Missing required fields' }, 400)
    }

    // 1. Verify payment with Paystack
    log('step 1: verifying payment with Paystack', { reference })
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    )
    const verifyData = await verifyRes.json()
    const txn = verifyData?.data
    log('step 1: Paystack response', {
      httpStatus: verifyRes.status,
      paystackStatus: txn?.status,
      amount: txn?.amount,
    })

    if (!txn || txn.status !== 'success') {
      log('step 1: payment verification failed — bailing')
      return json({ error: 'Payment verification failed' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 2. Idempotency check
    log('step 2: idempotency check')
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('paystack_reference', reference)
      .maybeSingle()

    if (existingOrder) {
      log('step 2: order already exists — short-circuiting (email NOT re-sent)', {
        orderId: existingOrder.id,
      })
      return json({ orderId: existingOrder.id })
    }
    log('step 2: no existing order — proceeding')

    // 3. Verify amount
    const subtotal = (items as any[]).reduce(
      (sum: number, i: any) => sum + i.unitPrice * i.quantity, 0
    )

    // Fetch service fee percentage from the first event in the order
    const firstEventId = (items as any[])[0]?.eventId
    let feePercentage = 4.5
    if (firstEventId) {
      const { data: eventRow } = await supabase
        .from('events')
        .select('service_fee_percentage')
        .eq('id', firstEventId)
        .single()
      if (eventRow?.service_fee_percentage != null) {
        feePercentage = eventRow.service_fee_percentage
      }
    }

    const fees = Math.round(subtotal * (feePercentage / 100))
    const total = subtotal + fees
    log('step 3: computed totals', { subtotal, fees, total, paystackAmount: txn.amount, feePercentage })

    if (txn.amount !== total) {
      log('step 3: amount mismatch — bailing')
      return json({ error: 'Amount mismatch' }, 400)
    }

    // 4. Create order
    log('step 4: inserting order')
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

    if (orderError) {
      log('step 4: order insert failed', { error: orderError.message })
      throw orderError
    }
    log('step 4: order created', { orderId: order.id })

    // 5. Create order items
    const orderItemRows = (items as any[]).map((i: any) => ({
      order_id: order.id,
      event_id: i.eventId,
      ticket_type_id: i.ticketTypeId,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: i.unitPrice * i.quantity,
    }))
    log('step 5: inserting order items', { count: orderItemRows.length })

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemRows)
      .select('id, ticket_type_id, quantity')

    if (itemsError) {
      log('step 5: order_items insert failed', { error: itemsError.message })
      throw itemsError
    }
    log('step 5: order items created', { count: createdItems?.length })

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
    log('step 6: inserting tickets', { count: ticketRows.length })

    const { error: ticketsError } = await supabase.from('tickets').insert(ticketRows)
    if (ticketsError) {
      log('step 6: tickets insert failed', { error: ticketsError.message })
      throw ticketsError
    }
    log('step 6: tickets created')

    // 7. Increment sold counts
    log('step 7: incrementing sold counts', { count: (items as any[]).length })
    for (const i of items as any[]) {
      const { error: rpcError } = await supabase.rpc('increment_sold', {
        p_ticket_type_id: i.ticketTypeId,
        p_quantity: i.quantity,
      })
      if (rpcError) {
        log('step 7: increment_sold rpc failed', {
          ticketTypeId: i.ticketTypeId,
          error: rpcError.message,
        })
        throw rpcError
      }
    }
    log('step 7: sold counts incremented')

    // 8. Send ticket email (non-fatal — order is already confirmed)
    log('step 8: starting email flow')
    try {
      if (!RESEND_API_KEY) {
        log('step 8: ABORTING — RESEND_API_KEY env var is not set')
        throw new Error('RESEND_API_KEY env var is not set')
      }

      const eventId = (items as any[])[0].eventId
      log('step 8a: fetching event', { eventId })
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('title, date, time, venue_id')
        .eq('id', eventId)
        .maybeSingle()

      if (eventErr) {
        log('step 8a: event fetch error', {
          code: eventErr.code,
          message: eventErr.message,
          details: eventErr.details,
          hint: eventErr.hint,
        })
      }
      log('step 8a: event fetch result', {
        found: !!eventData,
        title: eventData?.title,
        date: eventData?.date,
        time: eventData?.time,
        venue_id: (eventData as any)?.venue_id,
      })

      if (eventData) {
        log('step 8a2: fetching venue', { venue_id: (eventData as any).venue_id })
        const { data: venue, error: venueErr } = await supabase
          .from('venues')
          .select('name, address, city')
          .eq('id', (eventData as any).venue_id)
          .maybeSingle()

        if (venueErr) {
          log('step 8a2: venue fetch error', {
            code: venueErr.code,
            message: venueErr.message,
          })
        }
        log('step 8a2: venue fetch result', { found: !!venue, name: venue?.name })

        const ticketTypeIds = [...new Set(ticketRows.map(t => t.ticket_type_id))] as string[]
        log('step 8b: fetching ticket type names', { ticketTypeIds })
        const { data: ticketTypes, error: ttErr } = await supabase
          .from('ticket_types')
          .select('id, name')
          .in('id', ticketTypeIds)

        if (ttErr) {
          log('step 8b: ticket_types fetch error', { error: ttErr.message })
        }
        log('step 8b: ticket types fetched', { count: ticketTypes?.length })

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

        log('step 8c: calling sendTicketEmail', {
          toEmail: customer.email,
          eventTitle: eventData.title,
          ticketCount: emailTickets.length,
        })

        await sendTicketEmail(
          {
            toEmail: customer.email,
            customerName: `${customer.firstName} ${customer.lastName}`,
            eventTitle: eventData.title,
            eventDate: dateFormatted,
            eventTime: timeFormatted,
            venueName: venue?.name ?? '',
            venueAddress: `${venue?.address ?? ''}, ${venue?.city ?? ''}`,
            orderId: order.id,
            tickets: emailTickets,
          },
          log,
        )
        log('step 8: email flow completed successfully')
      } else {
        log('step 8: SKIPPING email — no event row found for eventId', { eventId })
      }
    } catch (emailErr) {
      log('step 8: email flow FAILED (order still confirmed)', {
        error: (emailErr as Error).message,
        stack: (emailErr as Error).stack,
      })
      console.error(`[verify-payment][${reqId}] Ticket email failed:`, emailErr)
    }

    log('--- done', { orderId: order.id, totalDurationMs: Date.now() - startedAt })
    return json({ orderId: order.id })

  } catch (err: any) {
    log('--- FATAL error', {
      error: err?.message,
      stack: err?.stack,
      totalDurationMs: Date.now() - startedAt,
    })
    console.error(`[verify-payment][${reqId}] verify-payment-and-create-order error:`, err)
    return json({ error: err.message ?? 'Internal server error' }, 500)
  }
})
