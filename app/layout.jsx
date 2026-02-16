import './globals.css'

export const metadata = {
  title: 'CashProfit - Investissez et générez des revenus passifs',
  description: 'Investissez dès 10,000 FCFA et gagnez jusqu\'à 20% par semaine. Rejoignez des milliers d\'investisseurs sur CashProfit.',
  metadataBase: new URL('https://cashprofit.net'),
  openGraph: {
    title: 'CashProfit - Investissez et générez des revenus passifs',
    description: 'Investissez dès 10,000 FCFA et gagnez jusqu\'à 20% par semaine. Rejoignez des milliers d\'investisseurs.',
    url: 'https://cashprofit.net',
    siteName: 'CashProfit',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CashProfit - Plateforme d\'investissement',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CashProfit - Investissez et générez des revenus passifs',
    description: 'Investissez dès 10,000 FCFA et gagnez jusqu\'à 20% par semaine.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="antialiased bg-black" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}