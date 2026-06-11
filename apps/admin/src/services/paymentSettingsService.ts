import { supabase } from '@/lib/supabase'
import type { DbEventPaymentSettings } from '@/types/database'

export interface PaymentSettingsFormData {
  ordering_enabled: boolean
  accept_online: boolean
  accept_pos: boolean
  accept_transfer: boolean
  transfer_bank_code: string | null
  transfer_bank_name: string | null
  transfer_account_number: string | null
  transfer_account_name: string | null
  transfer_instructions: string | null
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettingsFormData = {
  ordering_enabled: true,
  accept_online: true,
  accept_pos: false,
  accept_transfer: false,
  transfer_bank_code: null,
  transfer_bank_name: null,
  transfer_account_number: null,
  transfer_account_name: null,
  transfer_instructions: null,
}

export async function getPaymentSettings(eventId: string): Promise<DbEventPaymentSettings | null> {
  const { data, error } = await supabase
    .from('event_payment_settings')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle()
  if (error) throw error
  return data as DbEventPaymentSettings | null
}

export async function savePaymentSettings(eventId: string, settings: PaymentSettingsFormData): Promise<void> {
  const { error } = await supabase
    .from('event_payment_settings')
    .upsert({ event_id: eventId, ...settings, updated_at: new Date().toISOString() })
  if (error) throw error
}

export interface Bank { name: string; code: string }

export async function listBanks(): Promise<Bank[]> {
  const { data, error } = await supabase.functions.invoke('list-banks')
  if (error) throw error
  return (data?.banks ?? []) as Bank[]
}

export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{ accountName: string }> {
  const { data, error } = await supabase.functions.invoke('resolve-account', {
    body: { accountNumber, bankCode },
  })
  if (error) {
    let msg = error.message ?? 'Could not resolve account'
    try {
      const body = await (error as { context?: Response }).context?.json()
      if (body?.error) msg = body.error
    } catch { /* keep original */ }
    throw new Error(msg)
  }
  return { accountName: data.accountName }
}
