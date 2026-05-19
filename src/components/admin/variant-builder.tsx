'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Trash2, Check, X, Loader2, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/admin/image-upload'
import { CountrySelector } from '@/components/admin/country-selector'
import { SizeInput } from '@/components/admin/size-input'

export interface Attribute {
  name: string  // e.g., "Size", "Color", "Material"
  values: string[]  // e.g., ["S", "M", "L"]
}

export interface GeneratedVariant {
  id?: string  // Existing variant ID if editing
  sku?: string
  name: string
  price: number
  comparePrice?: number
  costPrice?: number
  stock: number
  // Legacy fields for backward compatibility
  size?: string
  color?: string
  material?: string
  // New size system
  sizeType?: 'unit' | 'label'
  sizeValue?: number
  sizeUnit?: string
  sizeLabel?: string
  // Country of origin
  countryOfOrigin?: string
  images?: string[]
  isDefault: boolean
  isActive: boolean
  lowStockAlert?: number
  reorderLevel?: number
  reorderQty?: number
  showImages?: boolean  // Whether to show image input section
}

interface VariantBuilderProps {
  basePrice?: number
  existingVariants?: GeneratedVariant[]
  onGenerate: (variants: GeneratedVariant[]) => void
  onCancel?: () => void
  loading?: boolean
  categorySlug?: string  // Add for proper SKU generation
  productName?: string  // Add for proper SKU generation
}

// Predefined attribute names for better UX
const PREDEFINED_ATTRIBUTES = ['Size', 'Color', 'Material', 'Pattern', 'Fit', 'Style']

// Predefined values for common attributes
const PREDEFINED_VALUES: Record<string, string[]> = {
  Size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
  Color: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Navy'],
  Material: ['Cotton', 'Silk', 'Chiffon', 'Georgette', 'Crepe', 'Linen', 'Velvet', 'Satin', 'Rayon', 'Polyester'],
  Pattern: ['Solid', 'Floral', 'Striped', 'Checked', 'Printed', 'Embroidered', 'Plain'],
  Fit: ['Slim', 'Regular', 'Relaxed', 'Loose', 'Fitted'],
  Style: ['Casual', 'Formal', 'Party', 'Traditional', 'Modern', 'Ethnic']
}

