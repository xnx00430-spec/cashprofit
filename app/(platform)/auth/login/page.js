'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Phone, Lock, CheckCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [contactMethod, setContactMethod] = useState('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    contact: '',
    password: '',
    remember: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.contact,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la connexion');
      }

      // ✅ Connexion réussie
      console.log('Connexion réussie:', data);

      // Redirection selon le rôle
      if (data.user.role === 'admin') {
        // Admin → Dashboard admin
        router.push('/admin');
      } else {
        // User → Dashboard user
        router.push('/user');
      }

    } catch (err) {
      console.error('Erreur connexion:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-black to-gray-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-[#fcd535] flex items-center justify-center text-black font-bold text-xl">
              I
            </div>
            <span className="text-white text-2xl font-bold">INVEST</span>
          </div>
          
          <h1 className="text-white text-4xl font-bold mb-6">
            Bon retour parmi nous
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Connectez-vous pour accéder à votre tableau de bord et suivre vos investissements
          </p>

          <div className="space-y-4">
            {[
              'Gains en temps réel',
              'Gestion de votre réseau',
              'Retraits instantanés',
              'Support 24/7',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#0ecb81] flex items-center justify-center rounded-full">
                  <CheckCircle size={16} className="text-black" />
                </div>
                <span className="text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-500 text-sm">
          © 2025 INVEST. Tous droits réservés.
        </p>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          
          {/* LOGO MOBILE */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#fcd535] flex items-center justify-center text-black font-bold">
              I
            </div>
            <span className="text-black text-xl font-bold">INVEST</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Connexion</h2>
            <p className="text-gray-600">Accédez à votre compte</p>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* CONTACT METHOD TOGGLE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Se connecter avec
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setContactMethod('phone')}
                  disabled={isLoading}
                  className={`py-2 text-sm font-medium transition-colors rounded-md ${
                    contactMethod === 'phone'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Téléphone
                </button>
                <button
                  type="button"
                  onClick={() => setContactMethod('email')}
                  disabled={isLoading}
                  className={`py-2 text-sm font-medium transition-colors rounded-md ${
                    contactMethod === 'email'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Email
                </button>
              </div>
            </div>

            {/* CONTACT INPUT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {contactMethod === 'phone' ? 'Numéro de téléphone' : 'Adresse email'}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {contactMethod === 'phone' ? <Phone size={20} /> : <Mail size={20} />}
                </div>
                <input
                  type={contactMethod === 'phone' ? 'tel' : 'email'}
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20"
                  placeholder={contactMethod === 'phone' ? '+225 07 XX XX XX XX' : 'exemple@email.com'}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-[#f0b90b] hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={formData.remember}
                onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                className="w-4 h-4 accent-[#f0b90b] rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Se souvenir de moi
              </label>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#fcd535] hover:bg-[#f0b90b] disabled:bg-gray-300 disabled:cursor-not-allowed text-black py-3 font-bold transition-colors rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* REGISTER LINK */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Vous n'avez pas de compte ?{' '}
            <Link href="/auth/register" className="text-[#f0b90b] hover:underline font-semibold">
              Créer un compte
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}