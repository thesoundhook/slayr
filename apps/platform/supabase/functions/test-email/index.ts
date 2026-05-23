import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

function qrUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`
}

const sampleQr = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const ticketCard = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;border-radius:12px;overflow:hidden;border:1px solid #e2dff5;">
    <tr>
      <td width="8" style="background:#f0edfb;"></td>
      <td style="padding:20px 20px 20px 16px;background:#ffffff;vertical-align:top;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#7c6fc4;text-transform:uppercase;letter-spacing:0.08em;">VIP</p>
        <p style="margin:0 0 14px;font-size:18px;font-weight:700;color:#1a1333;line-height:1.3;">Afrobeats Festival Lagos 2026</p>
        <table cellpadding="0" cellspacing="0" style="font-size:12px;color:#6b7280;">
          <tr><td style="padding:2px 8px 2px 0;white-space:nowrap;">📅</td><td>Saturday, 15 August 2026</td></tr>
          <tr><td style="padding:2px 8px 2px 0;">🕐</td><td>6:00 PM</td></tr>
          <tr><td style="padding:2px 8px 2px 0;">📍</td><td>Eko Convention Centre, Lagos</td></tr>
        </table>
      </td>
      <td width="1" style="border-left:2px dashed #d4cff0;"></td>
      <td width="100" style="background:#3d2e8c;padding:16px 12px;text-align:center;vertical-align:middle;border-radius:0 10px 10px 0;">
        <img src="${qrUrl(sampleQr)}" width="72" height="72" alt="QR" style="display:block;margin:0 auto 8px;border-radius:4px;background:#fff;padding:4px;" />
        <p style="margin:0;font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.12em;">Ticket 1/1</p>
      </td>
    </tr>
  </table>
`

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:22px;font-weight:800;color:#3d2e8c;letter-spacing:-0.5px;">slayr</span>
    </div>

    <div style="background:#3d2e8c;border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.12em;">Booking confirmed</p>
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.25;">Afrobeats Festival Lagos 2026</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">Hi Ayotomide, your tickets are ready.</p>
    </div>

    <div style="background:#ffffff;border-radius:12px;padding:16px 20px;margin-bottom:20px;border:1px solid #e8e4f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid #f3f0fb;font-size:12px;color:#9896a4;width:36%;">Date</td>
          <td style="padding:6px 0;border-bottom:1px solid #f3f0fb;font-size:13px;color:#1a1333;font-weight:600;">Saturday, 15 August 2026</td>
        </tr>
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid #f3f0fb;font-size:12px;color:#9896a4;">Time</td>
          <td style="padding:6px 0;border-bottom:1px solid #f3f0fb;font-size:13px;color:#1a1333;font-weight:600;">6:00 PM</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#9896a4;">Venue</td>
          <td style="padding:6px 0;font-size:13px;color:#1a1333;font-weight:600;">Eko Convention Centre</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 16px;font-size:13px;color:#6b6880;text-align:center;">Present the QR code below at the entrance.</p>

    ${ticketCard}

    <div style="text-align:center;margin-top:28px;">
      <p style="margin:0 0 4px;font-size:11px;color:#b0acbf;">Order ref: <span style="font-family:monospace;letter-spacing:0.05em;">A1B2C3D4</span></p>
      <p style="margin:0;font-size:11px;color:#b0acbf;">Sent by Slayr Events · <a href="mailto:ticket@opensaucery.africa" style="color:#3d2e8c;text-decoration:none;">ticket@opensaucery.africa</a></p>
    </div>

  </div>
</body>
</html>`

serve(async (req) => {
  const url = new URL(req.url)
  const to = url.searchParams.get('to') ?? 'babalolagbogo@gmail.com'

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Slayr Events <ticket@opensaucery.africa>',
      to,
      subject: 'Your tickets for Afrobeats Festival Lagos 2026 🎟️',
      html,
    }),
  })

  const body = await res.json()

  return new Response(JSON.stringify({ status: res.status, body }), {
    status: res.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})
