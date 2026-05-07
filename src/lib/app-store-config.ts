/**
 * App Store Links Configuration
 *
 * Configure your app store links here.
 * These links will be displayed in the footer when the app is NOT running in PWA mode.
 */

export interface AppStoreLinks {
  android: {
    enabled: boolean
    url: string
    label: string
    icon?: string
  }
  ios: {
    enabled: boolean
    url: string
    label: string
    icon?: string
  }
}

/**
 * Default app store configuration
 * Update these URLs with your actual app store links
 */
export const appStoreLinks: AppStoreLinks = {
  android: {
    enabled: true,
    url: 'https://play.google.com/store/apps/details?id=com.yourappname',
    label: 'Get it on Google Play',
    icon: 'Google Play'
  },
  ios: {
    enabled: true,
    url: 'https://apps.apple.com/app/yourappname/id123456789',
    label: 'Download on the App Store',
    icon: 'App Store'
  }
}

/**
 * Helper function to get enabled app store links
 */
export function getEnabledAppStoreLinks(): Partial<AppStoreLinks> {
  const links: Partial<AppStoreLinks> = {}

  if (appStoreLinks.android.enabled) {
    links.android = appStoreLinks.android
  }

  if (appStoreLinks.ios.enabled) {
    links.ios = appStoreLinks.ios
  }

  return links
}

/**
 * Check if any app store links are enabled
 */
export function hasAppStoreLinks(): boolean {
  return appStoreLinks.android.enabled || appStoreLinks.ios.enabled
}
