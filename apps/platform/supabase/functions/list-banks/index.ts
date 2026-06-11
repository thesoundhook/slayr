import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const currency = url.searchParams.get('currency') ?? 'NGN'

    const res = await fetch(`https://api.paystack.co/bank?currency=${currency}&perPage=100`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    })
    const data = await res.json()

    if (!data.status) {
      return json({ error: data.message ?? 'Failed to fetch banks' }, 400)
    }

    // Return only what the UI needs, de-duplicated by code
    const seen = new Set<string>()
    const banks = (data.data as { name: string; code: string }[])
      .filter(b => { if (seen.has(b.code)) return false; seen.add(b.code); return true })
      .map(b => ({ name: b.name, code: b.code }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return json({ banks })
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
