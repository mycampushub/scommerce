'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface UploadedImage {
  url: string
  size: number
  type: string
  name: string
  isNew?: boolean
}

interface ImageUploadProps {
  images?: string[]
  onImagesChange?: (images: string[]) => void
  productId?: string
  maxImages?: number
  accept?: string
  maxSize?: number // in MB
}

function SortableImage({
  image,
  index,
  onRemove,
  onReorder,
  isUploading = false,
}: {
  image: UploadedImage | string
  index: number
  onRemove: (index: number) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  isUploading?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const imageUrl = typeof image === 'string' ? image : image.url
  const imageName = typeof image === 'string' ? `Image ${index + 1}` : image.name
  const imageSize = typeof image === 'string' ? 0 : image.size

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card className={`overflow-hidden border-2 ${isDragging ? 'opacity-50' : ''}`}>
        <div className="aspect-square relative">
          <img
            src={imageUrl}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-white" />
            </button>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => onRemove(index)}
              disabled={isUploading}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Badge className="absolute bottom-2 left-2 bg-violet-600">
            #{index + 1}
          </Badge>
        </div>
      </Card>
      <p className="text-xs text-gray-500 mt-1 truncate">{imageName}</p>
      {imageSize > 0 && (
        <p className="text-xs text-gray-400">
          {(imageSize / 1024).toFixed(1)} KB
        </p>
      )}
    </div>
  )
}

export function ImageUpload({
  images: initialImages = [],
  onImagesChange,
  productId,
  maxImages = 10,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  maxSize = 5
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<(UploadedImage | string)[]>([])

  // Initialize images from prop
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages)
    }
  }, [initialImages])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Validate file count
    if (images.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      setTimeout(() => setError(null), 3000)
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    const newImages: UploadedImage[] = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]

      // Validate file type
      const allowedTypes = accept.split(',')
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.type}`)
        continue
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${maxSize}MB limit`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          newImages.push({
            ...result.data,
            isNew: true,
          })
        } else {
          console.error('Upload failed:', result.error)
          setError(`Failed to upload ${file.name}: ${result.error}`)
        }
      } catch (err) {
        console.error('Upload error:', err)
        setError(`Failed to upload ${file.name}`)
      }

      setUploadProgress(((i + 1) / fileArray.length) * 100)
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      onImagesChange?.(updatedImages.map(img => typeof img === 'string' ? img : img.url))
    }

    setUploading(false)
    setUploadProgress(0)
    setTimeout(() => setError(null), 3000)
  }, [images, maxImages, maxSize, accept, onImagesChange])

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index]
    const imageUrl = typeof imageToRemove === 'string' ? imageToRemove : imageToRemove.url

    // If it's a new image, delete from server
    if (typeof imageToRemove === 'object' && imageToRemove.isNew) {
      try {
        await fetch(`/api/admin/upload?path=${encodeURIComponent(imageUrl.replace('/', ''))}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Delete error:', error)
      }
    }

    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange?.(updatedImages.map(img => typeof img === 'string' ? img : img.url))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = active.id as number
      const newIndex = over?.id as number

      const reorderedImages = arrayMove(images, oldIndex, newIndex)
      setImages(reorderedImages)
      onImagesChange?.(reorderedImages.map(img => typeof img === 'string' ? img : img.url))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <Card className="border-2 border-dashed hover:border-violet-400 transition-colors">
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
          >
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-violet-600 animate-spin mb-4" />
                <p className="text-sm text-gray-600">Uploading... {Math.round(uploadProgress)}%</p>
              </>
            ) : (
              <>
                <div className="mb-4 p-4 bg-violet-100 rounded-full">
                  <Upload className="h-8 w-8 text-violet-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Drag & drop images here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP up to {maxSize}MB
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum {maxImages} images
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept={accept}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="image-upload-input"
                  disabled={uploading || images.length >= maxImages}
                />
                <Button
                  onClick={() => document.getElementById('image-upload-input')?.click()}
                  disabled={uploading || images.length >= maxImages}
                  className="mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  {images.length >= maxImages
                    ? 'Maximum images reached'
                    : 'Select Images'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map((_, i) => i)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <SortableImage
                  key={index}
                  image={image}
                  index={index}
                  onRemove={handleRemoveImage}
                  isUploading={uploading}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}
