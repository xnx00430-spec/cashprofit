// app/auth/reset-password/page.jsx
'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Vérifier que les params sont présents
  if (!token || !email) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-red-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Lien invalide</h2>
        <p className="text-gray-600 text-sm mb-6">Ce lien de réinitialisation est invalide ou incomplet. Veuillez refaire une demande.</p>
        <Link href="/auth/forgot-password"
          className="inline-block bg-gray-900 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Mot de passe modifié !</h2>
        <p className="text-gray-600 text-sm mb-6">Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.</p>
        <Link href="/auth/login"
          className="inline-block bg-[#fcd535] hover:bg-[#f0b90b] text-black font-bold px-8 py-3 rounded-lg transition-colors shadow-lg">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-black mb-2">Nouveau mot de passe</h2>
        <p className="text-gray-600 text-sm">Choisissez un nouveau mot de passe pour votre compte.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20"
              required
              disabled={isLoading}
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black" disabled={isLoading}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20"
              required
              disabled={isLoading}
              minLength={6}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black" disabled={isLoading}>
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#fcd535] hover:bg-[#f0b90b] disabled:bg-gray-300 disabled:cursor-not-allowed text-black py-3 font-bold transition-colors rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Modification en cours...</>
          ) : (
            'Changer mon mot de passe'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        <Link href="/auth/login" className="text-[#f0b90b] hover:underline font-semibold">Retour à la connexion</Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-white text-4xl font-bold mb-6">Nouveau mot de passe</h1>
          <p className="text-gray-400 text-lg">Choisissez un mot de passe sécurisé pour protéger votre compte.</p>
        </div>
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} CashProfit. Tous droits réservés.</p>
      </div>

      {/* Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl font-black tracking-tight text-gray-900">
              Cash<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">Profit</span>
            </span>
          </div>
          <Suspense fallback={<div className="text-center text-gray-500">Chargement...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}