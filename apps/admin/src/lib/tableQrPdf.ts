import jsPDF from 'jspdf'
import type { DbEvent, DbEventTable } from '@/types/database'

// Printable A4 sheet of table QR cards — 2 columns × 4 rows = 8 per page.
// Each card includes the event name, QR code, table number/label, and a scan hint.

export async function downloadTableQrsPdf(
  event: DbEvent,
  tables: DbEventTable[],
  qrDataUrls: Record<string, string>
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const pageW = 210
  const pageH = 297
  const cols = 2
  const rows = 4
  const perPage = cols * rows
  const margin = 10
  const gutter = 5

  const cardW = (pageW - margin * 2 - gutter * (cols - 1)) / cols
  const cardH = (pageH - margin * 2 - gutter * (rows - 1)) / rows
  const qrSize = Math.min(cardW - 16, cardH - 28)

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i]
    const posOnPage = i % perPage

    if (posOnPage === 0 && i > 0) doc.addPage()

    const col = posOnPage % cols
    const row = Math.floor(posOnPage / cols)

    const x = margin + col * (cardW + gutter)
    const y = margin + row * (cardH + gutter)

    // Card
    doc.setFillColor(248, 246, 252)
    doc.setDrawColor(210, 205, 235)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD')

    // Event name (top label)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(130, 120, 160)
    const titleLine = doc.splitTextToSize(event.title, cardW - 8)[0]
    doc.text(titleLine, x + cardW / 2, y + 6, { align: 'center' })

    // QR code
    const qrDataUrl = qrDataUrls[table.id]
    if (qrDataUrl) {
      const qrX = x + (cardW - qrSize) / 2
      const qrY = y + 9
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    }

    // Table label (bold, below QR)
    const displayLabel = table.label || `Table ${table.table_number}`
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(25, 15, 55)
    doc.text(displayLabel, x + cardW / 2, y + 9 + qrSize + 7, { align: 'center' })

    // Scan hint
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(140, 130, 170)
    doc.text('Scan to view menu & order', x + cardW / 2, y + 9 + qrSize + 13, { align: 'center' })
  }

  doc.save(`${event.slug ?? event.id}-table-qr-codes.pdf`)
}
