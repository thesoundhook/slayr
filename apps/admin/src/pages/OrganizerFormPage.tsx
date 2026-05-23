import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getOrganizers, createOrganizer, updateOrganizer, type OrganizerFormData } from '@/services/eventService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'
import LogoUpload from '@/components/ui/LogoUpload'

const empty: OrganizerFormData = {
  name: '',
  logo_url: null,
  description: null,
  verified: false,
}

type FieldErrors = Partial<Record<keyof OrganizerFormData, string>>

function validate(form: OrganizerFormData): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  return errors
}

export default function OrganizerFormPage() {
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
  const [form, setForm] = useState<OrganizerFormData>(empty)

  useEffect(() => {
    if (!isEdit) return
    getOrganizers().then(organizers => {
      const org = organizers.find(o => o.id === id)
      if (org) {
        setForm({
          name: org.name,
          logo_url: org.logo_url,
          description: org.description,
          verified: org.verified,
        })
      }
      setLoading(false)
    }).catch(console.error)
  }, [id, isEdit])

  const set = <K extends keyof OrganizerFormData>(field: K, value: OrganizerFormData[K]) => {
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
        await updateOrganizer(id!, form)
        navigate(returnTo ?? '/organizers')
      } else {
        const org = await createOrganizer(form)
        if (returnTo && returnParam) {
          navigate(`${returnTo}?${returnParam}=${org.id}`)
        } else {
          navigate('/organizers')
        }
      }
    } catch (err: unknown) {
      setSubmitError((err as { message?: string })?.message ?? 'Failed to save organizer')
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
        title={isEdit ? 'Edit Organizer' : 'New Organizer'}
        subtitle={isEdit ? 'Update organizer details.' : 'Add a new organizer to the platform.'}
        ghost={isEdit ? '✎' : '+'}
        actions={
          <Button variant="outline" onClick={() => navigate('/organizers')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <div className="p-4 sm:p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Organizer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Flytime Promotions" />
                {fieldErrors.name && <p className="text-destructive text-xs mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <LogoUpload value={form.logo_url} onChange={url => set('logo_url', url)} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={e => set('description', e.target.value || null)}
                  placeholder="Brief description of the organizer…"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="verified"
                  type="checkbox"
                  checked={form.verified}
                  onChange={e => set('verified', e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="verified" className="text-sm font-medium">Verified organizer</label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/organizers')}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Organizer'}</Button>
          </div>
        </form>
      </div>
    </>
  )
}
