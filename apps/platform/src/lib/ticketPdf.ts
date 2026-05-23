import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import type { OrderDetail } from '../services/eventService'
import { formatDate, formatTime } from './utils'

type Ticket = OrderDetail['tickets'][number]
type OrderItem = OrderDetail['items'][number]

interface TicketPage {
  ticket: Ticket
  item: OrderItem
  index: number
  total: number
}

// Brand palette matching the email
const C = {
  purple:      [61,  46, 140] as [number, number, number],
  purpleLight: [240, 237, 251] as [number, number, number],
  purpleMid:   [212, 207, 240] as [number, number, number],
  bg:          [245, 242, 238] as [number, number, number],
  white:       [255, 255, 255] as [number, number, number],
  dark:        [26,  19,  51] as [number, number, number],
  muted:       [107, 104, 128] as [number, number, number],
  border:      [232, 228, 240] as [number, number, number],
  divider:     [243, 240, 251] as [number, number, number],
}

function flattenTickets(order: OrderDetail): TicketPage[] {
  const total = order.tickets.length
  const result: TicketPage[] = []
  let cursor = 0

  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      const ticket = order.tickets[cursor]
      if (!ticket) break
      result.push({ ticket, item, index: cursor + 1, total })
      cursor++
    }
  }

  const lastItem = order.items[order.items.length - 1]
  while (cursor < order.tickets.length && lastItem) {
    result.push({ ticket: order.tickets[cursor], item: lastItem, index: cursor + 1, total })
    cursor++
  }

  return result
}

interface LogoAsset { dataUrl: string; width: number; height: number }

function toJpeg(img: HTMLImageElement, maxW: number, maxH: number, bgHex = '#ffffff'): { dataUrl: string; width: number; height: number } {
  const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
  const w = Math.round(img.naturalWidth * ratio)
  const h = Math.round(img.naturalHeight * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bgHex
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.88), width: w, height: h }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function loadLogo(): Promise<LogoAsset | null> {
  try {
    const res = await fetch('/slayr logo.png')
    const blob = await res.blob()
    const dataUrl = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
    const img = await loadImage(dataUrl)
    // Cap logo at 400×80px so jsPDF doesn't embed a multi-MB bitmap
    const jpeg = toJpeg(img, 400, 80, '#f5f2ee')
    return jpeg
  } catch {
    return null
  }
}

