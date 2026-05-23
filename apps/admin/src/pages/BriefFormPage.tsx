import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBriefState } from '@/hooks/useBriefState'
import { createBrief, getBriefById } from '@/services/briefService'
import { defaultBriefData } from '@/types/brief'
import BriefSideNav from '@/components/brief/BriefSideNav'
import BriefProgressBar from '@/components/brief/BriefProgressBar'
import Gate01 from '@/components/brief/gates/Gate01'
import Gate02 from '@/components/brief/gates/Gate02'
import Gate03 from '@/components/brief/gates/Gate03'
import Gate04 from '@/components/brief/gates/Gate04'
import Gate05 from '@/components/brief/gates/Gate05'
import Gate06 from '@/components/brief/gates/Gate06'
import Gate07 from '@/components/brief/gates/Gate07'
import Gate08 from '@/components/brief/gates/Gate08'
import Gate09 from '@/components/brief/gates/Gate09'
import Gate10 from '@/components/brief/gates/Gate10'
import Gate11 from '@/components/brief/gates/Gate11'
import Gate12 from '@/components/brief/gates/Gate12'
import Gate13 from '@/components/brief/gates/Gate13'
import Gate14 from '@/components/brief/gates/Gate14'
import Gate15 from '@/components/brief/gates/Gate15'
import Gate16 from '@/components/brief/gates/Gate16'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const TOTAL_GATES = 16

export default function BriefFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [bootstrapping, setBootstrapping] = useState(true)
  const [resolvedId, setResolvedId] = useState<string | null>(null)
  const [bootstrapData, setBootstrapData] = useState(defaultBriefData())
  const [bootstrapGate, setBootstrapGate] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) {
      createBrief(defaultBriefData())
        .then(newId => {
          navigate(`/briefs/${newId}`, { replace: true })
        })
        .catch(e => { setError(e.message); setBootstrapping(false) })
    } else {
      getBriefById(id!)
        .then(brief => {
          setResolvedId(brief.id)
          setBootstrapData(brief.data as unknown as ReturnType<typeof defaultBriefData>)
          setBootstrapGate(brief.current_gate ?? 1)
          setBootstrapping(false)
        })
        .catch(e => { setError(e.message); setBootstrapping(false) })
    }
  }, [id, isNew, navigate])

  if (bootstrapping) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button type="button" onClick={() => navigate('/briefs')} className="text-primary text-sm underline">Back to briefs</button>
      </div>
    )
  }

  return (
    <BriefForm
      briefId={resolvedId!}
      initialData={bootstrapData}
      initialGate={bootstrapGate}
      onBack={() => navigate('/briefs')}
    />
  )
}

interface BriefFormProps {
  briefId: string
  initialData: ReturnType<typeof defaultBriefData>
  initialGate: number
  onBack: () => void
}

function BriefForm({ briefId, initialData, initialGate, onBack }: BriefFormProps) {
  const { data, update, currentGate, setGate, saving } = useBriefState({
    briefId,
    initialData,
    initialGate,
  })

  const goTo = (gate: number) => setGate(Math.max(1, Math.min(TOTAL_GATES, gate)))

  const GateComponent = [
    Gate01, Gate02, Gate03, Gate04, Gate05, Gate06, Gate07, Gate08,
    Gate09, Gate10, Gate11, Gate12, Gate13, Gate14, Gate15, Gate16,
  ][currentGate - 1]

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-card border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Briefs
        </button>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {data.evtName || data.client || 'Untitled Brief'}
        </span>
      </div>

      {/* Progress */}
      <BriefProgressBar current={currentGate} total={TOTAL_GATES} saving={saving} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <BriefSideNav currentGate={currentGate} onGate={goTo} data={data} />

        <main className="flex-1 overflow-y-auto">
          <GateComponent data={data} update={update} />

          {/* Back / Continue */}
          <div className="flex items-center justify-between px-12 py-6 border-t border-border bg-card">
            <button
              type="button"
              onClick={() => goTo(currentGate - 1)}
              disabled={currentGate === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <span className="text-xs text-muted-foreground">Gate {String(currentGate).padStart(2, '0')} of {TOTAL_GATES}</span>

            {currentGate < TOTAL_GATES ? (
              <button
                type="button"
                onClick={() => goTo(currentGate + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-success text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Complete brief
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
