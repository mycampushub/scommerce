import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Skeleton className="h-10 w-40" />
            <div className="hidden lg:flex items-center gap-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-8 w-8 lg:hidden" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="relative w-full" style={{ minHeight: '378px' }}>
        <Skeleton className="w-full h-full absolute inset-0" />
      </div>

      {/* Marquee Skeleton */}
      <div className="bg-pink-600 overflow-hidden py-3">
        <div className="flex gap-8 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-6 w-64 bg-white/20" />
          ))}
        </div>
      </div>

      {/* Categories Section Skeleton */}
      <section className="w-full py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <Skeleton className="h-9 w-48 mx-auto mb-6" />
          <div className="px-3 py-3 md:px-12 md:py-6">
            {/* Mobile Skeleton */}
            <div className="flex gap-2 overflow-hidden pb-2 md:hidden">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex-shrink-0 w-[78px]">
                  <Skeleton className="w-[78px] h-[104px] rounded-lg" />
                  <Skeleton className="h-4 w-20 mt-2 mx-auto" />
                </div>
              ))}
            </div>

            {/* Desktop Skeleton */}
            <div className="hidden md:grid grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="w-full">
                  <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                  <Skeleton className="h-4 w-24 mt-2 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Skeleton */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-9 w-48" />
          <div className="flex gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="w-full aspect-[3/4] rounded-xl" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Skeleton */}
      <div className="bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t">
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
