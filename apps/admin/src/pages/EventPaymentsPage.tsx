import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, Wallet, Banknote, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { getEventById } from '@/services/eventService'
import {
  getPaymentSettings, savePaymentSettings, listBanks, resolveAccount,
  DEFAULT_PAYMENT_SETTINGS, type PaymentSettingsFormData, type Bank,
} from '@/services/paymentSettingsService'
import type { DbEvent } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PageHero from '@/components/ui/PageHero'
import { cn } from '@/lib/utils'

export default function EventPaymentsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [event, setEvent]       = useState<DbEvent | null>(null)
  const [settings, setSettings] = useState<PaymentSettingsFormData>(DEFAULT_PAYMENT_SETTINGS)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [saved, setSaved]       = useState(false)

  // Bank resolution
  const [banks, setBanks]           = useState<Bank[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [resolving, setResolving]   = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getEventById(id)
      .then(async ev => {
        setEvent(ev)
        const s = await getPaymentSettings(ev.id)
        if (s) {
          setSettings({
            ordering_enabled: s.ordering_enabled,
            accept_online: s.accept_online,
            accept_pos: s.accept_pos,
            accept_transfer: s.accept_transfer,
            transfer_bank_code: s.transfer_bank_code,
            transfer_bank_name: s.transfer_bank_name,
            transfer_account_number: s.transfer_account_number,
            transfer_account_name: s.transfer_account_name,
            transfer_instructions: s.transfer_instructions,
            notify_whatsapp_number: s.notify_whatsapp_number,
          })
        }
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  // Lazy-load banks the first time transfer is enabled
  useEffect(() => {
    if (settings.accept_transfer && banks.length === 0 && !banksLoading) {
      setBanksLoading(true)
      listBanks()
        .then(setBanks)
        .catch(err => setError(`Could not load banks: ${(err as Error).message}`))
        .finally(() => setBanksLoading(false))
    }
  }, [settings.accept_transfer]) // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (p: Partial<PaymentSettingsFormData>) => {
    setSettings(prev => ({ ...prev, ...p }))
    setSaved(false)
  }

  const handleResolve = async () => {
    if (!settings.transfer_bank_code || !settings.transfer_account_number) return
    setResolving(true)
    setResolveError(null)
    patch({ transfer_account_name: null })
    try {
      const { accountName } = await resolveAccount(settings.transfer_account_number, settings.transfer_bank_code)
      patch({ transfer_account_name: accountName })
    } catch (err) {
      setResolveError((err as Error).message)
    } finally {
      setResolving(false)
    }
  }

  // Auto-resolve when account number reaches 10 digits and a bank is picked
  useEffect(() => {
    const acct = settings.transfer_account_number ?? ''
    if (settings.accept_transfer && settings.transfer_bank_code && acct.length === 10 && !settings.transfer_account_name) {
      handleResolve()
    }
  }, [settings.transfer_account_number, settings.transfer_bank_code]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!event) return
    // Guard: transfer enabled but account not validated
    if (settings.accept_transfer && !settings.transfer_account_name) {
      setError('Validate the transfer account before saving (pick a bank and enter the account number).')
      return
    }
    if (!settings.accept_online && !settings.accept_pos && !settings.accept_transfer) {
      setError('Enable at least one payment method.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await savePaymentSettings(event.id, settings)
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!event)  return <div className="p-6 text-muted-foreground">Event not found.</div>

  return (
    <>
      <PageHero
        badge="Payments"
        title={`Payments — ${event.title}`}
        subtitle="Choose how guests pay for table orders at this event."
        ghost="06"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/events/${event.slug}/edit`)}>
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex justify-between">
            {error}
            <button onClick={() => setError(null)} className="underline text-xs">dismiss</button>
          </div>
        )}

        {/* Master toggle */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Table ordering enabled</p>
              <p className="text-xs text-muted-foreground mt-0.5">Turn off to hide the menu order button entirely.</p>
            </div>
            <Toggle checked={settings.ordering_enabled} onChange={v => patch({ ordering_enabled: v })} />
          </CardContent>
        </Card>

        {/* Methods */}
        <Card>
          <CardHeader><CardTitle className="text-base">Payment methods</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <MethodRow
              icon={CreditCard}
              title="Online (Paystack)"
              subtitle="Card, transfer or USSD — auto-verified"
              checked={settings.accept_online}
              onChange={v => patch({ accept_online: v })}
            />
            <MethodRow
              icon={Wallet}
              title="POS / Cash at table"
              subtitle="Attendant collects, then marks the order paid"
              checked={settings.accept_pos}
              onChange={v => patch({ accept_pos: v })}
            />
            <MethodRow
              icon={Banknote}
              title="Direct bank transfer"
              subtitle="Guests transfer to your account; staff confirms"
              checked={settings.accept_transfer}
              onChange={v => patch({ accept_transfer: v })}
            />
          </CardContent>
        </Card>

        {/* Transfer account config */}
        {settings.accept_transfer && (
          <Card>
            <CardHeader><CardTitle className="text-base">Transfer account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bank</label>
                <select
                  value={settings.transfer_bank_code ?? ''}
                  onChange={e => {
                    const bank = banks.find(b => b.code === e.target.value)
                    patch({ transfer_bank_code: e.target.value || null, transfer_bank_name: bank?.name ?? null, transfer_account_name: null })
                  }}
                  disabled={banksLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{banksLoading ? 'Loading banks…' : 'Select bank…'}</option>
                  {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Account number</label>
                <Input
                  value={settings.transfer_account_number ?? ''}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10)
                    patch({ transfer_account_number: v || null, transfer_account_name: null })
                    setResolveError(null)
                  }}
                  placeholder="10-digit account number"
                  inputMode="numeric"
                />
              </div>

              {/* Resolution result */}
              {resolving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying account…
                </div>
              )}
              {resolveError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> {resolveError}
                </div>
              )}
              {settings.transfer_account_name && !resolving && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-sm font-semibold text-green-800">{settings.transfer_account_name}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Instructions to guests (optional)</label>
                <Input
                  value={settings.transfer_instructions ?? ''}
                  onChange={e => patch({ transfer_instructions: e.target.value || null })}
                  placeholder="e.g. Use your table number as the transfer narration"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp notifications */}
        <Card>
          <CardHeader><CardTitle className="text-base">WhatsApp notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Guests automatically get order updates on the phone number they provide. Optionally add a staff number to receive a WhatsApp alert for every new order.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Staff alert number (optional)</label>
              <Input
                value={settings.notify_whatsapp_number ?? ''}
                onChange={e => patch({ notify_whatsapp_number: e.target.value || null })}
                placeholder="e.g. 08012345678"
                inputMode="tel"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Settings
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </>
  )
}

// ── Small components ────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        checked ? 'bg-primary' : 'bg-input'
      )}
    >
      <span className={cn('pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  )
}

function MethodRow({ icon: Icon, title, subtitle, checked, onChange }: {
  icon: React.ElementType; title: string; subtitle: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-4 transition-colors', checked ? 'border-primary/40 bg-primary/5' : 'border-border')}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', checked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}
