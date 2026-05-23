interface RangeSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (n: number) => string
  onChange: (value: number) => void
  bands?: string[]
}

export default function RangeSlider({ label, value, min, max, step, format, onChange, bands }: RangeSliderProps) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xl font-bold text-foreground">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full bg-border outline-none cursor-pointer accent-primary"
      />
      {bands && (
        <div className="flex justify-between mt-1">
          {bands.map(b => (
            <span key={b} className="text-[10px] text-muted-foreground">{b}</span>
          ))}
        </div>
      )}
    </div>
  )
}
