'use client'

import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Common size options for different product types
export const COMMON_SIZES = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  universal: ['S', 'M', 'L', 'XL', 'XXL']
}

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
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {allSizes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sizes available. Add custom sizes below.</p>
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

        {selectedSizes.length > 0 && (
          <div className="mt-4">
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

        {onAddCustomSize && (
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm font-medium">Add Custom Size:</Label>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="e.g., 5XL"
                className="flex-1 px-3 py-2 text-sm border rounded-md"
                onKeyPress={(e) => {
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
      </CardContent>
    </Card>
  )
}
