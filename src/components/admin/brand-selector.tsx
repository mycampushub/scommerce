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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  logo?: string | null;
}

interface BrandSelectorProps {
  value?: string;
  onChange: (value: string, brand?: Brand) => void;
  placeholder?: string;
  allowCreate?: boolean;
  disabled?: boolean;
}

export function BrandSelector({
  value,
  onChange,
  placeholder = 'Select a brand',
  allowCreate = true,
  disabled = false,
}: BrandSelectorProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch brands
  useEffect(() => {
    fetchBrands();
  }, []);

  // Filter brands based on search
  useEffect(() => {
    if (!search) {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter((brand) =>
        brand.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  }, [search, brands]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/brands');
      const result = await response.json();

      if (result.success) {
        setBrands(result.data);
        setFilteredBrands(result.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBrandName.trim(),
        }),
      });

      const result = await response.json();

      console.log('Brand creation response:', result); // Debug log

      if (result.success && result.data && typeof result.data === 'object') {
        // Add new brand to list
        const newBrand = result.data;

        // Validate that newBrand has required properties
        if (!newBrand.id || !newBrand.name) {
          throw new Error('Invalid brand data received from server');
        }

        setBrands([newBrand, ...brands]);
        setFilteredBrands([newBrand, ...brands]); // Also update filtered list
        onChange(newBrand.id, newBrand);
        setIsCreateModalOpen(false);
        setNewBrandName('');
      } else {
        console.error('Brand creation failed:', result);
        alert(result.error || 'Failed to create brand');
      }
    } catch (error) {
      console.error('Error creating brand:', error);
      alert('Failed to create brand: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const selectedBrand = brands.find((b) => b.id === value);

  return (
    <div className="space-y-2">
      <Label>Brand</Label>
      <Select
        value={value}
        onValueChange={(val) => {
          const brand = brands.find((b) => b.id === val);
          onChange(val, brand);
          setSearch('');
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedBrand && (
              <div className="flex items-center gap-2">
                {selectedBrand.logo && (
                  <img
                    src={selectedBrand.logo}
                    alt={selectedBrand.name}
                    className="h-5 w-5 object-contain"
                  />
                )}
                <span>{selectedBrand.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allowCreate && (
            <div className="p-2">
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Brand
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Brand</DialogTitle>
                    <DialogDescription>
                      Enter the name for the new brand. You can add more details later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand-name">Brand Name</Label>
                      <Input
                        id="brand-name"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Enter brand name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateBrand();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setNewBrandName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateBrand}
                      disabled={!newBrandName.trim() || creating}
                    >
                      {creating ? 'Creating...' : 'Create Brand'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <div className="px-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {filteredBrands.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {search ? 'No brands found' : 'No brands available'}
            </div>
          ) : (
            filteredBrands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                <div className="flex items-center gap-2">
                  {brand.logo && (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <span>{brand.name}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
