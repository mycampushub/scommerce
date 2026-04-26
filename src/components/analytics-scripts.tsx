'use client'

import Script from 'next/script'

interface AnalyticsScriptsProps {
  googleAnalyticsId?: string
  googleTagManagerId?: string
}

export function AnalyticsScripts({
  googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  googleTagManagerId = process.env.NEXT_PUBLIC_GTM_ID,
}: AnalyticsScriptsProps) {
  // Google Tag Manager Script
  if (googleTagManagerId) {
    return (
      <>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${googleTagManagerId}');
            `,
          }}
        />
        {/* Google Tag Manager noscript */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
      </>
    )
  }

  // Google Analytics 4 (if GTM is not used)
  if (googleAnalyticsId) {
    return (
      <>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}');
            `,
          }}
        />
      </>
    )
  }

  return null
}

export function SearchConsoleVerification({
  verificationCode = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
}: {
  verificationCode?: string
}) {
  if (!verificationCode) return null

  return (
    <meta
      name="google-site-verification"
      content={verificationCode}
    />
  )
}
