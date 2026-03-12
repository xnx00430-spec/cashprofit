// app/auth/forgot-password/page.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Veuillez entrer votre email ou numéro de téléphone');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-black to-gray-900 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-12">
            <span className="text-3xl font-black tracking-tight text-white">
              Cash<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Profit</span>
            </span>
          </Link>
          <h1 className="text-white text-4xl font-bold mb-6">Mot de passe oublié ?</h1>
          <p className="text-gray-400 text-lg">Pas de panique, ça arrive à tout le monde. Nous allons vous envoyer un lien pour le réinitialiser.</p>
        </div>
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} CashProfit. Tous droits réservés.</p>
      </div>

      {/* Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl font-black tracking-tight text-gray-900">
              Cash<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">Profit</span>
            </span>
          </div>

          <Link href="/auth/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Retour à la connexion
          </Link>

          {sent ? (
            /* Succès */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Email envoyé !</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Si un compte existe avec cet identifiant, vous recevrez un email avec un lien pour réinitialiser votre mot de passe. Vérifiez aussi vos spams.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-yellow-800 text-xs">Le lien expire dans 1 heure. Si vous ne recevez rien, vérifiez que vous avez entré le bon email.</p>
              </div>
              <button onClick={() => { setSent(false); setIdentifier(''); }}
                className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                Renvoyer un email
              </button>
            </div>
          ) : (
            /* Formulaire */
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-black mb-2">Réinitialiser le mot de passe</h2>
                <p className="text-gray-600 text-sm">Entrez votre email ou numéro de téléphone et nous vous enverrons un lien de réinitialisation.</p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email ou numéro de téléphone</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail size={20} />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="votre@email.com ou 0700000000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#fcd535] hover:bg-[#f0b90b] disabled:bg-gray-300 disabled:cursor-not-allowed text-black py-3 font-bold transition-colors rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</>
                  ) : (
                    'Envoyer le lien de réinitialisation'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-6">
                Vous vous souvenez ?{' '}
                <Link href="/auth/login" className="text-[#f0b90b] hover:underline font-semibold">Se connecter</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}