'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Common color options
export const COMMON_COLORS = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Black',
  'White',
  'Gray',
  'Orange',
  'Purple',
  'Pink',
  'Brown',
  'Beige',
  'Navy',
  'Maroon',
  'Teal',
  'Gold',
  'Silver',
]

interface ColorQuickSelectProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ColorQuickSelect({
  value = '',
  onChange,
  disabled = false
}: ColorQuickSelectProps) {
  const [customColor, setCustomColor] = React.useState('')

  const handleCustomColorAdd = () => {
    const trimmed = customColor.trim()
    if (trimmed) {
      onChange(trimmed)
      setCustomColor('')
    }
  }

  return (
    <div className="space-y-4">
      <Label>Product Color</Label>

      {/* Manual Input - ABOVE quick select */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Or enter custom color (e.g., Rose Gold, Midnight Blue)"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCustomColorAdd()
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCustomColorAdd}
          disabled={disabled || !customColor.trim()}
        >
          Set
        </Button>
      </div>

      {/* Quick Select Colors */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Quick Select:</Label>
        <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
          <div className="flex flex-wrap gap-2">
            {COMMON_COLORS.map((color) => (
              <div key={color} className="flex items-center space-x-2">
                <RadioGroupItem value={color} id={`color-${color}`} />
                <Label
                  htmlFor={`color-${color}`}
                  className="cursor-pointer flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                  {color}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Selected Color Preview */}
      {value && (
        <div className="text-sm flex items-center gap-2">
          <span className="text-muted-foreground">Selected: </span>
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: value.toLowerCase() }}
          />
          <span className="font-medium">{value}</span>
        </div>
      )}
    </div>
  )
}
