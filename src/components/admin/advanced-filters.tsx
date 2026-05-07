'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, X, Plus } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface AdvancedFiltersConfig {
  search?: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
  };
  dateRange?: {
    from?: Date;
    to?: Date;
    onFromChange: (date: Date | undefined) => void;
    onToChange: (date: Date | undefined) => void;
    label?: string;
  };
  multiSelect?: {
    label: string;
    options: FilterOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
  };
  select?: {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  selects?: Array<{
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }>;
}

interface AdvancedFiltersProps {
  config: AdvancedFiltersConfig;
  onReset: () => void;
  onApply: () => void;
}

export function AdvancedFilters({ config, onReset, onApply }: AdvancedFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);

  const handleMultiSelectToggle = (value: string) => {
    if (config.multiSelect && config.multiSelect.onChange) {
      const selected = config.multiSelect.selected.includes(value)
        ? config.multiSelect.selected.filter((v) => v !== value)
        : [...config.multiSelect.selected, value];
      config.multiSelect.onChange(selected);
    }
  };

  const hasActiveFilters = () => {
    if (config.search && config.search.value) return true;
    if (config.dateRange && (config.dateRange.from || config.dateRange.to)) return true;
    if (config.multiSelect && config.multiSelect.selected && config.multiSelect.selected.length > 0) return true;
    if (config.select && config.select.value) return true;
    if (config.selects && config.selects.some((s) => s.value)) return true;
    return false;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Advanced Filters</h3>
        </div>
        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        {config.search && config.search.onChange && config.search.placeholder && config.search.value !== undefined && (() => {
          const search = config.search!;
          return (
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Input
                  placeholder={search.placeholder}
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          );
        })()}

        {/* Date Range */}
        {config.dateRange && config.dateRange.from && config.dateRange.to && config.dateRange.onFromChange && config.dateRange.onToChange && (() => {
          const dateRange = config.dateRange!;
          return (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {dateRange.label || 'Date Range'}
              </label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange.from && !dateRange.to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="space-y-2 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          dateRange.onFromChange(subDays(new Date(), 7));
                          dateRange.onToChange(new Date());
                        }}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          dateRange.onFromChange(subDays(new Date(), 30));
                          dateRange.onToChange(new Date());
                        }}
                      >
                        Last 30 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          dateRange.onFromChange(subDays(new Date(), 90));
                          dateRange.onToChange(new Date());
                        }}
                      >
                        Last 90 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          dateRange.onFromChange(new Date(today.getFullYear(), today.getMonth(), 1));
                          dateRange.onToChange(new Date(today.getFullYear(), today.getMonth() + 1, 0));
                        }}
                      >
                        This month
                      </Button>
                    </div>
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => {
                        dateRange.onFromChange(range?.from);
                        dateRange.onToChange(range?.to);
                      }}
                      numberOfMonths={2}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => {
                    dateRange.onFromChange(undefined);
                    dateRange.onToChange(undefined);
                  }}
                >
                  Clear date range
                </Button>
              )}
            </div>
          );
        })()}

        {/* Multi Select */}
        {config.multiSelect && config.multiSelect.selected && config.multiSelect.options && (() => {
          const multiSelect = config.multiSelect!;
          return (
            <div className="space-y-2">
              <label className="text-sm font-medium">{multiSelect.label}</label>
              <Popover open={isMultiSelectOpen} onOpenChange={setIsMultiSelectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-auto py-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {multiSelect.selected.length === 0 ? (
                      <span className="text-muted-foreground">Select options</span>
                    ) : (
                      <span className="text-sm">
                        {multiSelect.selected.length} selected
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {multiSelect.options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                        onClick={() => handleMultiSelectToggle(option.value)}
                      >
                        <input
                          type="checkbox"
                          checked={multiSelect.selected.includes(option.value)}
                          onChange={() => handleMultiSelectToggle(option.value)}
                          className="h-4 w-4"
                        />
                        <label className="flex-1 text-sm cursor-pointer">{option.label}</label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {multiSelect.selected.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {multiSelect.selected.map((value) => {
                    const option = multiSelect.options.find((o) => o.value === value);
                    return (
                      <Badge key={value} variant="secondary" className="text-xs">
                        {option?.label}
                        <button
                          onClick={() => handleMultiSelectToggle(value)}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Single Select */}
        {config.select && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{config.select.label}</label>
            <Select
              value={config.select.value}
              onValueChange={config.select.onChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={config.select.placeholder || 'Select option'} />
              </SelectTrigger>
              <SelectContent>
                {config.select.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Multiple Selects */}
        {config.selects && (
          <>
            {config.selects.map((select, index) =>
              select.onChange && (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium">{select.label}</label>
                  <Select value={select.value} onValueChange={select.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={select.placeholder || 'Select option'} />
                    </SelectTrigger>
                    <SelectContent>
                      {select.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onReset} disabled={!hasActiveFilters()}>
          Reset
        </Button>
        <Button onClick={onApply} disabled={!hasActiveFilters()}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
