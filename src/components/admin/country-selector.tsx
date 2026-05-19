'use client';

import { useState, useEffect } from 'react';
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
import { Search } from 'lucide-react';
import { COUNTRIES, COMMON_COUNTRIES, getCountriesGroupedByRegion } from '@/lib/countries';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode?: string;
}

interface CountrySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showCommonFirst?: boolean;
  showRegions?: boolean;
  disabled?: boolean;
}

export function CountrySelector({
  value,
  onChange,
  placeholder = 'Select a country',
  showCommonFirst = true,
  showRegions = false,
  disabled = false,
}: CountrySelectorProps) {
  const [search, setSearch] = useState('');

  // Get countries to display
  const commonCountries = showCommonFirst ? COMMON_COUNTRIES : [];
  const otherCountries = COUNTRIES.filter(
    (c) => !commonCountries.find((cc) => cc.code === c.code)
  );
  const regions = showRegions ? getCountriesGroupedByRegion() : null;

  // Filter countries based on search
  const filterCountries = (countries: Country[]) => {
    if (!search) return countries;
    const searchLower = search.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower)
    );
  };

  const filteredCommon = filterCountries(commonCountries);
  const filteredOthers = filterCountries(otherCountries);

  const selectedCountry = value
    ? COUNTRIES.find((c) => c.code === value)
    : null;

  return (
    <div className="space-y-2">
      <Label>Country of Origin</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedCountry && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="px-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Common Countries Section */}
          {showCommonFirst && filteredCommon.length > 0 && (
            <>
              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">
                Common Countries
              </div>
              {filteredCommon.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* All Countries by Region or Alphabetical */}
          {showRegions && regions ? (
            Object.entries(regions).map(([region, regionCountries]) => {
              const filteredRegion = filterCountries(regionCountries);
              if (filteredRegion.length === 0) return null;

              return (
                <div key={region}>
                  <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">
                    {region}
                  </div>
                  {filteredRegion.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              );
            })
          ) : (
            <>
              {filteredCommon.length > 0 && filteredOthers.length > 0 && (
                <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">
                  All Countries
                </div>
              )}
              {filteredOthers.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {filteredCommon.length === 0 && filteredOthers.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No countries found
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
