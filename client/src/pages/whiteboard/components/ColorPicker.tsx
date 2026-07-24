import { useState } from 'react'
import { cn } from '@/utils/cn'
import { COLORS } from '../utils/drawing'

interface ColorPickerProps {
  color: string
  recentColors: string[]
  onChange: (color: string) => void
}

const SWATCH_SIZE = 'w-6 h-6'

export function ColorPicker({ color, recentColors, onChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-6 gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={cn(
              SWATCH_SIZE,
              'rounded-md border-2 transition-all duration-150 hover:scale-110',
              color === c ? 'border-primary-500 scale-110 ring-2 ring-primary-300' : 'border-border',
            )}
            style={{ backgroundColor: c }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>

      {recentColors.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mr-1">
            Recent
          </span>
          {recentColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn(
                'w-5 h-5 rounded-sm border border-border transition-all duration-150 hover:scale-110',
                color === c && 'ring-2 ring-primary-300',
              )}
              style={{ backgroundColor: c }}
              aria-label={`Recent color ${c}`}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-md transition-colors',
            showCustom
              ? 'bg-primary-100 text-primary-700'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary',
          )}
        >
          Custom
        </button>
        {showCustom && (
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 p-0.5 rounded cursor-pointer border border-border bg-transparent"
            aria-label="Custom color"
          />
        )}
      </div>
    </div>
  )
}
