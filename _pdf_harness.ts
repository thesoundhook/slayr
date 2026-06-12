import { writeFileSync } from 'fs'
import QRCode from 'qrcode'
import { buildTableQrsDoc } from './apps/admin/src/lib/tableQrPdf.ts'

const event: any = {
  id: 'e1',
  slug: 'money-experience',
  title: 'The Money Experience 2026',
  organizers: { name: 'Moniepoint Events', logo_url: 'x' },
  images: [],
}

const tables: any[] = [
  { id: 't1', table_number: 1, name: 'VIP 1' },
  { id: 't2', table_number: 2, name: null },
  { id: 't3', table_number: 12, name: 'Lounge Table A' },
]

const qrDataUrls: Record<string, string> = {}
for (const t of tables) {
  qrDataUrls[t.id] = await QRCode.toDataURL(
    `https://slayr.events/e/${event.slug}/menu?table=${t.table_number}`,
    { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#1a1337', light: '#ffffff' } }
  )
}

// Stand-in brand logo (square). fitBox handles non-square symmetrically.
const logoDataUrl = await QRCode.toDataURL('SLAYR', { width: 200, margin: 1 })
const brand = { dataUrl: logoDataUrl, w: 200, h: 200 }

writeFileSync('/tmp/tables-branded.pdf', Buffer.from(buildTableQrsDoc(event, tables, qrDataUrls, brand).output('arraybuffer')))
writeFileSync('/tmp/tables-nologo.pdf', Buffer.from(buildTableQrsDoc(event, tables, qrDataUrls, null).output('arraybuffer')))
console.log('rendered /tmp/tables-branded.pdf and /tmp/tables-nologo.pdf')
