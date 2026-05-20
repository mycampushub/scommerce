'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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

export interface SelectedSize {
  type: SizeType;
  value?: number;
  unit?: string;
  label?: string;
}

interface MultiSizeSelectorProps {
  selectedSizes: SelectedSize[];
  onChange: (sizes: SelectedSize[]) => void;
  categoryHint?: string;
  disabled?: boolean;
}

const COMMON_LABEL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const COMMON_UNIT_SIZES: Array<{ value: number; unit: string; label: string }> = [
  { value: 100, unit: 'ml', label: '100ml' },
  { value: 200, unit: 'ml', label: '200ml' },
  { value: 300, unit: 'ml', label: '300ml' },
  { value: 500, unit: 'ml', label: '500ml' },
  { value: 1000, unit: 'ml', label: '1L' },
  { value: 50, unit: 'g', label: '50g' },
  { value: 100, unit: 'g', label: '100g' },
  { value: 200, unit: 'g', label: '200g' },
  { value: 500, unit: 'g', label: '500g' },
  { value: 1000, unit: 'g', label: '1kg' },
];

export function MultiSizeSelector({
  selectedSizes = [],
  onChange,
  categoryHint,
  disabled = false,
}: MultiSizeSelectorProps) {
  const [sizeType, setSizeType] = useState<SizeType>('label');
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  // Get recommended units based on category hint
  const recommendedUnits = categoryHint
    ? getSizeUnitsByCategory(categoryHint as SizeUnit['category'])
    : SIZE_UNITS.filter(u => u.category === 'volume' || u.category === 'weight');

  const toggleSize = (size: SelectedSize) => {
    const exists = selectedSizes.some(s =>
      s.type === size.type &&
      s.value === size.value &&
      s.unit === size.unit &&
      s.label === size.label
    );

    if (exists) {
      onChange(selectedSizes.filter(s =>
        !(s.type === size.type && s.value === size.value && s.unit === size.unit && s.label === size.label)
      ));
    } else {
      onChange([...selectedSizes, size]);
    }
  };

  const addCustomSize = () => {
    if (sizeType === 'unit') {
      const value = parseFloat(customValue);
      if (!isNaN(value) && customUnit) {
        const newSize: SelectedSize = {
          type: 'unit',
          value,
          unit: customUnit,
        };
        if (!selectedSizes.some(s =>
          s.type === newSize.type &&
          s.value === newSize.value &&
          s.unit === newSize.unit
        )) {
          onChange([...selectedSizes, newSize]);
        }
        setCustomValue('');
      }
    } else {
      if (customValue.trim()) {
        const newSize: SelectedSize = {
          type: 'label',
          label: customValue.trim(),
        };
        if (!selectedSizes.some(s =>
          s.type === newSize.type &&
          s.label === newSize.label
        )) {
          onChange([...selectedSizes, newSize]);
        }
        setCustomValue('');
      }
    }
  };

  const removeSize = (index: number) => {
    onChange(selectedSizes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label>Product Sizes (Select Multiple)</Label>

      {/* Size Type Selector */}
      <RadioGroup
        value={sizeType}
        onValueChange={(val) => setSizeType(val as SizeType)}
        disabled={disabled}
      >
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="label" id="label-size" />
            <Label htmlFor="label-size" className="cursor-pointer">
              Label Sizes (S, M, L, XL)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unit" id="unit-size" />
            <Label htmlFor="unit-size" className="cursor-pointer">
              Unit Sizes (100ml, 500ml, 1kg)
            </Label>
          </div>
        </div>
      </RadioGroup>

      {sizeType === 'label' && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Quick Select Common Sizes:</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_LABEL_SIZES.map((label) => {
                const isSelected = selectedSizes.some(s => s.type === 'label' && s.label === label);
                return (
                  <Button
                    key={label}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSize({ type: 'label', label })}
                    disabled={disabled}
                    className={isSelected ? "bg-violet-600 hover:bg-violet-700" : ""}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Custom size label (e.g., 2XL, 4XL)"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              disabled={disabled}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomSize}
              disabled={disabled || !customValue.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {sizeType === 'unit' && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Quick Select Common Sizes:</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_UNIT_SIZES.map((size) => {
                const isSelected = selectedSizes.some(s =>
                  s.type === 'unit' &&
                  s.value === size.value &&
                  s.unit === size.unit
                );
                return (
                  <Button
                    key={`${size.value}-${size.unit}`}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSize({ type: 'unit', value: size.value, unit: size.unit })}
                    disabled={disabled}
                    className={isSelected ? "bg-violet-600 hover:bg-violet-700" : ""}
                  >
                    {size.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Value (e.g., 500)"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              disabled={disabled}
              className="w-32 px-3 py-2 border rounded-md text-sm"
            />
            <Select
              value={customUnit}
              onValueChange={setCustomUnit}
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
            <Button
              type="button"
              variant="outline"
              onClick={addCustomSize}
              disabled={disabled || !customValue || !customUnit}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Selected Sizes Display */}
      {selectedSizes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Selected Sizes ({selectedSizes.length}):
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedSizes.map((size, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-full text-sm"
              >
                <span className="font-medium">
                  {size.type === 'label' ? size.label : formatSize(size.type, size.value, size.unit, null)}
                </span>
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  disabled={disabled}
                  className="ml-1 text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
