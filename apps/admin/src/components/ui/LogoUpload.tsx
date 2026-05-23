import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoUploadProps {
  value: string | null
  onChange: (url: string | null) => void
}

export default function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('File must be an image'); return }
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `organizer-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('event-images')
      .upload(path, file, { upsert: false })
    if (upErr) { setError(upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('event-images').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'relative h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-colors',
          uploading ? 'cursor-wait border-input' : 'cursor-pointer border-input hover:border-primary/60 hover:bg-muted/50',
        )}
      >
        {value ? (
          <img src={value} alt="Logo" className="h-full w-full object-cover" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      <div className="space-y-1 min-w-0">
        <p className="text-sm text-muted-foreground">
          {uploading ? 'Uploading…' : value ? 'Click logo to replace' : 'Click to upload logo'}
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP · Recommended 200×200px</p>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-xs text-destructive hover:underline"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
