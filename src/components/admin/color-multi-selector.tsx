'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Image as ImageIcon, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { GallerySelector } from './gallery-selector'

// Common color options
export const COMMON_COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Gray', 'Orange',
  'Purple', 'Pink', 'Brown', 'Beige', 'Navy', 'Maroon', 'Teal', 'Gold', 'Silver'
]

interface ColorImageData {
  color: string
  images: string[]
  isNew?: boolean // Track if this is a new color being added
}

interface ColorMultiSelectorProps {
  selectedColors: ColorImageData[]
  onChange: (colors: ColorImageData[]) => void
  disabled?: boolean
}

export function ColorMultiSelector({
  selectedColors,
  onChange,
  disabled = false
}: ColorMultiSelectorProps) {
  const [newColorName, setNewColorName] = useState('')

  const handleColorToggle = (color: string) => {
    if (selectedColors.find(c => c.color === color)) {
      // Remove color
      onChange(selectedColors.filter(c => c.color !== color))
    } else {
      // Add color
      onChange([...selectedColors, { color, images: [], isNew: true }])
    }
  }

  const handleAddCustomColor = () => {
    const color = newColorName.trim()
    if (color && !selectedColors.find(c => c.color === color)) {
      onChange([...selectedColors, { color, images: [], isNew: true }])
      setNewColorName('')
    } else if (selectedColors.find(c => c.color === color)) {
      toast.error('Color already exists')
    }
  }

  const handleRemoveColor = (color: string) => {
    onChange(selectedColors.filter(c => c.color !== color))
  }

  const handleGallerySelect = (color: string) => {
    return (url: string) => {
      // Update color images with selected image from gallery
      onChange(selectedColors.map(c => {
        if (c.color === color) {
          return {
            ...c,
            images: [...c.images, url]
          }
        }
        return c
      }))

      toast.success(`Added image for ${color}`)
    }
  }

  const handleRemoveImage = (color: string, imageUrl: string) => {
    onChange(selectedColors.map(c => {
      if (c.color === color) {
        return {
          ...c,
          images: c.images.filter(img => img !== imageUrl)
        }
      }
      return c
    }))
  }

  const selectedColorNames = selectedColors.map(c => c.color)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Available Colors</CardTitle>
        <CardDescription>
          Select colors and upload images for each color
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Input - Move to top */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Custom Color:</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g., Rose Gold, Midnight Blue"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomColor()
                }
              }}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddCustomColor}
              disabled={disabled || !newColorName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Select Colors */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Quick Select:</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_COLORS.map((color) => (
              <div key={color} className="flex items-center space-x-2">
                <Checkbox
                  id={`color-${color}`}
                  checked={selectedColorNames.includes(color)}
                  onCheckedChange={() => handleColorToggle(color)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`color-${color}`}
                  className="cursor-pointer flex items-center gap-2"
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
        </div>

        {/* Color-specific image uploads */}
        {selectedColors.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">Color Images:</Label>
            {selectedColors.map((colorData) => (
              <div key={colorData.color} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: colorData.color.toLowerCase() }}
                    />
                    <span className="font-medium">{colorData.color}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveColor(colorData.color)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Image selection from gallery */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GallerySelector
                      onSelect={handleGallerySelect(colorData.color)}
                      category="product"
                      multiple={false}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Select images from gallery or upload new ones
                  </p>

                  {/* Image preview */}
                  {colorData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {colorData.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`${colorData.color} ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(colorData.color, imageUrl)}
                            disabled={disabled}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {colorData.images.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      No images selected. Product images will be used.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {selectedColors.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Selected Colors:</p>
            <div className="flex flex-wrap gap-2">
              {selectedColors.map((colorData) => (
                <Badge key={colorData.color} variant="secondary" className="gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colorData.color.toLowerCase() }}
                  />
                  {colorData.color}
                  {colorData.images.length > 0 && (
                    <ImageIcon className="h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
