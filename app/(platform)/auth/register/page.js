"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Phone, Mail, Globe, CheckCircle2, ChevronRight, TrendingUp, Shield, Users, Zap, Check, ArrowRight, Lock, BarChart3, Clock, Award, Loader2 } from 'lucide-react';

function RegisterOnboardingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [phase, setPhase] = useState('register');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('phone');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'CI',
    referralCode: '',
    acceptTerms: false
  });

  const [investAmount, setInvestAmount] = useState(100000);
  const [opportunities, setOpportunities] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(true);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode.toUpperCase() }));
    }
  }, [searchParams]);
  
  useEffect(() => {
    if (phase === 'setup2') {
      fetch('/api/opportunities')
        .then(r => r.json())
        .then(data => {
          if (data.success) setOpportunities(data.opportunities.slice(0, 6));
          setLoadingOpps(false);
        })
        .catch(err => {
          console.error('Erreur opportunités:', err);
          setLoadingOpps(false);
        });
    }
  }, [phase]);

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

  const slides = [
    {
      icon: TrendingUp,
      color: 'from-black via-gray-900 to-black',
      title: 'Rendements Exceptionnels',
      subtitle: 'Gagne jusqu\'à 20% par semaine sur ton investissement, capital initial sécurisé et retirable à tout moment dès le niveau 2.',
      stats: [
        { value: '10%', label: 'Niveau 1', period: 'Par semaine' },
        { value: '15%', label: 'Niveau 2', period: 'Par semaine' },
        { value: '20%', label: 'Niveau 3', period: 'Par semaine' }
      ],
      description: 'Rejoignez les 26,000+ investisseurs qui font fructifier leur argent intelligemment.',
      highlight: '2 Milliards FCFA déjà versés'
    },
    {
      icon: Shield,
      color: 'from-black via-gray-900 to-black',
      title: 'Sécurité Maximale',
      subtitle: 'Votre capital est notre priorité',
      features: [
        { icon: Lock, text: 'Fonds 100% sécurisés et assurés' },
        { icon: Award, text: 'Licence réglementaire officielle' },
        { icon: Shield, text: 'Cryptage bancaire de niveau militaire' },
        { icon: Check, text: 'Retraits à tout moment sous 24h' }
      ],
      description: 'Des milliers d\'investisseurs nous font confiance chaque jour.',
      highlight: 'Aucune perte enregistrée depuis 1 an'
    },
    {
      icon: Users,
      color: 'from-black via-gray-900 to-black',
      title: 'Revenus Passifs',
      subtitle: 'Gagnez sur votre réseau',
      features: [
        { icon: TrendingUp, text: 'Niveau 1 : 10% par semaine sur investissement' },
        { icon: Users, text: 'Niveau 2 : 15% + 10% gains filleuls directs' },
        { icon: Award, text: 'Niveau 3 : 20% + commissions multi-niveaux' }
      ],
      description: 'Plus vous développez votre réseau, plus vos revenus explosent.',
      highlight: 'Revenus passifs + commissions réseau'
    },
    {
      icon: Zap,
      color: 'from-black via-gray-900 to-black',
      title: 'Démarrage Instantané',
      subtitle: 'Investissez en moins de 5 minutes',
      steps: [
        { icon: Check, text: 'Inscription ultra-rapide', time: '30 sec' },
        { icon: Check, text: 'Premier investissement', time: '2 min' },
        { icon: Check, text: 'Activation immédiate', time: '1 min' },
        { icon: Check, text: 'Premiers gains visibles', time: '24h' }
      ],
      description: 'Commencez à générer des revenus dès aujourd\'hui.',
      highlight: 'Minimum 10,000 FCFA pour démarrer'
    }
  ];

  const currentSlideData = slides[currentSlide];

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num);

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+?\d{8,15}$/.test(cleaned);
  };

  const formatPhoneForAPI = (phone) => {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleaned.startsWith('+')) {
      const country = countries.find(c => c.code === formData.country);
      const prefix = country?.prefix || '+225';
      cleaned = prefix + cleaned;
    }
    return cleaned;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    const phoneNumber = loginMethod === 'phone' ? formData.contact : formData.phone;
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      setError('Veuillez entrer un numéro de téléphone valide (ex: 0700000000)');
      return;
    }

    if (loginMethod === 'email' && !formData.contact.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Veuillez accepter les conditions');
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneForAPI(phoneNumber);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: loginMethod === 'email' ? formData.contact : `${formattedPhone.replace(/\+/g, '')}@invest.com`,
          phone: formattedPhone,
          password: formData.password,
          address: countries.find(c => c.code === formData.country)?.name || '',
          referralCode: formData.referralCode.trim() || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      console.log('Inscription réussie:', data);
      window.location.href = '/user';

    } catch (err) {
      console.error('Erreur inscription:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (phase === 'setup1' && !isPaused) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => prev < slides.length - 1 ? prev + 1 : prev);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [phase, isPaused]);

  const handleTouchStart = (e) => { setDragStart(e.touches[0].clientX); setIsPaused(true); };
  const handleTouchEnd = (e) => {
    if (!dragStart) return;
    const diff = dragStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
      else if (diff < 0 && currentSlide > 0) setCurrentSlide(prev => prev - 1);
    }
    setDragStart(null); setIsPaused(false);
  };

  const handleTap = (e) => {
    const { clientX, currentTarget } = e;
    const { width } = currentTarget.getBoundingClientRect();
    if (clientX < width / 3 && currentSlide > 0) setCurrentSlide(prev => prev - 1);
    else if (clientX > (width * 2) / 3 && currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
  };

  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);
  const handleSetup1Next = () => { currentSlide < slides.length - 1 ? setCurrentSlide(prev => prev + 1) : setPhase('setup2'); };
  const handleSkipSetup1 = () => setPhase('setup2');

  if (phase === 'register') {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-black via-gray-900 to-black p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="text-4xl font-bold text-white mb-2">INVEST</div>
            <div className="text-white/90 text-lg">Votre avenir financier commence ici</div>
          </div>

          <div className="relative z-10 space-y-8">
            {[
              { title: 'Rendements garantis', desc: 'Jusqu\'à 20% de rendement par semaine sur vos investissements' },
              { title: 'Sécurité maximale', desc: 'Vos fonds sont protégés et sécurisés à 100%' },
              { title: 'Revenus passifs', desc: 'Gagnez des commissions sur votre réseau' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg mb-1">{item.title}</div>
                    <div className="text-white/80">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-8 text-white/80">
            <div><div className="text-2xl font-bold text-white">26K+</div><div className="text-sm">Investisseurs</div></div>
            <div><div className="text-2xl font-bold text-white">2Mrd+</div><div className="text-sm">FCFA versés</div></div>
            <div><div className="text-2xl font-bold text-white">15%</div><div className="text-sm">Rendement moyen</div></div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
                <p className="text-gray-600">Rejoignez notre communauté d&apos;investisseurs</p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                  <input type="text" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Votre nom complet"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    required disabled={isLoading} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Numéro de téléphone * <span className="text-gray-400 text-xs">(requis pour les paiements)</span>
                  </label>
                  <div className="flex gap-2">
                    <select value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-28 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-gray-900 bg-white text-sm"
                      disabled={isLoading}>
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>{country.flag} {country.prefix}</option>
                      ))}
                    </select>
                    <input type="tel"
                      value={loginMethod === 'phone' ? formData.contact : formData.phone}
                      onChange={(e) => {
                        if (loginMethod === 'phone') setFormData({ ...formData, contact: e.target.value });
                        else setFormData({ ...formData, phone: e.target.value });
                      }}
                      placeholder="07 00 00 00 00"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      required disabled={isLoading} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de connexion</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button type="button" onClick={() => setLoginMethod('phone')} disabled={isLoading}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 text-sm ${loginMethod === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                      <Phone className="w-4 h-4" /> Téléphone
                    </button>
                    <button type="button" onClick={() => setLoginMethod('email')} disabled={isLoading}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 text-sm ${loginMethod === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                      <Mail className="w-4 h-4" /> Email
                    </button>
                  </div>
                </div>

                {loginMethod === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email *</label>
                    <input type="email" value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      required disabled={isLoading} />
                  </div>
                )}

                {loginMethod === 'phone' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <div className="text-blue-600 text-xs">ℹ️ Vous utiliserez votre numéro de téléphone pour vous connecter</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      required disabled={isLoading} minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={isLoading}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe *</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      required disabled={isLoading} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={isLoading}>
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code parrain (optionnel)</label>
                  <input type="text" value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                    placeholder="CODE123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-gray-900 bg-white uppercase"
                    disabled={isLoading} />
                </div>

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="terms" checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="w-5 h-5 mt-0.5 border-gray-300 rounded text-yellow-500 focus:ring-yellow-400"
                    required disabled={isLoading} />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    J&apos;accepte les{' '}
                    <a href="/legal/terms" className="text-yellow-500 hover:text-yellow-600 font-medium">conditions d&apos;utilisation</a>
                    {' '}et la{' '}
                    <a href="/legal/privacy" className="text-yellow-500 hover:text-yellow-600 font-medium">politique de confidentialité</a>
                  </label>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center gap-2">
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Inscription en cours...</>
                  ) : (
                    'Créer mon compte'
                  )}
                </button>

                <div className="text-center text-sm text-gray-600">
                  Déjà un compte ?{' '}
                  <a href="/auth/login" className="text-yellow-500 hover:text-yellow-600 font-medium">Se connecter</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup1') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-white text-3xl font-bold mb-2">Compte créé avec succès ! 🎉</h1>
            <p className="text-gray-400">Complétez votre profil pour accéder à la plateforme</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Nom complet *</label>
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:border-yellow-400 focus:outline-none transition" required />
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">Numéro de téléphone *</label>
                <div className="flex gap-3">
                  <select value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-32 px-3 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:border-yellow-400 focus:outline-none transition">
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>{country.flag} {country.code}</option>
                    ))}
                  </select>
                  <input type="tel" value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="01 02 03 04 05"
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:border-yellow-400 focus:outline-none transition" required />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">Adresse complète *</label>
                <input type="text" placeholder="Cocody, Abidjan, Côte d'Ivoire"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:border-yellow-400 focus:outline-none transition" required />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-blue-400 text-sm">
                    <div className="font-semibold mb-1">Vos informations sont sécurisées</div>
                    <div className="text-blue-400/80">Ces informations sont nécessaires pour la vérification KYC et les retraits futurs.</div>
                  </div>
                </div>
              </div>

              <button onClick={() => setPhase('setup2')}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                Continuer <ArrowRight size={20} />
              </button>

              <button onClick={() => router.push('/user')}
                className="w-full text-gray-400 hover:text-white text-sm transition-colors">
                Passer pour le moment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup2') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4"
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={handleTap}>
        <style jsx>{`@keyframes progress { from { width: 0%; } to { width: 100%; } }`}</style>
        <div className="w-full max-w-md">
          <div className="flex gap-1 mb-4">
            {slides.map((_, idx) => (
              <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-yellow-400 ${idx < currentSlide ? 'w-full' : idx === currentSlide ? 'w-full' : 'w-0'}`}
                  style={{
                    transition: idx === currentSlide ? 'none' : 'width 0.1s',
                    ...(idx === currentSlide && !isPaused && { animation: 'progress 7s linear forwards' }),
                    ...(idx === currentSlide && isPaused && { animationPlayState: 'paused' })
                  }} />
              </div>
            ))}
          </div>

          <div className={`bg-gradient-to-br ${currentSlideData.color} rounded-3xl shadow-2xl overflow-hidden`}>
            <div className="p-6 pb-4">
              <div className="w-16 h-16 bg-yellow-400/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <currentSlideData.icon className="w-8 h-8 text-yellow-400" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2 text-center">{currentSlideData.title}</h2>
              <p className="text-yellow-400 text-base mb-6 text-center font-medium">{currentSlideData.subtitle}</p>

              {currentSlideData.stats && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {currentSlideData.stats.map((stat, idx) => (
                    <div key={idx} className="bg-yellow-400/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/30 text-center">
                      <div className="text-3xl font-black text-yellow-400 mb-1">{stat.value}</div>
                      <div className="text-white/90 text-xs font-bold uppercase tracking-wide">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {currentSlideData.features && (
                <div className="space-y-3 mb-8">
                  {currentSlideData.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-yellow-400/10 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400/30">
                      <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-black" />
                      </div>
                      <span className="text-white font-semibold text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {currentSlideData.steps && (
                <div className="space-y-3 mb-8">
                  {currentSlideData.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-yellow-400/10 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400/30">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-black font-black text-xs">{idx + 1}</span>
                        </div>
                        <span className="text-white font-semibold text-sm">{step.text}</span>
                      </div>
                      <span className="text-yellow-400 text-xs font-bold">{step.time}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-white/90 text-center text-sm mb-4 font-medium">{currentSlideData.description}</p>
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-4 text-center shadow-xl">
                <span className="text-black font-black text-sm">{currentSlideData.highlight}</span>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-sm p-4">
              <button onClick={handleSetup1Next}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                {currentSlide === slides.length - 1 ? "Commencer à investir 🚀" : "Suivant"}
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={handleSkipSetup1}
                className="w-full mt-3 text-yellow-400/40 hover:text-yellow-400/60 text-xs transition-colors">
                Passer
              </button>
            </div>
          </div>

          {currentSlide === 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-white/40 text-xs">
              <span>←</span><span>Glissez pour naviguer</span><span>→</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default function RegisterOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-900">Chargement...</div></div>}>
      <RegisterOnboardingPageInner />
    </Suspense>
  );
}