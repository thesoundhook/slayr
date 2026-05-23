import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  images: string[]
  onChange: (urls: string[]) => void
}

export default function ImageUpload({ images, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const uploadFiles = async (files: FileList) => {
    setUploading(true)
    setError(null)
    const uploaded: string[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('event-images')
        .upload(path, file, { upsert: false })

      if (upErr) { setError(upErr.message); continue }

      const { data } = supabase.storage.from('event-images').getPublicUrl(path)
      uploaded.push(data.publicUrl)
    }

    onChange([...images, ...uploaded])
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  const remove = (url: string) => onChange(images.filter(u => u !== url))

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">{uploading ? 'Uploading…' : 'Click or drag images here'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP up to 5MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map(url => (
            <div key={url} className="relative group rounded-lg overflow-hidden aspect-video bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length === 0 && (
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
