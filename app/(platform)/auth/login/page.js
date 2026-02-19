'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Phone, Lock, CheckCircle, Loader2 } from 'lucide-react';

const countries = [
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', prefix: '+225' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', prefix: '+221' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', prefix: '+226' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', prefix: '+229' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', prefix: '+233' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', prefix: '+234' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', prefix: '+232' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', prefix: '+228' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', prefix: '+237' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', prefix: '+242' },
  { code: 'CD', name: 'RD Congo', flag: '🇨🇩', prefix: '+243' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', prefix: '+241' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', prefix: '+254' },
  { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿', prefix: '+255' },
  { code: 'UG', name: 'Ouganda', flag: '🇺🇬', prefix: '+256' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', prefix: '+250' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', prefix: '+258' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', prefix: '+265' },
  { code: 'ZM', name: 'Zambie', flag: '🇿🇲', prefix: '+260' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', prefix: '+223' },
];

export default function LoginPage() {
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [contactMethod, setContactMethod] = useState('phone');
  const [country, setCountry] = useState('CI');
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
      let loginIdentifier = formData.contact.trim();

      // Si connexion par téléphone, ajouter l'indicatif
      if (contactMethod === 'phone') {
        let cleaned = loginIdentifier.replace(/[\s\-\(\)]/g, '');
        if (!cleaned.startsWith('+')) {
          const selectedCountry = countries.find(c => c.code === country);
          const prefix = selectedCountry?.prefix || '+225';
          cleaned = prefix + cleaned;
        }
        loginIdentifier = cleaned;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginIdentifier,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la connexion');
      }

      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
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
          <div className="flex items-center gap-2 mb-12">
            <span className="text-3xl font-black tracking-tight text-white">
              Cash<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Profit</span>
            </span>
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
          © 2025 CashProfit. Tous droits réservés.
        </p>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          
          {/* LOGO MOBILE */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl font-black tracking-tight text-gray-900">
              Cash<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">Profit</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Connexion</h2>
            <p className="text-gray-600">Accédez à votre compte</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Se connecter avec</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => setContactMethod('phone')} disabled={isLoading}
                  className={`py-2 text-sm font-medium transition-colors rounded-md flex items-center justify-center gap-1.5 ${contactMethod === 'phone' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'}`}>
                  <Phone size={14} /> Téléphone
                </button>
                <button type="button" onClick={() => setContactMethod('email')} disabled={isLoading}
                  className={`py-2 text-sm font-medium transition-colors rounded-md flex items-center justify-center gap-1.5 ${contactMethod === 'email' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'}`}>
                  <Mail size={14} /> Email
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {contactMethod === 'phone' ? 'Numéro de téléphone' : 'Adresse email'}
              </label>

              {contactMethod === 'phone' ? (
                <div className="flex gap-2">
                  <select value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-28 px-2 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20 text-black bg-white text-sm"
                    disabled={isLoading}>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.prefix}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone size={18} />
                    </div>
                    <input type="tel" value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20"
                      placeholder="07 00 00 00 00"
                      required disabled={isLoading} />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={20} />
                  </div>
                  <input type="email" value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20"
                    placeholder="exemple@email.com"
                    required disabled={isLoading} />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <Link href="/auth/forgot-password" className="text-sm text-[#f0b90b] hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={20} /></div>
                <input type={showPassword ? 'text' : 'password'} value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#f0b90b] focus:ring-2 focus:ring-[#f0b90b]/20"
                  placeholder="••••••••" required disabled={isLoading} minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black" disabled={isLoading}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={formData.remember}
                onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                className="w-4 h-4 accent-[#f0b90b] rounded" disabled={isLoading} />
              <label htmlFor="remember" className="text-sm text-gray-600">Se souvenir de moi</label>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-[#fcd535] hover:bg-[#f0b90b] disabled:bg-gray-300 disabled:cursor-not-allowed text-black py-3 font-bold transition-colors rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Connexion en cours...</>) : ('Se connecter')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Vous n&apos;avez pas de compte ?{' '}
            <Link href="/auth/register" className="text-[#f0b90b] hover:underline font-semibold">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}