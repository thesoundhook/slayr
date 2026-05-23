import { useState, useRef, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Camera, CameraOff, Search, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import PageHero from '@/components/ui/PageHero'
import { getTicketByQrCode, markTicketUsed } from '@/services/orderService'
import type { DbTicket } from '@/types/database'
import jsQR from 'jsqr'

type ScannedTicket = DbTicket & {
  orders: { customer_first_name: string; customer_last_name: string; customer_email: string } | null
  ticket_types: { name: string; type: string } | null
  events: { title: string } | null
}

type ScanResult =
  | { status: 'valid'; ticket: ScannedTicket }
  | { status: 'already_used'; ticket: ScannedTicket }
  | { status: 'not_found' }

export default function ScanPage() {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraSupported] = useState(() => 'mediaDevices' in navigator)
  const useNativeDetector = 'BarcodeDetector' in window
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasScannedRef = useRef(false)

  useEffect(() => () => stopCamera(), [])

  const lookup = useCallback(async (qrCode: string) => {
    const code = qrCode.trim()
    if (!code || loading) return
    setLoading(true)
    setResult(null)
    try {
      const ticket = await getTicketByQrCode(code)
      if (!ticket) {
        setResult({ status: 'not_found' })
      } else if (ticket.used) {
        setResult({ status: 'already_used', ticket: ticket as ScannedTicket })
      } else {
        await markTicketUsed(ticket.id)
        setResult({ status: 'valid', ticket: { ...ticket, used: true, used_at: new Date().toISOString() } as ScannedTicket })
      }
    } catch {
      setResult({ status: 'not_found' })
    } finally {
      setLoading(false)
      setInputValue('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [loading])

  const startCamera = async () => {
    hasScannedRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      scanFrame()
    } catch {
      alert('Camera access denied or unavailable.')
    }
  }

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  const scanFrame = async () => {
    if (!videoRef.current || hasScannedRef.current) return

    let found: string | null = null

    if (useNativeDetector) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        const codes = await detector.detect(videoRef.current)
        if (codes.length > 0) found = codes[0].rawValue
      } catch {}
    } else {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code) found = code.data
        }
      }
    }

    if (found) {
      hasScannedRef.current = true
      stopCamera()
      lookup(found)
      return
    }

    animFrameRef.current = requestAnimationFrame(scanFrame)
  }

  const statusConfig = result ? {
    valid: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="h-9 w-9 text-green-600" />,
      title: 'Valid — Entry granted',
      titleColor: 'text-green-800',
    },
    already_used: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <XCircle className="h-9 w-9 text-amber-500" />,
      title: 'Already scanned',
      titleColor: 'text-amber-800',
    },
    not_found: {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle className="h-9 w-9 text-red-500" />,
      title: 'Ticket not found',
      titleColor: 'text-red-800',
    },
  }[result.status] : null

  return (
    <>
      <PageHero
        badge="Events"
        title="Ticket Scanner"
        subtitle="Scan a QR code or paste it below to validate entry."
        ghost="05"
      />

      <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-4">
        {/* Input row */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            autoFocus
            placeholder="Paste or scan QR code here..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup(inputValue)}
            disabled={loading}
          />
          <Button onClick={() => lookup(inputValue)} disabled={loading || !inputValue.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Camera */}
        {cameraSupported && (
          !cameraActive ? (
            <Button variant="outline" className="w-full" onClick={startCamera} disabled={loading}>
              <Camera className="h-4 w-4" />
              Use Camera
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <ScanLine className="h-16 w-16 text-white/60 animate-pulse" />
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={stopCamera}>
                <CameraOff className="h-4 w-4" />
                Stop Camera
              </Button>
            </div>
          )
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Result card */}
        {!loading && result && statusConfig && (
          <div className={`rounded-xl border p-5 ${statusConfig.bg}`}>
            <div className="flex items-center gap-3 mb-4">
              {statusConfig.icon}
              <div>
                <p className={`font-semibold text-base ${statusConfig.titleColor}`}>
                  {statusConfig.title}
                </p>
                {result.status === 'already_used' && result.ticket.used_at && (
                  <p className="text-sm text-amber-600 mt-0.5">
                    Scanned at {new Date(result.ticket.used_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {'ticket' in result && result.ticket && (
              <div className="space-y-2.5 text-sm border-t border-current/10 pt-4 mt-4">
                <Row label="Name" value={`${result.ticket.orders?.customer_first_name} ${result.ticket.orders?.customer_last_name}`} />
                <Row label="Email" value={result.ticket.orders?.customer_email ?? '—'} />
                <Row label="Ticket" value={result.ticket.ticket_types?.name ?? '—'} />
                <Row label="Event" value={result.ticket.events?.title ?? '—'} />
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Works with hardware QR scanners — just focus this page and scan.
        </p>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
