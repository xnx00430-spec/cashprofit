// app/(marketing)/components/Footer.jsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="md:col-span-1">
            <div className="text-2xl font-black text-white mb-4">
              Cash<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Profit</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Investissez intelligemment et profitez de bénéfices chaque semaine. Votre capital est protégé.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm">Plateforme active</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5">Navigation</h4>
            <div className="space-y-3">
              <a href="#comment-ca-marche" className="block text-gray-500 hover:text-white text-sm transition-colors">Comment ça marche</a>
              <a href="#niveaux" className="block text-gray-500 hover:text-white text-sm transition-colors">Niveaux</a>
              <a href="#parrainage" className="block text-gray-500 hover:text-white text-sm transition-colors">Parrainage</a>
              <a href="#securite" className="block text-gray-500 hover:text-white text-sm transition-colors">Sécurité</a>
              <Link href="/equipe" className="block text-gray-500 hover:text-white text-sm transition-colors">Notre équipe</Link>
              <Link href="/blog" className="block text-gray-500 hover:text-white text-sm transition-colors">Blog</Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5">Compte</h4>
            <div className="space-y-3">
              <Link href="/auth/register" className="block text-gray-500 hover:text-white text-sm transition-colors">Créer un compte</Link>
              <Link href="/auth/login" className="block text-gray-500 hover:text-white text-sm transition-colors">Se connecter</Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5">Support</h4>
            <div className="space-y-3">
              <a href="mailto:support@cashprofit.fr" className="block text-gray-500 hover:text-white text-sm transition-colors">support@cashprofit.fr</a>
              <a href="https://wa.me/47XXXXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="block text-gray-500 hover:text-white text-sm transition-colors">WhatsApp Support</a>
              <p className="text-gray-600 text-xs mt-4">Lun-Sam • 9h-18h (GMT)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} CashProfit. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <Link href="/legal/terms" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">CGU</Link>
            <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">Confidentialité</Link>
            <Link href="/equipe" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">Équipe</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}