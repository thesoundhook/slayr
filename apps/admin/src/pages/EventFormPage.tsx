import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  getEventById,
  getVenues,
  getOrganizers,
  createEvent,
  updateEvent,
  type EventFormData,
  type TicketTypeFormData,
} from '@/services/eventService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import ImageUpload from '@/components/ui/ImageUpload'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHero from '@/components/ui/PageHero'

const CATEGORIES = ['music', 'art', 'food', 'sports', 'tech', 'comedy', 'fashion', 'film', 'business', 'other']
const TICKET_TYPES = ['general', 'vip', 'early-bird', 'group'] as const

const emptyTicket = (): TicketTypeFormData => ({
  name: '',
  description: null,
  price: 0,
  original_price: null,
  quantity: 100,
  max_per_order: 10,
  sales_start: null,
  sales_end: null,
  type: 'general',
})

type FieldErrors = Partial<Record<string, string>>

function validate(form: EventFormData, tickets: TicketTypeFormData[]): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.title.trim()) errors.title = 'Title is required'
  if (!form.description.trim()) errors.description = 'Description is required'
  if (!form.date) errors.date = 'Date is required'
  if (!form.time) errors.time = 'Time is required'
  if (!form.venue_id) errors.venue_id = 'Select a venue'
  if (!form.organizer_id) errors.organizer_id = 'Select an organizer'
  tickets.forEach((t, i) => {
    if (!t.name.trim()) errors[`ticket_name_${i}`] = 'Name required'
    if (t.price <= 0) errors[`ticket_price_${i}`] = 'Price must be > 0'
    if (t.quantity <= 0) errors[`ticket_qty_${i}`] = 'Qty must be > 0'
  })
  return errors
}

const DRAFT_KEY = 'eventFormDraft'

