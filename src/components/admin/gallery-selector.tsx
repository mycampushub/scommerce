'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Image as ImageIcon, Search, Check, X, Upload, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MediaItem {
  id: string
  url: string
  originalName: string
  alt?: string
  category?: string
  tags?: string[]
  width?: number
  height?: number
  size?: number
}

interface GallerySelectorProps {
  onSelect: (url: string) => void
  selectedUrl?: string
  category?: string
  multiple?: boolean
  className?: string
}

export function GallerySelector({ onSelect, selectedUrl, category, multiple = false, className }: GallerySelectorProps) {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>(selectedUrl ? [selectedUrl] : [])
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchMedia = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/gallery'
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (search) params.append('search', search)
      params.append('limit', '50')
      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setMedia(data.data)
      }
    } catch (error) {
      console.error('Error fetching media:', error)
      toast.error('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchMedia()
    }
  }, [open, search, category])

  const handleSelect = (item: MediaItem) => {
    if (multiple) {
      if (selected.includes(item.url)) {
        setSelected(selected.filter(url => url !== item.url))
      } else {
        setSelected([...selected, item.url])
      }
    } else {
      onSelect(item.url)
      setOpen(false)
    }
  }

  const handleConfirmMultiple = () => {
    if (multiple && selected.length > 0) {
      // For multiple, call onSelect with the first selected URL
      // This can be extended to support multiple selections if needed
      onSelect(selected[0])
      setOpen(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (category) formData.append('category', category)

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Image uploaded to gallery')
        await fetchMedia() // Refresh gallery
      } else {
        toast.error(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = '' // Reset input
    }
  }

  const handleDelete = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Delete "${item.originalName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(item.id)
    try {
      const res = await fetch(`/api/admin/gallery?id=${item.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Image deleted')
        setMedia(media.filter(m => m.id !== item.id))
        if (selected.includes(item.url)) {
          setSelected(selected.filter(url => url !== item.url))
        }
      } else {
        toast.error(data.error || 'Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className={className}>
          <ImageIcon className="w-4 h-4 mr-2" />
          {multiple ? 'Select from Gallery' : selectedUrl ? 'Change Image' : 'Select from Gallery'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto overflow-x-hidden" aria-describedby="gallery-description">
        <DialogHeader>
          <DialogTitle>Media Gallery</DialogTitle>
          <DialogDescription id="gallery-description" className="sr-only">
            Select images from your media gallery
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Upload Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search images by name, alt text, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                id="gallery-upload"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
              <Label
                htmlFor="gallery-upload"
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md cursor-pointer hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </Label>
            </div>
          </div>

          {/* Media Grid */}
          <div className="border rounded-lg p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
              </div>
            ) : media.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No images found</p>
                <p className="text-sm">Upload an image or adjust your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[50vh] overflow-y-auto">
                {media.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${
                      selected.includes(item.url)
                        ? 'border-pink-500 ring-2 ring-pink-200'
                        : 'border-transparent hover:border-gray-300 hover:ring-2 hover:ring-gray-200'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.alt || item.originalName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Selection overlay */}
                    {selected.includes(item.url) && (
                      <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(item, e)}
                      disabled={deleting === item.id}
                      className="absolute top-1 right-1 p-1.5 bg-white/90 hover:bg-red-500 hover:text-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    >
                      {deleting === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>

                    {/* Image info overlay on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate font-medium" title={item.originalName}>
                        {item.originalName}
                      </p>
                      {item.width && item.height && (
                        <p className="text-[10px] text-gray-300">
                          {item.width} × {item.height}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {multiple && selected.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-gray-600">
                {selected.length} image{selected.length !== 1 ? 's' : ''} selected
              </span>
              <Button onClick={handleConfirmMultiple} className="bg-pink-600 hover:bg-pink-700">
                Confirm Selection
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            Images are stored in the media gallery and can be reused across products, categories, banners, and stories.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
