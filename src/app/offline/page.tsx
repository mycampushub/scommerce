'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudOff, RefreshCw, Wifi, AlertTriangle, Package, ShoppingBag, Heart } from 'lucide-react';

/**
 * Offline Page
 * Displayed when user is offline
 * Provides guidance and retry options
 */

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  // Redirect to home if we're back online
  useEffect(() => {
    if (isOnline) {
      window.location.href = '/';
    }
  }, [isOnline]);

  if (isOnline) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Offline Indicator */}
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                <CloudOff className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">You're Offline</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Please check your internet connection and try again
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Available */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-muted-foreground" />
              What's Available Offline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browsing Products</h3>
                <p className="text-sm text-gray-600">
                  Products you've viewed are cached and available
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Wishlist</h3>
                <p className="text-sm text-gray-600">
                  Your saved items are available offline
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cart</h3>
                <p className="text-sm text-gray-600">
                  Items in your cart are saved for offline viewing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Your cart and wishlist are saved automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Any changes you make will sync when you're back online</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Some features may require an internet connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Check your network settings if connection persists</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRetry}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            size="lg"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Go to Homepage
          </Button>
        </div>

        {/* Status */}
        <div className="text-center text-sm text-gray-500">
          <p>Checking for connection...</p>
          <p className="mt-1">
            Status:{' '}
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-orange-600 font-medium">Offline</span>
            </span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
