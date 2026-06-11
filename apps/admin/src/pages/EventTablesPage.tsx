import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { ArrowLeft, Plus, Trash2, Download, QrCode, Loader2, Ticket, RefreshCw } from 'lucide-react'
import { getEventById, getTicketTypesByEvent } from '@/services/eventService'
import { getTablesByEvent, createTables, updateTable, deleteTable } from '@/services/tableService'
import type { DbEvent, DbEventTable, DbTicketType } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumericInput } from '@/components/ui/NumericInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PageHero from '@/components/ui/PageHero'
import { cn } from '@/lib/utils'

const PLATFORM_URL = (import.meta.env.VITE_PLATFORM_URL as string | undefined) ?? 'http://slayr.events'

function tableQrUrl(eventSlug: string, tableNumber: number) {
  return `${PLATFORM_URL}/e/${eventSlug}/menu?table=${tableNumber}`
}

const TICKET_TYPE_COLORS: Record<string, string> = {
  vip: 'bg-violet-100 text-violet-700',
  'early-bird': 'bg-green-100 text-green-700',
  group: 'bg-blue-100 text-blue-700',
  general: 'bg-muted text-muted-foreground',
}

export default function EventTablesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<DbEvent | null>(null)
  const [ticketTypes, setTicketTypes] = useState<DbTicketType[]>([])
  const [tables, setTables] = useState<DbEventTable[]>([])
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate form
  const [genTicketTypeId, setGenTicketTypeId] = useState('')
  const [genCount, setGenCount] = useState(1)
  const [genStartFrom, setGenStartFrom] = useState(1)
  const [generating, setGenerating] = useState(false)

  // Single add form
  const [singleNumber, setSingleNumber] = useState('')
  const [singleName, setSingleName] = useState('')
  const [singleTicketTypeId, setSingleTicketTypeId] = useState('')
  const [adding, setAdding] = useState(false)

  // Inline name editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Sync
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    getEventById(id)
      .then(async ev => {
        setEvent(ev)
        const [tabs, allTts] = await Promise.all([
          getTablesByEvent(ev.id),
          getTicketTypesByEvent(ev.id),
        ])
        const tts = allTts.filter(t => t.is_table_ticket)
        setTables(tabs)
        setTicketTypes(tts)
        if (tts.length > 0) {
          setGenTicketTypeId(tts[0].id)
          setSingleTicketTypeId(tts[0].id)
          setGenCount(tts[0].sold)
        }
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  // Sync genCount when ticket type selection changes
  useEffect(() => {
    const tt = ticketTypes.find(t => t.id === genTicketTypeId)
    if (tt) setGenCount(tt.sold)
  }, [genTicketTypeId, ticketTypes])

  // Sync genStartFrom to next available number for the selected ticket type
  useEffect(() => {
    const nums = tables.map(t => t.table_number)
    setGenStartFrom(nums.length > 0 ? Math.max(...nums) + 1 : 1)
  }, [tables])

  // Re-generate QR data URLs when tables/event change
  useEffect(() => {
    if (!event || tables.length === 0) return
    let cancelled = false
      ; (async () => {
        const urls: Record<string, string> = {}
        for (const t of tables) {
          urls[t.id] = await QRCode.toDataURL(tableQrUrl(event.slug, t.table_number), {
            width: 320,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: { dark: '#1a1337', light: '#ffffff' },
          })
        }
        if (!cancelled) setQrDataUrls(urls)
      })().catch(console.error)
    return () => { cancelled = true }
  }, [tables, event])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleBulkGenerate = async () => {
    if (!event || !genTicketTypeId) return
    setGenerating(true)
    setError(null)
    try {
      const existing = new Set(tables.map(t => t.table_number))
      const toCreate = Array.from({ length: genCount }, (_, i) => genStartFrom + i)
        .filter(n => !existing.has(n))
      if (toCreate.length === 0) {
        setError('All those table numbers already exist for this ticket type.')
        return
      }
      const tt = ticketTypes.find(t => t.id === genTicketTypeId)
      const created = await createTables(
        event.id,
        toCreate.map(n => ({
          table_number: n,
          name: tt ? `${tt.name} ${n}` : null,
          ticket_type_id: genTicketTypeId,
        }))
      )
      setTables(prev => [...prev, ...created].sort((a, b) => a.table_number - b.table_number))
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const handleAddSingle = async () => {
    if (!event) return
    const num = parseInt(singleNumber)
    if (isNaN(num) || num < 1) return
    setAdding(true)
    setError(null)
    try {
      const [created] = await createTables(event.id, [{
        table_number: num,
        name: singleName.trim() || null,
        ticket_type_id: singleTicketTypeId || null,
      }])
      setTables(prev => [...prev, created].sort((a, b) => a.table_number - b.table_number))
      setSingleNumber('')
      setSingleName('')
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (table: DbEventTable) => {
    const label = table.name || `Table ${table.table_number}`
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return
    setError(null)
    try {
      await deleteTable(table.id)
      setTables(prev => prev.filter(t => t.id !== table.id))
      setQrDataUrls(prev => { const next = { ...prev }; delete next[table.id]; return next })
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  const handleSync = async () => {
    if (!event) return
    setSyncing(true)
    setSyncMessage(null)
    setError(null)
    try {
      // Re-fetch ticket types to get the latest sold counts
      const freshTts = (await getTicketTypesByEvent(event.id)).filter(t => t.is_table_ticket)
      setTicketTypes(freshTts)

      const toCreate: { table_number: number; name: string | null; ticket_type_id: string }[] = []
      let nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.table_number)) + 1 : 1

      for (const tt of freshTts) {
        const existingCount = tables.filter(t => t.ticket_type_id === tt.id).length
        const missing = tt.sold - existingCount
        if (missing <= 0) continue
        for (let i = 0; i < missing; i++) {
          toCreate.push({
            table_number: nextNumber++,
            name: `${tt.name} ${existingCount + i + 1}`,
            ticket_type_id: tt.id,
          })
        }
      }

      if (toCreate.length === 0) {
        setSyncMessage('Already in sync — no new tables needed.')
        return
      }

      const created = await createTables(event.id, toCreate)
      setTables(prev => [...prev, ...created].sort((a, b) => a.table_number - b.table_number))
      setSyncMessage(`${toCreate.length} table${toCreate.length !== 1 ? 's' : ''} created.`)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  const startEditName = (table: DbEventTable) => {
    setEditingId(table.id)
    setEditName(table.name ?? '')
    setTimeout(() => editRef.current?.focus(), 0)
  }

  const commitEditName = async (table: DbEventTable) => {
    setEditingId(null)
    const newName = editName.trim() || null
    if (newName === table.name) return
    try {
      await updateTable(table.id, { name: newName })
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, name: newName } : t))
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  const downloadQrPng = (table: DbEventTable) => {
    const dataUrl = qrDataUrls[table.id]
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `table-${table.table_number}-qr.png`
    a.click()
  }

  const handleDownloadAllPdf = async () => {
    if (!event || tables.length === 0) return
    setDownloadingPdf(true)
    try {
      const { downloadTableQrsPdf } = await import('@/lib/tableQrPdf')
      await downloadTableQrsPdf(event, tables, qrDataUrls)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setDownloadingPdf(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  // Group tables by ticket_type_id (null = unassigned)
  const tablesByType = ticketTypes.map(tt => ({
    ticketType: tt,
    tables: tables.filter(t => t.ticket_type_id === tt.id),
  })).filter(g => g.tables.length > 0)

  const unassigned = tables.filter(t => !t.ticket_type_id)

  const selectedTT = ticketTypes.find(t => t.id === genTicketTypeId)

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  if (!event) {
    return <div className="p-6 text-muted-foreground">Event not found.</div>
  }

  return (
    <>
      <PageHero
        badge="Tables"
        title={`Tables — ${event.title}`}
        subtitle="Generate QR-coded tables per ticket type and download a printable sheet."
        ghost="03"
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/events/${event.slug}/edit`)}>
              <ArrowLeft className="h-4 w-4" />
              Back to Event
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
            <button onClick={() => setError(null)} className="ml-3 underline text-xs">dismiss</button>
          </div>
        )}
        {syncMessage && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center justify-between">
            {syncMessage}
            <button onClick={() => setSyncMessage(null)} className="underline text-xs">dismiss</button>
          </div>
        )}

        {ticketTypes.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No table ticket types found. Open the event editor, expand a ticket type, and enable the <strong>Table ticket</strong> toggle.
          </div>
        )}

        {/* ── Controls ────────────────────────────────────────────────────── */}
        {ticketTypes.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Bulk generate */}
            <Card>
              <CardHeader><CardTitle className="text-base">Generate Tables</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pick a ticket type and generate a batch of numbered tables for it.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ticket Type</label>
                  <select
                    value={genTicketTypeId}
                    onChange={e => setGenTicketTypeId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ticketTypes.map(tt => (
                      <option key={tt.id} value={tt.id}>{tt.name} ({tt.sold} sold)</option>
                    ))}
                  </select>
                  {selectedTT && (
                    <p className="text-xs text-muted-foreground">
                      {tables.filter(t => t.ticket_type_id === genTicketTypeId).length} table{tables.filter(t => t.ticket_type_id === genTicketTypeId).length !== 1 ? 's' : ''} already exist for this type
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Count</label>
                    <NumericInput min={1} max={500} value={genCount} onChange={v => setGenCount(v || 1)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start from #</label>
                    <NumericInput min={1} value={genStartFrom} onChange={v => setGenStartFrom(v || 1)} />
                  </div>
                </div>

                <Button onClick={handleBulkGenerate} disabled={generating || !genTicketTypeId} size="sm">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  Generate {genCount} Table{genCount !== 1 ? 's' : ''}
                </Button>
              </CardContent>
            </Card>

            {/* Single add */}
            <Card>
              <CardHeader><CardTitle className="text-base">Add Single Table</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manually add one table with a custom number and name.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ticket Type</label>
                  <select
                    value={singleTicketTypeId}
                    onChange={e => setSingleTicketTypeId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">None / Unassigned</option>
                    {ticketTypes.map(tt => (
                      <option key={tt.id} value={tt.id}>{tt.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Table #</label>
                    <Input
                      type="number"
                      min={1}
                      value={singleNumber}
                      onChange={e => setSingleNumber(e.target.value)}
                      placeholder="e.g. 7"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</label>
                    <Input
                      value={singleName}
                      onChange={e => setSingleName(e.target.value)}
                      placeholder="e.g. VIP Corner"
                      onKeyDown={e => e.key === 'Enter' && handleAddSingle()}
                    />
                  </div>
                </div>

                <Button onClick={handleAddSingle} disabled={adding || !singleNumber} size="sm">
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Table
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tables display ────────────────────────────────────────────────── */}
        {tables.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card flex flex-col items-center justify-center py-16 text-center gap-3">
            <QrCode className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No tables yet. Generate or add one above.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{tables.length} table{tables.length !== 1 ? 's' : ''} total</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAllPdf}
                disabled={downloadingPdf || Object.keys(qrDataUrls).length === 0}
              >
                {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download All (PDF)
              </Button>
            </div>

            {/* Groups by ticket type */}
            {tablesByType.map(({ ticketType, tables: groupTables }) => (
              <div key={ticketType.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{ticketType.name}</span>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide', TICKET_TYPE_COLORS[ticketType.type] ?? TICKET_TYPE_COLORS.general)}>
                    {ticketType.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{groupTables.length} table{groupTables.length !== 1 ? 's' : ''}</span>
                </div>
                <TableGrid
                  tables={groupTables}
                  event={event}
                  qrDataUrls={qrDataUrls}
                  editingId={editingId}
                  editName={editName}
                  editRef={editRef}
                  onEditName={startEditName}
                  onEditNameChange={setEditName}
                  onCommitName={commitEditName}
                  onCancelEdit={() => setEditingId(null)}
                  onDownloadPng={downloadQrPng}
                  onDelete={handleDelete}
                />
              </div>
            ))}

            {/* Unassigned tables */}
            {unassigned.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-muted-foreground">Unassigned</span>
                  <span className="text-xs text-muted-foreground">{unassigned.length} table{unassigned.length !== 1 ? 's' : ''}</span>
                </div>
                <TableGrid
                  tables={unassigned}
                  event={event}
                  qrDataUrls={qrDataUrls}
                  editingId={editingId}
                  editName={editName}
                  editRef={editRef}
                  onEditName={startEditName}
                  onEditNameChange={setEditName}
                  onCommitName={commitEditName}
                  onCancelEdit={() => setEditingId(null)}
                  onDownloadPng={downloadQrPng}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Table card grid ───────────────────────────────────────────────────────────

interface TableGridProps {
  tables: DbEventTable[]
  event: DbEvent
  qrDataUrls: Record<string, string>
  editingId: string | null
  editName: string
  editRef: React.RefObject<HTMLInputElement>
  onEditName: (table: DbEventTable) => void
  onEditNameChange: (val: string) => void
  onCommitName: (table: DbEventTable) => void
  onCancelEdit: () => void
  onDownloadPng: (table: DbEventTable) => void
  onDelete: (table: DbEventTable) => void
}

function TableGrid({
  tables, event, qrDataUrls,
  editingId, editName, editRef,
  onEditName, onEditNameChange, onCommitName, onCancelEdit,
  onDownloadPng, onDelete,
}: TableGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map(table => {
        const qrUrl = qrDataUrls[table.id]
        const isEditing = editingId === table.id
        const displayName = table.name || `Table ${table.table_number}`

        return (
          <div key={table.id} className="rounded-xl border bg-card flex flex-col items-center p-4 gap-2">

            {/* Table number badge */}
            <div className="self-start text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              #{table.table_number}
            </div>

            {/* QR code */}
            <div className="w-full aspect-square rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden">
              {qrUrl ? (
                <img src={qrUrl} alt={`QR for ${displayName}`} className="w-full h-full object-contain p-1" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
              )}
            </div>

            {/* Name (click to edit) */}
            {isEditing ? (
              <input
                ref={editRef}
                value={editName}
                onChange={e => onEditNameChange(e.target.value)}
                onBlur={() => onCommitName(table)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onCommitName(table)
                  if (e.key === 'Escape') onCancelEdit()
                }}
                placeholder={`Table ${table.table_number}`}
                className="w-full text-center text-sm font-semibold rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <button
                type="button"
                onClick={() => onEditName(table)}
                title="Click to rename"
                className={cn(
                  'text-sm font-semibold text-center w-full truncate hover:text-primary transition-colors',
                  !table.name && 'text-muted-foreground'
                )}
              >
                {displayName}
              </button>
            )}

            {/* QR URL */}
            <p className="text-[10px] text-muted-foreground/50 text-center leading-tight break-all line-clamp-2 w-full">
              {tableQrUrl(event.slug, table.table_number)}
            </p>

            {/* Actions */}
            <div className="flex gap-1 w-full mt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onDownloadPng(table)}
                disabled={!qrUrl}
              >
                <Download className="h-3 w-3" />
                PNG
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => onDelete(table)}
                title="Delete table"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
