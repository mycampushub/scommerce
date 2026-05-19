'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SIZE_UNITS, COMMON_SIZES, getSizeUnitsByCategory, formatSize, type SizeUnit } from '@/lib/size-units';

type SizeType = 'unit' | 'label';

interface SizeInputProps {
  value?: {
    type?: SizeType;
    value?: number;
    unit?: string;
    label?: string;
  };
  onChange: (value: { type: SizeType; value?: number; unit?: string; label?: string }) => void;
  categoryHint?: string;
  disabled?: boolean;
}

export function SizeInput({
  value = {},
  onChange,
  categoryHint,
  disabled = false,
}: SizeInputProps) {
  const sizeType = value.type || 'unit';
  const sizeValue = value.value;
  const sizeUnit = value.unit;
  const sizeLabel = value.label;

  // Get recommended units based on category hint
  const recommendedUnits = categoryHint
    ? getSizeUnitsByCategory(categoryHint as SizeUnit['category'])
    : SIZE_UNITS;

  // Get common sizes for the category
  const commonSizes = categoryHint
    ? COMMON_SIZES[categoryHint as keyof typeof COMMON_SIZES] || []
    : [];

  const handleSizeTypeChange = (type: SizeType) => {
    onChange({
      type,
      value: type === 'unit' ? sizeValue : undefined,
      unit: type === 'unit' ? sizeUnit : undefined,
      label: type === 'label' ? sizeLabel : undefined,
    });
  };

  const handleSizeValueChange = (val: string) => {
    const num = parseFloat(val);
    onChange({
      type: sizeType,
      value: isNaN(num) ? undefined : num,
      unit: sizeUnit,
      label: sizeLabel,
    });
  };

  const handleSizeUnitChange = (unit: string) => {
    onChange({
      type: sizeType,
      value: sizeValue,
      unit,
      label: sizeLabel,
    });
  };

  const handleSizeLabelChange = (label: string) => {
    onChange({
      type: sizeType,
      value: sizeValue,
      unit: sizeUnit,
      label,
    });
  };

  const handleQuickSelect = (quickSize: { value: number; unit: string }) => {
    onChange({
      type: 'unit',
      value: quickSize.value,
      unit: quickSize.unit,
      label: undefined,
    });
  };

  const handleLabelQuickSelect = (label: string) => {
    onChange({
      type: 'label',
      value: undefined,
      unit: undefined,
      label,
    });
  };

  return (
    <div className="space-y-3">
      <Label>Product Size</Label>

      {/* Size Type Selector */}
      <RadioGroup
        value={sizeType}
        onValueChange={(val) => handleSizeTypeChange(val as SizeType)}
        disabled={disabled}
      >
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unit" id="unit-size" />
            <Label htmlFor="unit-size" className="cursor-pointer">
              Unit Size (e.g., 500 ml, 1 kg)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="label" id="label-size" />
            <Label htmlFor="label-size" className="cursor-pointer">
              Label Size (e.g., S, M, L, XL)
            </Label>
          </div>
        </div>
      </RadioGroup>

      {/* Unit Size Input */}
      {sizeType === 'unit' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                step="0.01"
                placeholder="Value"
                value={sizeValue !== undefined ? sizeValue : ''}
                onChange={(e) => handleSizeValueChange(e.target.value)}
                disabled={disabled}
              />
            </div>
            <Select
              value={sizeUnit}
              onValueChange={handleSizeUnitChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {recommendedUnits.map((unit) => (
                  <SelectItem key={unit.code} value={unit.code}>
                    {unit.symbol || unit.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Select Common Sizes */}
          {commonSizes.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Common Sizes:</Label>
              <div className="flex flex-wrap gap-1">
                {commonSizes.map((size, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(size)}
                    disabled={disabled}
                    className="h-7 text-xs"
                  >
                    {formatSize('unit', size.value, size.unit, null)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Label Size Input */}
      {sizeType === 'label' && (
        <div className="space-y-2">
          <Input
            placeholder="Enter size label (e.g., S, M, L, XL)"
            value={sizeLabel || ''}
            onChange={(e) => handleSizeLabelChange(e.target.value)}
            disabled={disabled}
          />

          {/* Quick Select Common Label Sizes */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Quick Select:</Label>
            <div className="flex flex-wrap gap-1">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((label) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleLabelQuickSelect(label)}
                  disabled={disabled}
                  className="h-7 text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Size Preview */}
      {sizeType === 'unit' && sizeValue !== undefined && sizeUnit && (
        <div className="text-sm text-muted-foreground">
          Size: <span className="font-medium">{formatSize(sizeType, sizeValue, sizeUnit, sizeLabel)}</span>
        </div>
      )}
      {sizeType === 'label' && sizeLabel && (
        <div className="text-sm text-muted-foreground">
          Size: <span className="font-medium">{sizeLabel}</span>
        </div>
      )}
    </div>
  );
}
