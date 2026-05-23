import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getVenues, createVenue, updateVenue, type VenueFormData } from '@/services/eventService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'

const empty: VenueFormData = {
  name: '',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  capacity: 0,
  has_seating_chart: false,
}

type FieldErrors = Partial<Record<keyof VenueFormData, string>>

function validate(form: VenueFormData): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.address.trim()) errors.address = 'Address is required'
  if (!form.city.trim()) errors.city = 'City is required'
  if (!form.state.trim()) errors.state = 'State is required'
  if (!form.country.trim()) errors.country = 'Country is required'
  if (form.capacity <= 0) errors.capacity = 'Capacity must be greater than 0'
  return errors
}

export default function VenueFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const returnParam = searchParams.get('returnParam')

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState<VenueFormData>(empty)

  useEffect(() => {
    if (!isEdit) return
    getVenues().then(venues => {
      const venue = venues.find(v => v.id === id)
      if (venue) {
        setForm({
          name: venue.name,
          address: venue.address,
          city: venue.city,
          state: venue.state,
          country: venue.country,
          capacity: venue.capacity,
          has_seating_chart: venue.has_seating_chart,
        })
      }
      setLoading(false)
    }).catch(console.error)
  }, [id, isEdit])

  const set = (field: keyof VenueFormData, value: VenueFormData[keyof VenueFormData]) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validate(form)
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setSaving(true)
    setSubmitError(null)
    try {
      if (isEdit) {
        await updateVenue(id!, form)
        navigate(returnTo ?? '/venues')
      } else {
        const venue = await createVenue(form)
        if (returnTo && returnParam) {
          navigate(`${returnTo}?${returnParam}=${venue.id}`)
        } else {
          navigate('/venues')
        }
      }
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Failed to save venue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <>
      <PageHero
        badge="Catalogue"
        title={isEdit ? 'Edit Venue' : 'New Venue'}
        subtitle={isEdit ? 'Update venue details.' : 'Add a new venue to the platform.'}
        ghost={isEdit ? '✎' : '+'}
        actions={
          <Button variant="outline" onClick={() => navigate('/venues')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Venue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Eko Convention Centre" />
                {fieldErrors.name && <p className="text-destructive text-xs mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
                {fieldErrors.address && <p className="text-destructive text-xs mt-1">{fieldErrors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lagos" />
                  {fieldErrors.city && <p className="text-destructive text-xs mt-1">{fieldErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Lagos State" />
                  {fieldErrors.state && <p className="text-destructive text-xs mt-1">{fieldErrors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <Input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Nigeria" />
                  {fieldErrors.country && <p className="text-destructive text-xs mt-1">{fieldErrors.country}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.capacity || ''}
                    onChange={e => set('capacity', parseInt(e.target.value) || 0)}
                    placeholder="5000"
                  />
                  {fieldErrors.capacity && <p className="text-destructive text-xs mt-1">{fieldErrors.capacity}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="has_seating_chart"
                  type="checkbox"
                  checked={form.has_seating_chart}
                  onChange={e => set('has_seating_chart', e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="has_seating_chart" className="text-sm font-medium">Has seating chart</label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/venues')}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Venue'}</Button>
          </div>
        </form>
      </div>
    </>
  )
}
