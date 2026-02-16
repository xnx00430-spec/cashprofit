import './globals.css'

export const metadata = {
  title: 'INVEST - Plateforme d\'investissement',
  description: 'Investissez intelligemment et générez des revenus passifs',
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