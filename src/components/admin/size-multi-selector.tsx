'use client'

import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Common size options for different product types
export const COMMON_SIZES = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  shoes: ['38', '39', '40', '41', '42', '43', '44', '45', '46'],
  volume: ['50ml', '100ml', '200ml', '250ml', '500ml'],
  universal: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '38', '39', '40', '41', '42', '50ml', '100ml', '200ml', '250ml', '500ml']
}

// All sizes combined for quick select
export const ALL_QUICK_SIZES = ['50ml', '100ml', '200ml', '250ml', '500ml', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '38', '39', '40', '41', '42']

interface SizeMultiSelectorProps {
  availableSizes: string[]
  selectedSizes: string[]
  onChange: (sizes: string[]) => void
  customSizes?: string[]
  onAddCustomSize?: (size: string) => void
  onRemoveCustomSize?: (size: string) => void
  disabled?: boolean
}

export function SizeMultiSelector({
  availableSizes,
  selectedSizes,
  onChange,
  customSizes = [],
  onAddCustomSize,
  onRemoveCustomSize,
  disabled = false
}: SizeMultiSelectorProps) {
  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      onChange(selectedSizes.filter(s => s !== size))
    } else {
      onChange([...selectedSizes, size])
    }
  }

  const allSizes = [...new Set([...availableSizes, ...customSizes])].sort()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Available Sizes</CardTitle>
        <CardDescription>
          Select the sizes available for this product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Input - Move to top */}
        {onAddCustomSize && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add Custom Size:</Label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., 5XL, 750ml, 46"
                className="flex-1 px-3 py-2 text-sm border rounded-md"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement
                    const value = target.value.trim()
                    if (value && !allSizes.includes(value)) {
                      onAddCustomSize(value)
                      target.value = ''
                    }
                  }
                }}
                disabled={disabled}
              />
            </div>
          </div>
        )}

        {/* Quick Select Sizes */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Quick Select:</Label>
          <div className="flex flex-wrap gap-3">
            {allSizes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sizes available. Add custom sizes above.</p>
            ) : (
              allSizes.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size}`}
                    checked={selectedSizes.includes(size)}
                    onCheckedChange={() => handleSizeToggle(size)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`size-${size}`}
                    className="cursor-pointer"
                  >
                    {size}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedSizes.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Selected Sizes:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSizes.map((size) => (
                <Badge key={size} variant="secondary">
                  {size}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
