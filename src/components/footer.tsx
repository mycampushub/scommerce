'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePWADetection } from '@/hooks/use-pwa-detection'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { Smartphone, Download, X, Info, Share2 } from 'lucide-react'

export function Footer() {
  const { isPWA, isMounted } = usePWADetection()
  const { canInstall, isIOS, isInstalling, installPWA } = usePWAInstall()
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  // Show install prompt if not in PWA mode and either Chrome/Edge can install or it's iOS
  const showInstallSection = isMounted && !isPWA && (canInstall || isIOS)

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        {/* PWA Install Section - Only shown when NOT in PWA mode */}
        {showInstallSection && (
          <div className="mb-12 border-b border-gray-700 pb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold mb-2 text-pink-500">Install Our App</h3>
                <p className="text-gray-400 text-sm">Get the best shopping experience on your mobile device</p>
              </div>

              {canInstall ? (
                // Chrome/Edge - Direct install button
                <button
                  onClick={installPWA}
                  disabled={isInstalling}
                  className="inline-flex items-center gap-3 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <Download className="w-6 h-6" />
                  <span className="font-semibold">
                    {isInstalling ? 'Installing...' : 'Install App'}
                  </span>
                </button>
              ) : isIOS ? (
                // iOS - Instructions button
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => setShowIOSInstructions(!showIOSInstructions)}
                    className="inline-flex items-center gap-3 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Smartphone className="w-6 h-6" />
                    <span className="font-semibold">Install App</span>
                  </button>

                  {showIOSInstructions && (
                    <div className="bg-gray-800 rounded-lg p-4 max-w-md text-sm relative">
                      <button
                        onClick={() => setShowIOSInstructions(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        How to Install on iOS
                      </h4>
                      <ol className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="bg-pink-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                          <span>Tap the <Share2 className="w-4 h-4 inline mx-1" /> Share button in Safari</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-pink-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                          <span>Scroll down and tap "Add to Home Screen"</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-pink-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                          <span>Tap "Add" in the top right corner</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-pink-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                          <span>The app will appear on your home screen</span>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/collections/saree" className="text-gray-300 hover:text-white transition-colors">Sarees</Link></li>
              <li><Link href="/collections/salwar" className="text-gray-300 hover:text-white transition-colors">Salwar Suits</Link></li>
              <li><Link href="/collections/lehengas" className="text-gray-300 hover:text-white transition-colors">Lehengas</Link></li>
              <li><Link href="/collections/gowns" className="text-gray-300 hover:text-white transition-colors">Gowns</Link></li>
              <li><Link href="/collections/kurtas" className="text-gray-300 hover:text-white transition-colors">Kurtas</Link></li>
              <li><Link href="/collections/tops" className="text-gray-300 hover:text-white transition-colors">Tops</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Sale</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Wedding</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Festive</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-gray-300 hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-gray-300 hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Connect With Us</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 modern ecommerce. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
