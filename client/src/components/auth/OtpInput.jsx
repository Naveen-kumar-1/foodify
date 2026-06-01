import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6

const OtpInput = ({ value = '', onChange, disabled = false, hasError = false, autoFocus = true }) => {
  const inputsRef = useRef([])

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '')

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus()
    }
  }, [autoFocus])

  const updateValue = (nextDigits) => {
    onChange(nextDigits.join('').slice(0, OTP_LENGTH))
  }

  const focusInput = (index) => {
    const input = inputsRef.current[index]
    if (input) input.focus()
  }

  const handleChange = (index, char) => {
    const sanitized = char.replace(/\D/g, '')
    const next = [...digits]

    if (!sanitized) {
      next[index] = ''
      updateValue(next)
      return
    }

    next[index] = sanitized[sanitized.length - 1]
    updateValue(next)

    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const next = [...digits]
      if (next[index]) {
        next[index] = ''
        updateValue(next)
      } else if (index > 0) {
        next[index - 1] = ''
        updateValue(next)
        focusInput(index - 1)
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) focusInput(index - 1)
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) focusInput(index + 1)
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    onChange(pasted)
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="One-time password input">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            'size-11 rounded-lg border bg-background text-center text-lg font-semibold shadow-xs transition-all outline-none sm:size-12',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            hasError && 'border-destructive ring-destructive/20',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}

export const OTP_LENGTH_EXPORT = OTP_LENGTH
export default OtpInput
