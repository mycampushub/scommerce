'use client'

import React, { useState } from 'react'
import { Star, X, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

interface ReviewFormProps {
  productId: string
  productName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  hasPurchased?: boolean
}

export function ReviewForm({
  productId,
  productName,
  isOpen,
  onClose,
  onSuccess,
  hasPurchased = false,
}: ReviewFormProps) {
  const { user, isAuthenticated } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated || !user) {
      toast.error('Please login to submit a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter a review title')
      return
    }

    if (!comment.trim()) {
      toast.error('Please enter your review')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      })

      const data = await response.json() as any

      if (data.success) {
        toast.success(data.message || 'Review submitted successfully!')
        
        // Reset form
        setRating(0)
        setTitle('')
        setComment('')
        
        // Close dialog and refresh reviews
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden" showCloseButton={false} aria-describedby="review-description">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <div className="flex items-center justify-between pr-10">
            <DialogTitle className="text-xl font-bold">Write a Review</DialogTitle>
            <DialogDescription id="review-description" className="sr-only">
              Write a review for {productName}
            </DialogDescription>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Reviewing:</p>
            <p className="font-semibold text-gray-900">{productName}</p>
            {hasPurchased && (
              <Badge variant="secondary" className="mt-2 bg-green-50 text-green-700 border-green-200">
                <Check className="w-3 h-3 mr-1" />
                Verified Purchase
              </Badge>
            )}
          </div>

          {!isAuthenticated && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please <a href="/login" className="font-semibold underline">login</a> to submit a review.
              </p>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Overall Rating</Label>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={!isAuthenticated}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 p-1 -m-1"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-9 h-9 sm:w-8 sm:h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 ? `${rating} out of 5` : 'Select a rating'}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Review Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Summarize your review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isAuthenticated || submitting}
              maxLength={100}
              required
              className={!isAuthenticated ? 'bg-gray-50' : ''}
            />
            <p className="text-xs text-gray-500 text-right">{title.length}/100</p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-semibold">
              Your Review <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience with this product"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!isAuthenticated || submitting}
              rows={5}
              maxLength={1000}
              required
              className={!isAuthenticated ? 'bg-gray-50' : ''}
            />
            <p className="text-xs text-gray-500 text-right">{comment.length}/1000</p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isAuthenticated || submitting}
            className="w-full min-h-[44px] text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Your review will be published after admin approval
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