export function VariantBuilder({ basePrice = 0, existingVariants = [], onGenerate, onCancel, loading = false, categorySlug = 'GEN', productName = 'Product' }: VariantBuilderProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([])

  // Add a new attribute type
  const addAttribute = () => {
    if (attributes.length >= 3) {
      toast.warning('Maximum 3 attributes allowed for better performance')
      return
    }
    setAttributes([...attributes, { name: '', values: [] }])
  }

  // Remove an attribute
  const removeAttribute = (attrIndex: number) => {
    const newAttrs = attributes.filter((_, i) => i !== attrIndex)
    setAttributes(newAttrs)
    generateVariants(newAttrs)
  }

  // Update attribute name
  const updateAttributeName = (attrIndex: number, name: string) => {
    const newAttrs = [...attributes]
    newAttrs[attrIndex].name = name
    setAttributes(newAttrs)
    generateVariants(newAttrs)
  }

  // Add a value to an attribute
  const addAttributeValue = (attrIndex: number, value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    const newAttrs = [...attributes]
    if (!newAttrs[attrIndex].values.includes(trimmedValue)) {
      newAttrs[attrIndex].values.push(trimmedValue)
      setAttributes(newAttrs)
      generateVariants(newAttrs)
    }
  }

  // Remove a value from an attribute
  const removeAttributeValue = (attrIndex: number, valueIndex: number) => {
    const newAttrs = [...attributes]
    newAttrs[attrIndex].values.splice(valueIndex, 1)
    setAttributes(newAttrs)
    generateVariants(newAttrs)
  }

  // Generate all combinations of attributes
  const generateVariants = (attrs: Attribute[] = attributes) => {
    if (attrs.length === 0 || attrs.some(a => !a.name || a.values.length === 0)) {
      setGeneratedVariants([])
      return
    }

    // Generate all combinations using recursion
    const combinations: Record<string, string>[] = []

    const generateCombinations = (index: number, current: Record<string, string>) => {
      if (index === attrs.length) {
        combinations.push({ ...current })
        return
      }

      const attr = attrs[index]
      for (const value of attr.values) {
        current[attr.name] = value
        generateCombinations(index + 1, current)
      }
    }

    generateCombinations(0, {})

    // Convert combinations to variant format
    const variants: GeneratedVariant[] = combinations.map((combo) => {
      // Find existing variant that matches this combination
      // Match by size, color, material (case-insensitive for attribute names)
      const existing = existingVariants.find(ev => {
        const sizeMatch = !ev.size || ev.size === combo['Size'] || ev.size === combo['size']
        const colorMatch = !ev.color || ev.color === combo['Color'] || ev.color === combo['color']
        const materialMatch = !ev.material || ev.material === combo['Material'] || ev.material === combo['material']
        return sizeMatch && colorMatch && materialMatch
      })

      return existing || {
        sku: '',
        name: Object.entries(combo).map(([k, v]) => v).join(' / '),
        price: basePrice,
        comparePrice: undefined,
        costPrice: undefined,
        stock: 0,
        // Map attributes dynamically - try both capitalized and lowercase keys
        size: combo['Size'] || combo['size'] || undefined,
        color: combo['Color'] || combo['color'] || undefined,
        material: combo['Material'] || combo['material'] || undefined,
        images: [],
        isDefault: generatedVariants.length === 0, // First variant is default
        isActive: true,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20
      }
    })

    setGeneratedVariants(variants)
  }

  // Update a variant's property
  const updateVariant = (index: number, field: keyof GeneratedVariant, value: any) => {
    const newVariants = [...generatedVariants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setGeneratedVariants(newVariants)
  }

  // Set a variant as default (only one can be default)
  const setDefaultVariant = (index: number) => {
    const newVariants = generatedVariants.map((v, i) => ({
      ...v,
      isDefault: i === index
    }))
    setGeneratedVariants(newVariants)
  }

  // Auto-generate SKUs
  const autoGenerateSKUs = () => {
    const usedSkus = new Set<string>()
    const newVariants = generatedVariants.map((v, i) => {
      let sku = generateSKU(v)

      // Ensure uniqueness by adding index if needed
      let counter = 1
      let baseSku = sku
      while (usedSkus.has(sku)) {
        sku = `${baseSku}-${counter}`
        counter++
      }

      usedSkus.add(sku)
      return {
        ...v,
        sku
      }
    })

    setGeneratedVariants(newVariants)
    toast.success('SKUs generated successfully')
  }

  // Generate SKU based on variant attributes using proper format
  // Format: CAT-PROD-SIZE-COLOR-MAT-RAND
  const generateSKU = (variant: GeneratedVariant): string => {
    // Category code: First 3 characters, uppercase
    const catCode = categorySlug.substring(0, 3).toUpperCase().padEnd(3, 'X')

    // Product code: First 6 alphanumeric characters, uppercase
    const prodCode = productName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 6)
      .toUpperCase()
      .padEnd(6, 'X')

    // Size code: Support both legacy and new size system
    let sizeCode = ''
    if (variant.sizeType === 'label' && variant.sizeLabel) {
      // New label size: first 2 chars of label
      sizeCode = variant.sizeLabel.replace(/\s/g, '').substring(0, 2).toUpperCase()
    } else if (variant.sizeType === 'unit' && variant.sizeValue && variant.sizeUnit) {
      // New unit size: value + unit (e.g., 50ML, 1KG)
      sizeCode = `${variant.sizeValue}${variant.sizeUnit.toUpperCase()}`.substring(0, 4)
    } else if (variant.size) {
      // Legacy size: first 2 characters
      sizeCode = variant.size.replace(/\s/g, '').substring(0, 2).toUpperCase()
    }

    // Color code: First 3 characters, uppercase
    const colorCode = variant.color ? variant.color.substring(0, 3).toUpperCase() : ''

    // Material code: First 3 characters, uppercase
    const materialCode = variant.material
      ? variant.material.substring(0, 3).toUpperCase()
      : ''

    // Country code: 2 characters if country of origin is specified
    const countryCode = variant.countryOfOrigin ? variant.countryOfOrigin.substring(0, 2).toUpperCase() : ''

    // Random code: 4 character alphanumeric
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()

    // Combine all parts
    return `${catCode}-${prodCode}${sizeCode}${colorCode}${materialCode}${countryCode}-${random}`
  }

  // Apply same price to all variants
  const applyPriceToAll = (price: number) => {
    const newVariants = generatedVariants.map(v => ({ ...v, price }))
    setGeneratedVariants(newVariants)
  }

  // Apply same stock to all variants
  const applyStockToAll = (stock: number) => {
    const newVariants = generatedVariants.map(v => ({ ...v, stock }))
    setGeneratedVariants(newVariants)
  }

  // Handle variant generation
  const handleGenerate = () => {
    if (generatedVariants.length === 0) {
      toast.error('Please generate variants first')
      return
    }

    // Validate each variant has required fields
    const invalidVariants = generatedVariants.filter((v, index) => {
      const hasError = !v.name || v.price <= 0 || v.stock < 0
      if (hasError) {
        console.error(`Variant ${index + 1} is invalid:`, {
          name: v.name,
          price: v.price,
          stock: v.stock,
          size: v.size,
          color: v.color,
          material: v.material
        })
      }
      return hasError
    })

    if (invalidVariants.length > 0) {
      toast.error(`${invalidVariants.length} variant(s) have invalid data. Please check: name, price, and stock must be valid.`)
      return
    }

    // Check for duplicate SKUs
    const skus = generatedVariants.map(v => v.sku).filter(sku => sku)
    const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index)
    if (duplicateSkus.length > 0) {
      toast.error(`Duplicate SKUs found: ${duplicateSkus.join(', ')}. Each variant must have a unique SKU.`)
      return
    }

    // Validate at least one variant has stock
    if (generatedVariants.every(v => v.stock <= 0)) {
      toast.error('At least one variant must have stock greater than 0')
      return
    }

    // Validate at least one variant is active
    if (generatedVariants.every(v => !v.isActive)) {
      toast.error('At least one variant must be active')
      return
    }

    // Log variants for debugging
    console.log('[VariantBuilder] Generating variants:', {
      count: generatedVariants.length,
      variants: generatedVariants.map(v => ({
        name: v.name,
        price: v.price,
        stock: v.stock,
        size: v.size,
        color: v.color,
        material: v.material,
        sku: v.sku,
        isActive: v.isActive
      }))
    })

    onGenerate(generatedVariants)
  }

  return (
    <div className="space-y-6">
      {/* Attribute Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Build Your Variations</CardTitle>
          <CardDescription>
            Add attributes like Size, Color, Material to generate all possible combinations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {attributes.map((attr, attrIndex) => (
            <div key={attrIndex} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-sm font-medium">Attribute Name:</Label>
                <div className="flex-1 flex items-center gap-2">
                  <select
                    value={attr.name}
                    onChange={(e) => updateAttributeName(attrIndex, e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select or type custom...</option>
                    {PREDEFINED_ATTRIBUTES.filter(name => !attributes.some((a, i) => a.name === name && i !== attrIndex)).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom name"
                    value={attr.name}
                    onChange={(e) => updateAttributeName(attrIndex, e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                {attributes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttribute(attrIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {attr.name && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Values for {attr.name}:</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attr.values.map((value, valueIndex) => (
                      <div
                        key={valueIndex}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm"
                      >
                        <span>{value}</span>
                        <button
                          type="button"
                          onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {PREDEFINED_VALUES[attr.name] && PREDEFINED_VALUES[attr.name].length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Quick add from {attr.name}:</p>
                      <div className="flex flex-wrap gap-1">
                        {PREDEFINED_VALUES[attr.name]
                          .filter(val => !attr.values.includes(val))
                          .map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => addAttributeValue(attrIndex, val)}
                              className="px-2 py-1 text-xs bg-pink-50 text-pink-700 rounded hover:bg-pink-100 transition-colors"
                            >
                              + {val}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Add a ${attr.name.toLowerCase()} (e.g., S, M, L)`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addAttributeValue(attrIndex, e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                      className="flex-1 h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.querySelectorAll(`[placeholder*="${attr.name.toLowerCase()}"]`)[attrIndex] as HTMLInputElement
                        if (input?.value.trim()) {
                          addAttributeValue(attrIndex, input.value.trim())
                          input.value = ''
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {attributes.length < 3 && (
            <Button
              type="button"
              onClick={addAttribute}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Attribute ({attributes.length}/3)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Generated Variants Preview */}
      {generatedVariants.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Variants ({generatedVariants.length})</CardTitle>
                <CardDescription>
                  Review and edit each variant before generating
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autoGenerateSKUs}
                >
                  Auto-Generate SKUs
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {generatedVariants.map((variant, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg transition-colors ${
                    variant.isDefault ? 'bg-pink-50 border-pink-300' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Variant Header with Attributes */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {/* Legacy size display */}
                          {variant.size && !variant.sizeType && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              Size: {variant.size}
                            </span>
                          )}
                          {/* New size display */}
                          {variant.sizeType === 'label' && variant.sizeLabel && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              Size: {variant.sizeLabel}
                            </span>
                          )}
                          {variant.sizeType === 'unit' && variant.sizeValue && variant.sizeUnit && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              Size: {variant.sizeValue} {variant.sizeUnit}
                            </span>
                          )}
                          {variant.color && (
                            <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs font-medium">
                              Color: {variant.color}
                            </span>
                          )}
                          {variant.material && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Material: {variant.material}
                            </span>
                          )}
                          {variant.countryOfOrigin && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                              🇦🇧 {variant.countryOfOrigin}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{variant.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDefaultVariant(index)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          variant.isDefault
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {variant.isDefault ? <Check className="w-3 h-3" /> : null}
                        {variant.isDefault ? 'Default' : 'Set Default'}
                      </button>
                    </div>

                    {/* Variant Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                      <div>
                        <Label className="text-xs text-gray-500">Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Compare Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.comparePrice || ''}
                          onChange={(e) => updateVariant(index, 'comparePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Optional"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Stock</Label>
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">SKU</Label>
                        <Input
                          value={variant.sku || ''}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          placeholder="Auto-generate"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Variant Size and Country */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Variant Size</Label>
                        <SizeInput
                          value={{
                            type: variant.sizeType || 'unit',
                            value: variant.sizeValue,
                            unit: variant.sizeUnit,
                            label: variant.sizeLabel,
                          }}
                          onChange={(value) => {
                            updateVariant(index, 'sizeType', value.type)
                            updateVariant(index, 'sizeValue', value.value)
                            updateVariant(index, 'sizeUnit', value.unit || '')
                            updateVariant(index, 'sizeLabel', value.label || '')
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Country of Origin</Label>
                        <CountrySelector
                          value={variant.countryOfOrigin || ''}
                          onChange={(value) => updateVariant(index, 'countryOfOrigin', value)}
                        />
                      </div>
                    </div>

                    {/* Toggle Active */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`active-${index}`}
                          checked={variant.isActive}
                          onChange={(e) => updateVariant(index, 'isActive', e.target.checked)}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <Label htmlFor={`active-${index}`} className="text-sm text-gray-700">
                          Active
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {variant.lowStockAlert !== undefined && variant.stock <= variant.lowStockAlert
                            ? '⚠️ Low stock'
                            : ''}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => updateVariant(index, 'showImages', !variant.showImages)}
                          className="text-violet-600 hover:text-violet-700"
                        >
                          <ImageIcon className="w-4 h-4 mr-1" />
                          Images {variant.showImages ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </Button>
                      </div>
                    </div>

                    {/* Variant Images - Expandable */}
                    {variant.showImages && (
                      <div className="pt-3 border-t space-y-2">
                        <Label className="text-xs font-medium">Variant Images</Label>
                        <ImageUpload
                          images={variant.images || []}
                          onImagesChange={(images) => updateVariant(index, 'images', images)}
                          maxImages={5}
                        />
                        <p className="text-xs text-gray-500">
                          Upload up to 5 images for this variant or select from the gallery.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk Actions */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Bulk Actions:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Set all prices"
                      className="w-32 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.querySelectorAll('input[placeholder="Set all prices"]')[0] as HTMLInputElement
                        if (input?.value) {
                          applyPriceToAll(parseFloat(input.value))
                          input.value = ''
                        }
                      }}
                    >
                      Apply Price
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Set all stock"
                      className="w-32 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.querySelectorAll('input[placeholder="Set all stock"]')[0] as HTMLInputElement
                        if (input?.value) {
                          applyStockToAll(parseInt(input.value))
                          input.value = ''
                        }
                      }}
                    >
                      Apply Stock
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={loading || generatedVariants.length === 0}
          className="bg-pink-600 hover:bg-pink-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Generate {generatedVariants.length} Variant{generatedVariants.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
