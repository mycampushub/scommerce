'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Star, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface ReviewsSectionProps {
  productId: string
  averageRating?: number
  reviewCount?: number
}

export function ReviewsSection({ productId, averageRating = 0, reviewCount = 0 }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'latest' | 'highest'>('latest')
  const [showAll, setShowAll] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?productId=${productId}`)
      const data = await response.json()

      if (data.success) {
        setReviews(data.data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const getSortedReviews = () => {
    const sorted = [...reviews]
    if (sortBy === 'latest') {
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else {
      return sorted.sort((a, b) => b.rating - a.rating)
    }
  }

  const displayedReviews = showAll ? getSortedReviews() : getSortedReviews().slice(0, 5)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`
    return `${Math.ceil(diffDays / 365)} years ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Customer Reviews
            </h2>
            {averageRating > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {averageRating.toFixed(1)} average based on {reviewCount} reviews
                </span>
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="mt-4 md:mt-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'highest')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="latest">Latest Reviews</option>
              <option value="highest">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {displayedReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No reviews yet.</p>
                <p className="text-sm text-gray-500">
                  Be the first to review this product!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {displayedReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <span className="text-pink-600 font-semibold">
                          {review.user.name?.charAt(0) || review.user.email.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {review.user.name || review.user.email.split('@')[0]}
                        </h4>
                        <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    {review.isVerified && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {review.title && (
                    <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
                  )}

                  {review.comment && (
                    <p className="text-gray-600">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {reviews.length > 5 && !showAll && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(true)}
              className="min-w-[200px]"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Load More Reviews ({reviews.length - 5})
            </Button>
          </div>
        )}

        {showAll && reviews.length > 5 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(false)}
              className="min-w-[200px]"
            >
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
