'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ALL_QUICK_SIZES } from './size-multi-selector'

interface SizeQuickSelectProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SizeQuickSelect({
  value = '',
  onChange,
  disabled = false
}: SizeQuickSelectProps) {
  const [customSize, setCustomSize] = React.useState('')

  const handleCustomSizeAdd = () => {
    const trimmed = customSize.trim()
    if (trimmed) {
      onChange(trimmed)
      setCustomSize('')
    }
  }

  return (
    <div className="space-y-4">
      <Label>Product Size</Label>

      {/* Custom Size Input */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Or enter custom size (e.g., 750ml, 5XL)"
          value={customSize}
          onChange={(e) => setCustomSize(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCustomSizeAdd()
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCustomSizeAdd}
          disabled={disabled || !customSize.trim()}
        >
          Set
        </Button>
      </div>

      {/* Quick Select Sizes */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Quick Select:</Label>
        <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
          <div className="flex flex-wrap gap-2">
            {ALL_QUICK_SIZES.map((size) => (
              <div key={size} className="flex items-center space-x-1">
                <RadioGroupItem value={size} id={`size-${size}`} />
                <Label
                  htmlFor={`size-${size}`}
                  className="cursor-pointer text-sm whitespace-nowrap"
                >
                  {size}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Selected Size Preview */}
      {value && (
        <div className="text-sm">
          <span className="text-muted-foreground">Selected: </span>
          <span className="font-medium">{value}</span>
        </div>
      )}
    </div>
  )
}