export default function EventFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [venues, setVenues] = useState<{ id: string; name: string }[]>([])
  const [organizers, setOrganizers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [collapsedTickets, setCollapsedTickets] = useState<Set<number>>(new Set())

  const [form, setForm] = useState<EventFormData>({
    title: '',
    description: '',
    category: 'music',
    date: '',
    time: '',
    venue_id: '',
    organizer_id: '',
    images: [],
    tags: [],
    total_capacity: 0,
    featured: false,
    status: 'upcoming',
  })

  const [tagsStr, setTagsStr] = useState('')
  const [tickets, setTickets] = useState<TicketTypeFormData[]>([emptyTicket()])

  // Auto-sum total_capacity from ticket quantities
  const autoCapacity = tickets.reduce((sum, t) => sum + (t.quantity || 0), 0)

  useEffect(() => {
    const newVenueId = searchParams.get('newVenueId')
    const newOrganizerId = searchParams.get('newOrganizerId')
    const rawDraft = sessionStorage.getItem(DRAFT_KEY)
    const draft = rawDraft ? JSON.parse(rawDraft) as { form: EventFormData; tickets: TicketTypeFormData[]; tagsStr: string } : null

    async function load() {
      const [v, o] = await Promise.all([getVenues(), getOrganizers()])
      setVenues(v)
      setOrganizers(o)

      // Returning from venue/organizer creation — restore saved draft
      if (draft && (newVenueId || newOrganizerId)) {
        sessionStorage.removeItem(DRAFT_KEY)
        setForm({
          ...draft.form,
          ...(newVenueId ? { venue_id: newVenueId } : {}),
          ...(newOrganizerId ? { organizer_id: newOrganizerId } : {}),
        })
        setTickets(draft.tickets)
        setTagsStr(draft.tagsStr)
      } else if (isEdit && id) {
        const event = await getEventById(id)
        setForm({
          title: event.title,
          description: event.description,
          category: event.category,
          date: event.date,
          time: event.time,
          venue_id: event.venue_id,
          organizer_id: event.organizer_id,
          images: event.images,
          tags: event.tags,
          total_capacity: event.total_capacity,
          featured: event.featured,
          status: event.status,
        })
        setTagsStr(event.tags.join(', '))
        if (event.ticket_types && event.ticket_types.length > 0) {
          setTickets(event.ticket_types.map(tt => ({
            id: tt.id,
            name: tt.name,
            description: tt.description,
            price: tt.price,
            original_price: tt.original_price,
            quantity: tt.quantity,
            max_per_order: tt.max_per_order,
            sales_start: tt.sales_start,
            sales_end: tt.sales_end,
            type: tt.type,
          })))
        }
      } else {
        if (v.length > 0) setForm(f => ({ ...f, venue_id: v[0].id }))
        if (o.length > 0) setForm(f => ({ ...f, organizer_id: o[0].id }))
      }
      setLoading(false)
    }
    load().catch(console.error)
  }, [id, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validate(form, tickets)
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setFieldErrors({})
    setSaving(true)
    setSubmitError(null)
    try {
      const eventData: EventFormData = {
        ...form,
        total_capacity: autoCapacity,
        tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean),
      }
      if (isEdit && id) {
        await updateEvent(id, eventData, tickets)
      } else {
        await createEvent(eventData, tickets)
      }
      navigate('/events')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'An error occurred')
      setSaving(false)
    }
  }

  const updateTicket = (index: number, field: keyof TicketTypeFormData, value: unknown) => {
    setTickets(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
  }

  const removeTicket = (index: number) => {
    setTickets(prev => prev.filter((_, i) => i !== index))
    setCollapsedTickets(prev => {
      const next = new Set<number>()
      prev.forEach(n => { if (n < index) next.add(n); else if (n > index) next.add(n - 1) })
      return next
    })
  }

  const addTicket = () => {
    setTickets(prev => [...prev, emptyTicket()])
  }

  const toggleCollapse = (index: number) => {
    setCollapsedTickets(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  const saveDraftAndNavigate = (destination: string) => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, tickets, tagsStr }))
    navigate(destination)
  }

  const returnTo = isEdit ? `/events/${id}/edit` : '/events/new'

  const field = (key: string) => fieldErrors[key]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <>
      <PageHero
        badge="Create / Edit"
        title={isEdit ? 'Edit Event' : 'New Event'}
        subtitle={isEdit ? 'Update the details for this event.' : 'Fill in the details to publish a new event on the platform.'}
        ghost={isEdit ? '02' : '02'}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-3xl">

      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
        <CardContent className="space-y-5">

          <Field label="Title" error={field('title')}>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Asake Listening Party Akure"
              className={cn(field('title') && 'border-destructive')}
            />
          </Field>

          <Field label="Description" error={field('description')}>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={5}
              placeholder="Describe the event — what to expect, who it's for, what's included…"
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none',
                field('description') && 'border-destructive'
              )}
            />
            <p className="text-xs text-muted-foreground text-right">{form.description.length} chars</p>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select
                value={form.category}
                onChange={v => setForm(f => ({ ...f, category: v }))}
                options={CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={v => setForm(f => ({ ...f, status: v as EventFormData['status'] }))}
                options={[
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'ongoing', label: 'Ongoing' },
                  { value: 'past', label: 'Past' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" error={field('date')}>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={cn(field('date') && 'border-destructive')}
              />
            </Field>
            <Field label="Time" error={field('time')}>
              <Input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className={cn(field('time') && 'border-destructive')}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Venue"
              error={field('venue_id')}
              action={
                <button type="button" onClick={() => saveDraftAndNavigate(`/venues/new?returnTo=${encodeURIComponent(returnTo)}&returnParam=newVenueId`)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> New venue
                </button>
              }
            >
              <Select
                value={form.venue_id}
                onChange={v => setForm(f => ({ ...f, venue_id: v }))}
                options={[{ value: '', label: 'Select venue…' }, ...venues.map(v => ({ value: v.id, label: v.name }))]}
                className={cn(field('venue_id') && 'border-destructive')}
              />
            </Field>
            <Field
              label="Organizer"
              error={field('organizer_id')}
              action={
                <button type="button" onClick={() => saveDraftAndNavigate(`/organizers/new?returnTo=${encodeURIComponent(returnTo)}&returnParam=newOrganizerId`)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> New organizer
                </button>
              }
            >
              <Select
                value={form.organizer_id}
                onChange={v => setForm(f => ({ ...f, organizer_id: v }))}
                options={[{ value: '', label: 'Select organizer…' }, ...organizers.map(o => ({ value: o.id, label: o.name }))]}
                className={cn(field('organizer_id') && 'border-destructive')}
              />
            </Field>
          </div>

          <Field label="Tags">
            <Input
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              placeholder="afrobeats, party, live music  (comma-separated)"
            />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={form.featured}
              onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                form.featured ? 'bg-primary' : 'bg-input'
              )}
            >
              <span className={cn('pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform', form.featured ? 'translate-x-4' : 'translate-x-0')} />
            </button>
            <label className="text-sm font-medium">Featured on homepage</label>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader><CardTitle>Event Images</CardTitle></CardHeader>
        <CardContent>
          <ImageUpload
            images={form.images}
            onChange={urls => setForm(f => ({ ...f, images: urls }))}
          />
        </CardContent>
      </Card>

      {/* Ticket types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ticket Types</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Total capacity: <span className="font-semibold text-foreground">{autoCapacity.toLocaleString()}</span>
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTicket}>
              <Plus className="h-4 w-4" />
              Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.map((ticket, idx) => {
            const collapsed = collapsedTickets.has(idx)
            const hasError = field(`ticket_name_${idx}`) || field(`ticket_price_${idx}`) || field(`ticket_qty_${idx}`)
            return (
              <div key={idx} className={cn('rounded-lg border', hasError && 'border-destructive/50')}>
                {/* Header row */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleCollapse(idx)}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide',
                      ticket.type === 'vip' ? 'bg-violet-100 text-violet-700' :
                      ticket.type === 'early-bird' ? 'bg-green-100 text-green-700' :
                      ticket.type === 'group' ? 'bg-blue-100 text-blue-700' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {ticket.type}
                    </span>
                    <span className="font-medium text-sm">{ticket.name || `Ticket Type ${idx + 1}`}</span>
                    {!collapsed && ticket.price > 0 && (
                      <span className="text-xs text-muted-foreground">₦{(ticket.price / 100).toLocaleString()} · {ticket.quantity.toLocaleString()} available</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {tickets.length > 1 && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeTicket(idx) }}
                        className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {!collapsed && (
                  <div className="px-4 pb-4 space-y-4 border-t">
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <Field label="Name" error={field(`ticket_name_${idx}`)}>
                        <Input
                          value={ticket.name}
                          onChange={e => updateTicket(idx, 'name', e.target.value)}
                          placeholder="e.g. General Admission"
                          className={cn(field(`ticket_name_${idx}`) && 'border-destructive')}
                        />
                      </Field>
                      <Field label="Type">
                        <Select
                          value={ticket.type}
                          onChange={v => updateTicket(idx, 'type', v)}
                          options={TICKET_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Price (₦)" error={field(`ticket_price_${idx}`)}>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                          <Input
                            type="number"
                            min={0}
                            value={ticket.price > 0 ? ticket.price / 100 : ''}
                            onChange={e => updateTicket(idx, 'price', Math.round((parseFloat(e.target.value) || 0) * 100))}
                            placeholder="0"
                            className={cn('pl-7', field(`ticket_price_${idx}`) && 'border-destructive')}
                          />
                        </div>
                      </Field>
                      <Field label="Quantity" error={field(`ticket_qty_${idx}`)}>
                        <Input
                          type="number"
                          min={1}
                          value={ticket.quantity || ''}
                          onChange={e => updateTicket(idx, 'quantity', parseInt(e.target.value) || 0)}
                          className={cn(field(`ticket_qty_${idx}`) && 'border-destructive')}
                        />
                      </Field>
                      <Field label="Max per Order">
                        <Input
                          type="number"
                          min={1}
                          value={ticket.max_per_order || ''}
                          onChange={e => updateTicket(idx, 'max_per_order', parseInt(e.target.value) || 1)}
                        />
                      </Field>
                    </div>

                    <Field label="Description (optional)">
                      <Input
                        value={ticket.description ?? ''}
                        onChange={e => updateTicket(idx, 'description', e.target.value || null)}
                        placeholder="What's included with this ticket?"
                      />
                    </Field>

                    {ticket.original_price === null && ticket.type !== 'early-bird' ? null : (
                      <Field label="Original price (₦) — shown as strikethrough">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                          <Input
                            type="number"
                            min={0}
                            value={ticket.original_price ? ticket.original_price / 100 : ''}
                            onChange={e => updateTicket(idx, 'original_price', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                            placeholder="0"
                            className="pl-7"
                          />
                        </div>
                      </Field>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div className="flex gap-3 pb-8">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/events')}>
          Cancel
        </Button>
      </div>
    </form>
    </>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Field({ label, error, action, children }: { label: string; error?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {action}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function Select({
  value, onChange, options, className,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
