interface PaystackPopConfig {
  key: string
  email: string
  amount: number        // kobo
  currency?: string     // 'NGN' by default
  ref: string
  firstname?: string
  lastname?: string
  phone?: string
  metadata?: Record<string, unknown>
  callback: (response: { reference: string; status: string }) => void
  onClose: () => void
}

interface PaystackPopInstance {
  openIframe(): void
}

interface Window {
  PaystackPop: {
    setup(config: PaystackPopConfig): PaystackPopInstance
  }
}
