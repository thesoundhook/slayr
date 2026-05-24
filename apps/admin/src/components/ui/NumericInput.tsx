import { useState, useEffect, useRef, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number
  onChange: (value: number) => void
}

const fmt = (n: number) => (n > 0 ? n.toLocaleString('en') : '')

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const focused = useRef(false)
    const [display, setDisplay] = useState(fmt(value))

    useEffect(() => {
      if (!focused.current) setDisplay(fmt(value))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.target
      const cursorPos = el.selectionStart ?? 0
      const oldVal = el.value

      const digits = oldVal.replace(/[^0-9]/g, '')
      const num = parseInt(digits, 10) || 0
      const formatted = fmt(num)

      // Keep cursor in the right place after commas shift character positions
      const digitsBeforeCursor = oldVal.slice(0, cursorPos).replace(/[^0-9]/g, '').length
      let newCursor = formatted.length
      let seen = 0
      for (let i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted[i])) {
          seen++
          if (seen === digitsBeforeCursor) { newCursor = i + 1; break }
        }
      }

      setDisplay(formatted)
      onChange(num)
      requestAnimationFrame(() => el.setSelectionRange(newCursor, newCursor))
    }

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onFocus={e => { focused.current = true; props.onFocus?.(e) }}
        onBlur={e => { focused.current = false; setDisplay(fmt(value)); props.onBlur?.(e) }}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
    )
  }
)
NumericInput.displayName = 'NumericInput'
