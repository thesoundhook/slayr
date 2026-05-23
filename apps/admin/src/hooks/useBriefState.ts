import { useState, useCallback, useRef, useEffect } from 'react'
import type { BriefData } from '@/types/brief'
import { defaultBriefData } from '@/types/brief'
import { updateBrief } from '@/services/briefService'

interface UseBriefStateOptions {
  briefId: string | null
  initialData?: BriefData
  initialGate?: number
}

interface UseBriefStateReturn {
  data: BriefData
  update: <K extends keyof BriefData>(key: K, value: BriefData[K]) => void
  updateMany: (patch: Partial<BriefData>) => void
  currentGate: number
  setGate: (gate: number) => void
  saving: boolean
  reset: () => void
}

export function useBriefState({ briefId, initialData, initialGate = 1 }: UseBriefStateOptions): UseBriefStateReturn {
  const [data, setData] = useState<BriefData>(initialData ?? defaultBriefData())
  const [currentGate, setCurrentGate] = useState(initialGate)
  const [saving, setSaving] = useState(false)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestData = useRef(data)
  const latestGate = useRef(currentGate)
  latestData.current = data
  latestGate.current = currentGate

  const scheduleSave = useCallback(() => {
    if (!briefId) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await updateBrief(briefId, {
          data: latestData.current,
          current_gate: latestGate.current,
        })
      } catch {
        // silent — user can retry by navigating
      } finally {
        setSaving(false)
      }
    }, 1000)
  }, [briefId])

  const update = useCallback(<K extends keyof BriefData>(key: K, value: BriefData[K]) => {
    setData(prev => ({ ...prev, [key]: value }))
    scheduleSave()
  }, [scheduleSave])

  const updateMany = useCallback((patch: Partial<BriefData>) => {
    setData(prev => ({ ...prev, ...patch }))
    scheduleSave()
  }, [scheduleSave])

  const setGate = useCallback((gate: number) => {
    setCurrentGate(gate)
    scheduleSave()
  }, [scheduleSave])

  const reset = useCallback(() => {
    setData(defaultBriefData())
    setCurrentGate(1)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  return { data, update, updateMany, currentGate, setGate, saving, reset }
}
