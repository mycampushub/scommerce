'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface VariantMatrixPreviewProps {
  sizes: string[]
  colors: string[]
  basePrice: number
  baseStock: number
  material?: string
  onGenerate: (data: {
    sizes: string[]
    colors: string[]
    basePrice: number
    baseStock: number
    material?: string
  }) => Promise<void>
  disabled?: boolean
}

export function VariantMatrixPreview({
  sizes,
  colors,
  basePrice,
  baseStock,
  material,
  onGenerate,
  disabled = false
}: VariantMatrixPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentBasePrice, setCurrentBasePrice] = useState(basePrice)
  const [currentBaseStock, setCurrentBaseStock] = useState(baseStock)
  const [generatedVariants, setGeneratedVariants] = useState<string[]>([])

  const totalVariants = sizes.length * colors.length

  const handleGenerate = async () => {
    if (sizes.length === 0) {
      toast.error('Please select at least one size')
      return
    }

    if (colors.length === 0) {
      toast.error('Please select at least one color')
      return
    }

    if (totalVariants > 100) {
      toast.error(`Cannot generate ${totalVariants} variants. Maximum allowed is 100.`)
      return
    }

    setIsGenerating(true)
    setGeneratedVariants([])

    try {
      await onGenerate({
        sizes,
        colors,
        basePrice: currentBasePrice,
        baseStock: currentBaseStock,
        material
      })

      // Mark all combinations as generated
      const combinations: string[] = []
      for (const color of colors) {
        for (const size of sizes) {
          combinations.push(`${size}/${color}`)
        }
      }
      setGeneratedVariants(combinations)

      toast.success(`Successfully generated ${totalVariants} variant combinations`)
    } catch (error) {
      console.error('Error generating variants:', error)
      toast.error('Failed to generate variants')
    } finally {
      setIsGenerating(false)
    }
  }

  const getVariantStatus = (size: string, color: string) => {
    const key = `${size}/${color}`
    return generatedVariants.includes(key)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Variant Matrix Preview</CardTitle>
            <CardDescription>
              {totalVariants > 0
                ? `${totalVariants} combination${totalVariants > 1 ? 's' : ''} will be generated`
                : 'Select sizes and colors to preview combinations'}
            </CardDescription>
          </div>
          {totalVariants > 0 && (
            <Badge variant="outline">
              {sizes.length} × {colors.length} = {totalVariants}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base settings */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Base Price: ৳{currentBasePrice}</Label>
            <Slider
              value={[currentBasePrice]}
              onValueChange={([value]) => setCurrentBasePrice(value)}
              min={0}
              max={10000}
              step={10}
              disabled={disabled}
              className="w-full"
            />
            <Input
              type="number"
              value={currentBasePrice}
              onChange={(e) => setCurrentBasePrice(Number(e.target.value))}
              className="mt-2"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Base Stock: {currentBaseStock}</Label>
            <Slider
              value={[currentBaseStock]}
              onValueChange={([value]) => setCurrentBaseStock(value)}
              min={0}
              max={100}
              step={1}
              disabled={disabled}
              className="w-full"
            />
            <Input
              type="number"
              value={currentBaseStock}
              onChange={(e) => setCurrentBaseStock(Number(e.target.value))}
              className="mt-2"
              disabled={disabled}
            />
          </div>
        </div>

        {material && (
          <div>
            <Label>Material: {material}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              All variants will use this material
            </p>
          </div>
        )}

        <Separator />

        {/* Matrix preview */}
        {sizes.length > 0 && colors.length > 0 ? (
          <div className="space-y-3">
            <Label>Variant Matrix:</Label>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Size</TableHead>
                    {colors.map((color) => (
                      <TableHead key={color} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          {color}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sizes.map((size) => (
                    <TableRow key={size}>
                      <TableCell className="font-medium">{size}</TableCell>
                      {colors.map((color) => {
                        const isGenerated = getVariantStatus(size, color)
                        return (
                          <TableCell key={`${size}-${color}`} className="text-center">
                            <div className="flex items-center justify-center">
                              {isGenerated ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  ৳{currentBasePrice}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Select sizes and colors to see the variant matrix
          </div>
        )}

        {/* Generate button */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={disabled || isGenerating || sizes.length === 0 || colors.length === 0}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate {totalVariants} Variant{totalVariants !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>

        {/* Warning for large numbers */}
        {totalVariants > 50 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You're about to generate {totalVariants} variants. This is a large number and may take time to process.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
