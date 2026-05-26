'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Common material options
export const COMMON_MATERIALS = [
  'Cotton',
  'Silk',
  'Polyester',
  'Wool',
  'Leather',
  'Denim',
  'Linen',
  'Rayon',
  'Nylon',
  'Spandex',
  'Canvas',
  'Velvet',
  'Satin',
  'Chiffon',
  'Fleece',
  'Cashmere',
]

interface MaterialQuickSelectProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function MaterialQuickSelect({
  value = '',
  onChange,
  disabled = false
}: MaterialQuickSelectProps) {
  const [customMaterial, setCustomMaterial] = React.useState('')

  const handleCustomMaterialAdd = () => {
    const trimmed = customMaterial.trim()
    if (trimmed) {
      onChange(trimmed)
      setCustomMaterial('')
    }
  }

  return (
    <div className="space-y-4">
      <Label>Product Material</Label>

      {/* Manual Input - ABOVE quick select */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Or enter custom material (e.g., Bamboo, Hemp)"
          value={customMaterial}
          onChange={(e) => setCustomMaterial(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCustomMaterialAdd()
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCustomMaterialAdd}
          disabled={disabled || !customMaterial.trim()}
        >
          Set
        </Button>
      </div>

      {/* Quick Select Materials */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Quick Select:</Label>
        <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
          <div className="flex flex-wrap gap-2">
            {COMMON_MATERIALS.map((material) => (
              <div key={material} className="flex items-center space-x-1">
                <RadioGroupItem value={material} id={`material-${material}`} />
                <Label
                  htmlFor={`material-${material}`}
                  className="cursor-pointer text-sm whitespace-nowrap"
                >
                  {material}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Selected Material Preview */}
      {value && (
        <div className="text-sm">
          <span className="text-muted-foreground">Selected: </span>
          <span className="font-medium">{value}</span>
        </div>
      )}
    </div>
  )
}
