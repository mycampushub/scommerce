'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Search, Upload, Image as ImageIcon, Grid3X3, Trash2, Edit2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface GalleryImage {
  id: string
  filename: string
  url: string
  originalName?: string
  mimeType?: string
  size?: number
  width?: number
  height?: number
  alt?: string
  tags?: string[]
  category?: string
  usageCount: number
  createdAt: string
}

interface ImageGallerySelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (image: GalleryImage) => void
  onUploadNew?: () => void
  category?: 'product' | 'category' | 'story' | 'banner' | 'promotion' | 'general'
  maxSelection?: number
}

export function ImageGallerySelector({
  isOpen,
  onClose,
  onSelect,
  onUploadNew,
  category = 'general',
  maxSelection = 1,
}: ImageGallerySelectorProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(category)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())

  // Fetch images when dialog opens or category/search changes
  useEffect(() => {
    if (isOpen) {
      fetchImages()
    }
  }, [isOpen, selectedCategory, search])

  const fetchImages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('category', selectedCategory)
      if (search) {
        params.append('search', search)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/admin/gallery?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setImages(result.data)
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectImage = (image: GalleryImage) => {
    if (selectedImages.has(image.id)) {
      selectedImages.delete(image.id)
    } else if (selectedImages.size < maxSelection) {
      selectedImages.add(image.id)
    }
    setSelectedImages(new Set(selectedImages))
  }

  const handleConfirmSelection = () => {
    const selected = images.filter(img => selectedImages.has(img.id))
    if (selected.length > 0) {
      selected.forEach(img => onSelect(img))
      handleClose()
    }
  }

  const handleUploadNew = () => {
    onUploadNew?.()
  }

  const handleClose = () => {
    setSelectedImages(new Set())
    setSearch('')
    onClose()
  }

  const handleDeleteImage = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await fetch(`/api/admin/gallery/${imageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setImages(images.filter(img => img.id !== imageId))
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Gallery
              </DialogTitle>
              <DialogDescription>
                Select images from your gallery or upload new ones
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-3 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-describedby="image-search"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
                <SelectItem value="story">Stories</SelectItem>
                <SelectItem value="banner">Banners</SelectItem>
                <SelectItem value="promotion">Promotions</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleUploadNew} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload New
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6" id="gallery-scroll-area">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Grid3X3 className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500">No images found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? 'Try a different search term' : 'Upload some images to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => handleSelectImage(image)}
                  className={`group relative cursor-pointer rounded-lg border-2 transition-all ${
                    selectedImages.has(image.id)
                      ? 'border-violet-500 ring-2 ring-violet-500 ring-offset-2'
                      : 'border-gray-200 hover:border-violet-300'
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select image: ${image.originalName || image.filename}`}
                >
                  <div className="aspect-square relative overflow-hidden rounded-lg">
                    <img
                      src={image.url}
                      alt={image.alt || image.originalName || 'Gallery image'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(image.url, '_blank')
                        }}
                        aria-label="View full image"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => handleDeleteImage(e, image.id)}
                        aria-label="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {selectedImages.has(image.id) && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-violet-600 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium truncate" title={image.originalName || image.filename}>
                      {image.originalName || image.filename}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(image.size)}</span>
                      {image.width && image.height && (
                        <span>{image.width}×{image.height}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {image.category}
                      </Badge>
                      {image.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {selectedImages.size > 0 && (
                <span>
                  {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedImages.size === 0}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {selectedImages.size > 0 ? `Select ${selectedImages.size} Image${selectedImages.size > 1 ? 's' : ''}` : 'Select'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
