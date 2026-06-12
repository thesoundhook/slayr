import jsPDF from 'jspdf'
import type { DbEvent, DbEventTable } from '@/types/database'

// Printable A4 PDF — one branded full-page poster per table.
// Each page carries the brand (organizer logo + event title on a coloured header),
// a large QR code, the table name/number, a scan hint, and the organizer name.

// Slayr brand purple — matches the QR foreground colour.
const BRAND: [number, number, number] = [26, 19, 55]      // #1a1337
const BRAND_TEXT: [number, number, number] = [25, 15, 55]
const MUTED: [number, number, number] = [140, 130, 170]

type LoadedImage = { dataUrl: string; w: number; h: number }

// Load a remote image and re-encode it as PNG via canvas so jsPDF accepts it
// regardless of the source format (webp/jpeg/etc). Returns null on any failure
// (CORS taint, network, decode) so the sheet still renders without the brand.
async function loadImageAsPng(url: string): Promise<LoadedImage | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image()
      im.crossOrigin = 'anonymous'
      im.onload = () => resolve(im)
      im.onerror = reject
      im.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    return { dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight }
  } catch {
    return null
  }
}

// Scale (natW × natH) to fit inside (maxW × maxH), preserving aspect ratio.
function fitBox(natW: number, natH: number, maxW: number, maxH: number) {
  const scale = Math.min(maxW / natW, maxH / natH)
  return { w: natW * scale, h: natH * scale }
}

export async function downloadTableQrsPdf(
  event: DbEvent,
  tables: DbEventTable[],
  qrDataUrls: Record<string, string>
): Promise<void> {
  // Preload the brand mark once: organizer logo preferred, else the event cover.
  const brandUrl = event.organizers?.logo_url ?? event.images?.[0] ?? null
  const brand = brandUrl ? await loadImageAsPng(brandUrl) : null

  const doc = buildTableQrsDoc(event, tables, qrDataUrls, brand)
  doc.save(`${event.slug ?? event.id}-table-qr-codes.pdf`)
}

// Pure layout/drawing — no DOM, no download. Given an already-loaded brand image
// (or null), produces the jsPDF document. Kept separate so it can be rendered headlessly.
export function buildTableQrsDoc(
  event: DbEvent,
  tables: DbEventTable[],
  qrDataUrls: Record<string, string>,
  brand: LoadedImage | null
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const pageW = 210
  const pageH = 297
  const margin = 16
  const radius = 8

  // One full-page branded poster per table.
  const cardX = margin
  const cardY = margin
  const cardW = pageW - margin * 2
  const cardH = pageH - margin * 2

  const bandH = 34          // brand header height
  const qrSize = Math.min(cardW - 56, 130)

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i]
    if (i > 0) doc.addPage()

    // ── Card frame ───────────────────────────────────────────────────────────
    doc.setFillColor(248, 246, 252)
    doc.setDrawColor(210, 205, 235)
    doc.setLineWidth(0.6)
    doc.roundedRect(cardX, cardY, cardW, cardH, radius, radius, 'FD')

    // ── Brand header band ────────────────────────────────────────────────────
    doc.setFillColor(...BRAND)
    doc.roundedRect(cardX, cardY, cardW, bandH, radius, radius, 'F')
    // Square off the band's bottom edge (cover its rounded corners).
    doc.rect(cardX, cardY + bandH - radius, cardW, radius, 'F')

    let textX = cardX + cardW / 2
    let textAlign: 'center' | 'left' = 'center'

    if (brand) {
      const box = fitBox(brand.w, brand.h, 48, bandH - 14)
      const logoX = cardX + 14
      const logoY = cardY + (bandH - box.h) / 2
      doc.addImage(brand.dataUrl, 'PNG', logoX, logoY, box.w, box.h)
      // Title sits to the right of the logo, left-aligned.
      textX = logoX + box.w + 8
      textAlign = 'left'
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    const availTitleW = textAlign === 'left' ? cardX + cardW - textX - 12 : cardW - 24
    const titleLine = doc.splitTextToSize(event.title, availTitleW)[0]
    doc.text(titleLine, textX, cardY + bandH / 2 + 1, { align: textAlign, baseline: 'middle' })

    // ── QR code (centred) ─────────────────────────────────────────────────────
    const qrDataUrl = qrDataUrls[table.id]
    const qrX = cardX + (cardW - qrSize) / 2
    const qrY = cardY + bandH + 22
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    }

    // ── Table name (large bold, below QR) ─────────────────────────────────────
    const displayLabel = table.name || `Table ${table.table_number}`
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(30)
    doc.setTextColor(...BRAND_TEXT)
    doc.text(displayLabel, cardX + cardW / 2, qrY + qrSize + 22, { align: 'center' })

    // ── Scan hint ──────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(...MUTED)
    doc.text('Scan to view the menu & place your order', cardX + cardW / 2, qrY + qrSize + 33, { align: 'center' })

    // ── Organizer name footer ───────────────────────────────────────────────────
    const organizerName = event.organizers?.name
    if (organizerName) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...MUTED)
      doc.text(organizerName, cardX + cardW / 2, cardY + cardH - 10, { align: 'center' })
    }
  }

  return doc
}