export async function generateTicketsPdf(order: OrderDetail): Promise<jsPDF> {
  const [pages, logo] = await Promise.all([
    Promise.resolve(flattenTickets(order)),
    loadLogo(),
  ])
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 595
  const H = doc.internal.pageSize.getHeight()  // 842
  const mx = 48  // horizontal margin

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage()
    const { ticket, item, index, total } = pages[i]

    // ── Page background ───────────────────────────────────────────────────
    doc.setFillColor(...C.bg)
    doc.rect(0, 0, W, H, 'F')

    let y = 36

    // ── Logo / Wordmark ───────────────────────────────────────────────────
    if (logo) {
      const logoH = 28
      const logoW = logoH * (logo.width / logo.height)
      doc.addImage(logo.dataUrl, 'JPEG', W / 2 - logoW / 2, y, logoW, logoH)
      y += logoH + 20
    } else {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(...C.purple)
      doc.text('slayr', W / 2, y + 14, { align: 'center' })
      y += 44
    }
    y += 36

    // ── Hero card (dark purple) ───────────────────────────────────────────
    const heroH = 90
    doc.setFillColor(...C.purple)
    doc.roundedRect(mx, y, W - mx * 2, heroH, 10, 10, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255, 0.55)
    doc.setTextColor(180, 170, 220)
    doc.text('BOOKING CONFIRMED', W / 2, y + 22, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...C.white)
    const titleLines = doc.splitTextToSize(item.eventTitle || 'Event', W - mx * 2 - 40)
    doc.text(titleLines, W / 2, y + 40, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(200, 195, 230)
    doc.text(
      `Hi ${order.customerFirstName}, your ticket is ready.`,
      W / 2,
      y + 40 + titleLines.length * 20 + 4,
      { align: 'center' }
    )
    y += heroH + 16

    // ── Event details card ────────────────────────────────────────────────
    const detailsCardH = 88
    doc.setFillColor(...C.white)
    doc.roundedRect(mx, y, W - mx * 2, detailsCardH, 8, 8, 'F')
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.5)
    doc.roundedRect(mx, y, W - mx * 2, detailsCardH, 8, 8, 'S')

    const rows: [string, string][] = [
      ['Date',  item.eventDate ? formatDate(item.eventDate) : '—'],
      ['Time',  item.eventTime ? formatTime(item.eventTime) : '—'],
      ['Venue', item.venueName ? `${item.venueName}${item.venueCity ? ', ' + item.venueCity : ''}` : '—'],
    ]

    let ry = y + 16
    const labelX = mx + 20
    const valueX = mx + 120

    rows.forEach(([label, value], ri) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...C.muted)
      doc.text(label, labelX, ry)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...C.dark)
      const vLines = doc.splitTextToSize(value, W - mx * 2 - 120 - 20)
      doc.text(vLines, valueX, ry)

      if (ri < rows.length - 1) {
        doc.setDrawColor(...C.divider)
        doc.setLineWidth(0.5)
        doc.line(labelX, ry + 8, W - mx - 20, ry + 8)
      }
      ry += 26
    })

    y += detailsCardH + 20

    // ── "Present QR at entrance" hint ─────────────────────────────────────
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...C.muted)
    doc.text('Present the QR code below at the entrance.', W / 2, y, { align: 'center' })
    y += 20

    // ── Ticket card ───────────────────────────────────────────────────────
    const ticketH = 130
    const qrStubW = 108
    const ticketW = W - mx * 2

    // White main body
    doc.setFillColor(...C.white)
    doc.roundedRect(mx, y, ticketW, ticketH, 8, 8, 'F')
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.5)
    doc.roundedRect(mx, y, ticketW, ticketH, 8, 8, 'S')

    // Left accent strip
    doc.setFillColor(...C.purpleLight)
    doc.rect(mx, y, 8, ticketH, 'F')
    // Round only left corners of strip
    doc.setFillColor(...C.purpleLight)
    doc.roundedRect(mx, y, 10, ticketH, 8, 8, 'F')
    // Cover the right edge of the rounded rect to make right side square
    doc.setFillColor(...C.white)
    doc.rect(mx + 8, y + 1, 4, ticketH - 2, 'F')

    // Dashed divider before QR stub
    const dashX = W - mx - qrStubW - 1
    doc.setDrawColor(...C.purpleMid)
    doc.setLineWidth(1.5)
    const dashLen = 5, gapLen = 4
    let dy = y + 4
    while (dy < y + ticketH - 4) {
      doc.line(dashX, dy, dashX, Math.min(dy + dashLen, y + ticketH - 4))
      dy += dashLen + gapLen
    }

    // Purple QR stub
    doc.setFillColor(...C.purple)
    doc.rect(W - mx - qrStubW, y, qrStubW, ticketH, 'F')
    // Round right corners
    doc.roundedRect(W - mx - qrStubW, y, qrStubW, ticketH, 8, 8, 'F')
    // Cover left corners of rounded rect to keep them square
    doc.setFillColor(...C.purple)
    doc.rect(W - mx - qrStubW, y + 1, 6, ticketH - 2, 'F')

    // QR image
    const qrSize = 76
    const qrX = W - mx - qrStubW + (qrStubW - qrSize) / 2
    const qrY = y + (ticketH - qrSize - 18) / 2
    const qrPng = await QRCode.toDataURL(ticket.qrCode, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
      color: { dark: '#000000', light: '#ffffff' },
    })
    const qrImg = await loadImage(qrPng)
    const qrJpeg = toJpeg(qrImg, 160, 160, '#ffffff')
    doc.addImage(qrJpeg.dataUrl, 'JPEG', qrX, qrY, qrSize, qrSize)

    // Ticket number label in QR stub
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(180, 170, 220)
    doc.text(
      `TICKET ${index}/${total}`,
      W - mx - qrStubW + qrStubW / 2,
      y + ticketH - 10,
      { align: 'center' }
    )

    // Left body content
    const bodyX = mx + 18
    let by = y + 24

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C.purple)
    doc.text((item.ticketTypeName || 'TICKET').toUpperCase(), bodyX, by)
    by += 16

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...C.dark)
    const cardTitle = doc.splitTextToSize(item.eventTitle || 'Event', dashX - bodyX - 12)
    doc.text(cardTitle, bodyX, by)
    by += cardTitle.length * 17 + 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    const metaLines: string[] = []
    if (item.eventDate) metaLines.push(formatDate(item.eventDate))
    if (item.eventTime) metaLines.push(formatTime(item.eventTime))
    if (item.venueName) metaLines.push(`${item.venueName}${item.venueCity ? ', ' + item.venueCity : ''}`)
    metaLines.forEach(line => {
      doc.text(line, bodyX, by)
      by += 13
    })

    y += ticketH + 32

    // ── Footer ────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text(
      `Order ref: ${order.id.slice(0, 8).toUpperCase()}   ·   Page ${i + 1} of ${pages.length}`,
      W / 2,
      H - 36,
      { align: 'center' }
    )
    doc.setTextColor(...C.purple)
    doc.text('ticket@opensaucery.africa', W / 2, H - 22, { align: 'center' })
  }

  return doc
}

export async function downloadTicketsPdf(order: OrderDetail) {
  const doc = await generateTicketsPdf(order)
  doc.save(`slayr-tickets-${order.id.slice(0, 8).toLowerCase()}.pdf`)
}
