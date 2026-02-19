// app/(platform)/user/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Eye, EyeOff, TrendingUp, Wallet, Users, 
  Rocket, ArrowUpRight, ArrowDownLeft, Plus,
  X, Check, Info, Clock, Target, AlertCircle, HelpCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [user, setUser] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [hasReferrer, setHasReferrer] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [investAmount, setInvestAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUserData();
    fetchOpportunities();
    fetchInvestments();
    
    const interval = setInterval(() => {
      fetchUserData();
      fetchInvestments();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setHasReferrer(data.user.hasReferrer || false);
        // Afficher bienvenue si nouveau (pas encore investi)
        if ((data.user.totalInvested || 0) === 0) {
          setShowWelcome(true);
        }
      }
    } catch (error) {
      console.error('Erreur profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const res = await fetch('/api/opportunities');
      const data = await res.json();
      if (data.success) setOpportunities(data.opportunities);
    } catch (error) {
      console.error('Erreur opportunités:', error);
    }
  };

  const fetchInvestments = async () => {
    try {
      const res = await fetch('/api/user/investments');
      const data = await res.json();
      if (data.success) {
        setInvestments(data.investments);
        if (data.hasReferrer !== undefined) setHasReferrer(data.hasReferrer);
      }
    } catch (error) {
      console.error('Erreur investissements:', error);
    }
  };

  const handlePay = async () => {
    const amount = Number(investAmount);
    const min = selectedOpp.minInvestment || 1000;
    const max = selectedOpp.maxInvestment || 10000000;
    if (!amount || amount < min) {
      alert(`Veuillez entrer un montant minimum de ${min.toLocaleString()} FCFA`);
      return;
    }
    if (amount > max) {
      alert(`Le montant maximum est de ${max.toLocaleString()} FCFA`);
      return;
    }
    setIsInvesting(true);
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: selectedOpp.id, amount })
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert(data.message || 'Erreur lors de l\'initiation du paiement');
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      alert('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setIsInvesting(false);
    }
  };

  const calculateProjection = () => {
    if (!selectedOpp || !investAmount) return 0;
    const gross = Number(investAmount) * (selectedOpp.finalRate / 100);
    return hasReferrer ? gross * 0.90 : gross;
  };

  const getTimeRemaining = () => {
    if (!user?.currentLevelDeadline) return null;
    const now = new Date();
    const deadline = new Date(user.currentLevelDeadline);
    const diff = deadline - now;
    if (diff <= 0) return { expired: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours, expired: false };
  };

  const getChallengeProgress = () => {
    if (!user || !user.currentLevelTarget) return 0;
    return Math.min((user.currentLevelCagnotte / user.currentLevelTarget) * 100, 100);
  };

  const getTotalLiveEarnings = () => {
    if (!investments || investments.length === 0) return 0;
    return investments.reduce((sum, inv) => sum + (inv.currentEarnings || 0), 0);
  };

  const getUnsyncedEarnings = () => {
    if (!investments || investments.length === 0) return 0;
    return investments.reduce((sum, inv) => sum + (inv.unsyncedEarnings || 0), 0);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900">Chargement...</div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();
  const challengeProgress = getChallengeProgress();
  const totalLiveEarnings = getTotalLiveEarnings();
  const unsyncedEarnings = getUnsyncedEarnings();
  const totalBenefices = (user?.balance || 0) + unsyncedEarnings;
  const totalBalance = (user?.totalInvested || 0) + totalBenefices + (user?.totalCommissions || 0) + (user?.bonusParrainage || 0);
  const hasInvested = (user?.totalInvested || 0) > 0;

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">

        {/* ==================== BIENVENUE NOUVEAU UTILISATEUR ==================== */}
        {showWelcome && !hasInvested && (
          <div className="mb-6 bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 relative overflow-hidden">
            <button onClick={() => setShowWelcome(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={18} />
            </button>
            <h2 className="text-white text-xl font-bold mb-2">
              Bienvenue{user?.name ? `, ${user.name.split(' ')[0]}` : ''} !
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-xl">
              Vous êtes sur votre tableau de bord. C&apos;est ici que vous allez voir tout votre argent : vos investissements, vos gains, et vos retraits. Pour commencer à gagner de l&apos;argent, voici ce qu&apos;il faut faire :
            </p>
            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-900 text-xs font-black">1</div>
                <div>
                  <div className="text-white text-sm font-semibold">Faites votre premier investissement</div>
                  <div className="text-white/50 text-xs">À partir de 10,000 FCFA via Mobile Money. Votre argent commence à travailler immédiatement.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0 text-yellow-400 text-xs font-black">2</div>
                <div>
                  <div className="text-white/70 text-sm font-semibold">Regardez vos gains augmenter</div>
                  <div className="text-white/50 text-xs">Vos bénéfices s&apos;affichent en temps réel sur cette page, seconde par seconde.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0 text-yellow-400 text-xs font-black">3</div>
                <div>
                  <div className="text-white/70 text-sm font-semibold">Retirez quand vous voulez</div>
                  <div className="text-white/50 text-xs">Vos bénéfices arrivent sur votre Mobile Money en moins de 24 heures.</div>
                </div>
              </div>
            </div>
            <button onClick={() => { setShowWelcome(false); setShowInvestModal(true); }}
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              Faire mon premier investissement
            </button>
          </div>
        )}

        {/* BANNER RAPPEL KYC */}
        {user && hasInvested && user.kyc?.status !== 'approved' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-blue-600" size={14} />
              </div>
              <div className="text-gray-700 text-xs">
                <span className="font-bold text-blue-700">Vérification requise</span> — Complétez votre vérification d&apos;identité pour pouvoir <span className="font-bold">retirer vos gains</span>
              </div>
            </div>
            <Link href="/user/profil"
              className="bg-blue-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 whitespace-nowrap">
              Vérifier
            </Link>
          </div>
        )}

        {/* BANNER INVESTIR (si pas le welcome) */}
        {user && !hasInvested && !showWelcome && (
          <div className="mb-6 bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-yellow-400/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Rocket className="text-yellow-400" size={14} />
              </div>
              <div className="text-white text-xs">
                Investissez dès <span className="font-bold text-yellow-400">10,000 F</span> et commencez à gagner de l&apos;argent chaque seconde
              </div>
            </div>
            <button onClick={() => setShowInvestModal(true)}
              className="bg-yellow-400 text-gray-900 font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors flex-shrink-0 whitespace-nowrap">
              Investir
            </button>
          </div>
        )}

        {/* BANNER NIVEAU */}
        {user && hasInvested && !user.benefitsBlocked && user.level < 20 && (() => {
          const nextLevel = Math.min((user.level || 1) + 1, 20);
          const currentBonus = user.level === 1 ? 0 : user.level === 2 ? 5 : 10;
          const nextBonus = nextLevel === 2 ? 5 : 10;
          const activeInv = investments.find(i => i.baseRate);
          const baseRate = activeInv?.baseRate || 10;
          const nextRate = baseRate + nextBonus;
          const progress = user.currentLevelTarget > 0 ? Math.min((user.currentLevelCagnotte / user.currentLevelTarget) * 100, 100) : 0;

          return (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="text-yellow-600" size={14} />
                </div>
                <div className="text-gray-700 text-xs">
                  <span className="font-bold text-gray-900">Niveau {nextLevel}</span> : gagnez <span className="font-bold text-green-600">{nextRate}%/sem</span> + <span className="font-bold text-blue-600">10% sur vos affiliés</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-16 bg-yellow-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-yellow-600 text-[10px] font-medium">{Math.round(progress)}%</span>
                </div>
                <Link href="/user/reseau"
                  className="bg-yellow-400 text-gray-900 font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors whitespace-nowrap">
                  Inviter
                </Link>
              </div>
            </div>
          );
        })()}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLONNE PRINCIPALE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* HERO SOLDE TOTAL */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 lg:p-8 border border-gray-800 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-gray-400 text-sm">Solde Total</span>
                  <div className="text-gray-500 text-[10px] mt-0.5">Tout votre argent sur CashProfit</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs">Mis à jour en temps réel</span>
                  </div>
                </div>
                <button onClick={() => setShowBalance(!showBalance)} className="text-gray-500 hover:text-white transition-colors p-2">
                  {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              <div className="mb-8">
                {showBalance && user ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-2">
                      <h1 className="text-white text-4xl lg:text-6xl font-bold">
                        {Math.floor(totalBalance).toLocaleString('fr-FR')}
                      </h1>
                      <span className="text-gray-500 text-2xl lg:text-4xl">FCFA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-green-400 text-sm">
                        <TrendingUp size={14} />
                        <span>Niveau {user.level || 1}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-20 flex items-center">
                    <span className="text-white text-4xl">••••••</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowInvestModal(true)}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md">
                  <Rocket size={20} /> Investir
                </button>
                <Link href="/user/portefeuille"
                  className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95">
                  <ArrowUpRight size={20} /> Retirer
                </Link>
              </div>
            </div>

            {/* BREAKDOWN SOLDES avec explications */}
            {showBalance && user && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="text-gray-600 text-xs font-medium">Bénéfices à retirer</div>
                  </div>
                  <div className="text-green-600 text-lg font-bold">
                    {totalBenefices.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-gray-400 text-[10px] mt-1">Ce que vous pouvez retirer maintenant</div>
                  {totalLiveEarnings > totalBenefices && (
                    <div className="text-gray-400 text-[10px] mt-1 pt-1 border-t border-gray-100">
                      Total gagné depuis le début : {totalLiveEarnings.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                    </div>
                  )}
                  {hasReferrer && (
                    <div className="text-orange-500 text-[10px] mt-1">90% net (10% pour votre parrain)</div>
                  )}
                </div>
                <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
                  <div className="text-gray-600 text-xs mb-2 font-medium">Commissions</div>
                  <div className="text-green-600 text-lg font-bold">
                    {(user.totalCommissions || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-gray-400 text-[10px] mt-1">L&apos;argent gagné grâce à vos affiliés</div>
                </div>
                <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
                  <div className="text-gray-600 text-xs mb-2 font-medium">Bonus</div>
                  <div className="text-yellow-600 text-lg font-bold">{(user.bonusParrainage || 0).toLocaleString()}</div>
                  <div className="text-gray-400 text-[10px] mt-1">10,000 F reçus par affilié qui investit</div>
                </div>
              </div>
            )}

            {/* INVESTISSEMENTS ACTIFS */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-900 text-lg font-bold">Vos investissements</h2>
                <span className="text-gray-600 text-sm">{investments?.length || 0}</span>
              </div>
              <p className="text-gray-400 text-xs mb-5">Chaque investissement génère des gains automatiquement chaque seconde</p>

              {investments && investments.length > 0 ? (
                <div className="space-y-3">
                  {investments.slice(0, 5).map((inv) => (
                    <div key={inv.id} className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-gray-900 text-sm font-semibold mb-1">{inv.opportunity?.name || 'Investissement'}</div>
                          <div className="text-gray-600 text-xs">
                            {inv.amount?.toLocaleString()} FCFA • {inv.rate}%/sem
                            {hasReferrer && <span className="text-orange-500 ml-1">(net: {(inv.rate * 0.9).toFixed(1)}%)</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 text-sm font-bold">
                            +{(inv.currentEarnings || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-gray-500 text-xs">gagné jusqu&apos;ici</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {hasReferrer && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <div className="text-orange-600 text-xs">
                        10% de vos bénéfices sont reversés à la personne qui vous a invité. Vous touchez 90% net.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-900 font-semibold mb-1">Pas encore d&apos;investissement</p>
                  <p className="text-gray-500 text-sm mb-4">Investissez à partir de 10,000 FCFA et vos gains commencent immédiatement</p>
                  <button onClick={() => setShowInvestModal(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md">
                    Faire mon premier investissement
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
              <h3 className="text-gray-900 text-lg font-bold mb-1">Résumé de votre compte</h3>
              <p className="text-gray-400 text-xs mb-5">Vue d&apos;ensemble de votre activité</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-600 text-sm">Votre niveau</span>
                    <div className="text-gray-400 text-[10px]">Plus il est haut, plus vous gagnez</div>
                  </div>
                  <span className="text-yellow-600 font-bold">{user?.level || 1}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-600 text-sm">Investissements actifs</span>
                    <div className="text-gray-400 text-[10px]">Nombre de placements en cours</div>
                  </div>
                  <span className="text-gray-900 font-bold">{user?.activeInvestments || 0}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-600 text-sm">Capital investi</span>
                    <div className="text-gray-400 text-[10px]">L&apos;argent que vous avez placé</div>
                  </div>
                  <span className="text-gray-900 font-bold">{(user?.totalInvested || 0).toLocaleString()} F</span>
                </div>

                {/* Gains live */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 -mx-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-gray-700 text-xs font-medium">Gains en direct</span>
                      <div className="text-gray-400 text-[10px]">Vos investissements génèrent de l&apos;argent en ce moment</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 text-[10px] font-medium">LIVE</span>
                    </div>
                  </div>
                  <div className="text-green-600 text-2xl font-bold font-mono">
                    +{totalLiveEarnings.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                  </div>
                  <div className="text-gray-400 text-[10px] mt-1">Total gagné depuis votre premier investissement</div>
                  {totalLiveEarnings > totalBenefices && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <div className="text-gray-500 text-[10px]">Déjà retiré : {(totalLiveEarnings - totalBenefices).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F</div>
                      <div className="text-green-700 text-[10px] font-medium">Reste à retirer : {totalBenefices.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F</div>
                    </div>
                  )}
                  {hasReferrer && (
                    <div className="text-orange-500 text-[10px] mt-1">Net après commission de votre parrain</div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link href="/user/reseau" className="flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <div>
                    <span className="block">Mon réseau d&apos;affiliés</span>
                    <span className="text-gray-400 text-[10px]">Invitez vos proches et gagnez des commissions</span>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>

            {/* WIDGET DÉFI NIVEAU */}
            {user && hasInvested && (
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="text-white" size={24} />
                  <div>
                    <h3 className="text-white text-lg font-bold">Défi Niveau {user.level}</h3>
                    <p className="text-white/70 text-xs">Montez de niveau pour gagner plus</p>
                  </div>
                </div>

                {user.benefitsBlocked ? (
                  <>
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                      <div className="flex items-center gap-2 text-white font-bold mb-2">
                        <AlertCircle size={18} />
                        <span>Gains bloqués</span>
                      </div>
                      <p className="text-white/90 text-sm mb-3">
                        Vous n&apos;avez pas atteint votre objectif dans les délais. Invitez des personnes à investir pour débloquer vos gains.
                      </p>
                      <div className="text-white/70 text-xs">Vos commissions restent accessibles</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                      <div className="text-white/80 text-sm mb-2">Objectif à atteindre</div>
                      <div className="text-white text-xl font-bold mb-2">
                        {(user.currentLevelCagnotte || 0).toLocaleString()} / {(user.currentLevelTarget || 0).toLocaleString()} F
                      </div>
                      <div className="text-white/70 text-xs">
                        Il manque : {((user.currentLevelTarget || 0) - (user.currentLevelCagnotte || 0)).toLocaleString()} F
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                      <div className="text-white/80 text-sm mb-1">Cagnotte de vos affiliés</div>
                      <div className="text-white/60 text-[10px] mb-2">Total investi par les personnes que vous avez invitées</div>
                      <div className="text-white text-2xl font-bold mb-3">
                        {(user.currentLevelCagnotte || 0).toLocaleString()} / {(user.currentLevelTarget || 0).toLocaleString()} F
                      </div>
                      <div className="w-full bg-white/30 h-3 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all duration-500" style={{ width: `${challengeProgress}%` }} />
                      </div>
                      <div className="text-white/70 text-xs mt-2">{Math.round(challengeProgress)}% complété</div>
                    </div>

                    {timeRemaining && !timeRemaining.expired && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                          <Clock size={14} />
                          <span>Temps restant</span>
                        </div>
                        <div className="text-white/60 text-[10px] mb-1">Pour atteindre l&apos;objectif et passer au niveau suivant</div>
                        <div className="text-white text-lg font-bold">{timeRemaining.days} jours {timeRemaining.hours}h</div>
                      </div>
                    )}

                    {timeRemaining && timeRemaining.expired && (
                      <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                        <div className="text-white text-sm flex items-center gap-2">
                          <Clock size={14} />
                          <span>Délai dépassé</span>
                        </div>
                        <div className="text-white/80 text-xs mt-2">Atteignez votre objectif pour continuer à gagner vos bénéfices</div>
                      </div>
                    )}

                    {(() => {
                      const nextLevel = Math.min((user.level || 1) + 1, 20);
                      const currentBonus = user.level === 1 ? 0 : user.level === 2 ? 5 : 10;
                      const nextBonus = nextLevel === 2 ? 5 : 10;
                      const bonusDiff = nextBonus - currentBonus;
                      const hasCommissions = nextLevel >= 2;
                      const activeInv = investments.find(i => i.baseRate);
                      const baseRate = activeInv?.baseRate || 10;
                      const currentRate = baseRate + currentBonus;
                      const nextRate = baseRate + nextBonus;

                      return (
                        <div className="bg-white rounded-2xl p-4 mb-4 shadow-md">
                          <div className="text-xs font-bold text-gray-900 mb-3">
                            Ce que vous débloquez au niveau {nextLevel} :
                          </div>
                          <div className="space-y-2.5">
                            {bonusDiff > 0 && (
                              <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl p-2.5">
                                <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <TrendingUp className="text-white" size={14} />
                                </div>
                                <div>
                                  <div className="text-green-700 text-xs font-bold">+{bonusDiff}% sur vos gains personnels</div>
                                  <div className="text-green-600 text-[10px]">Votre taux passe de {currentRate}% à {nextRate}% par semaine</div>
                                </div>
                              </div>
                            )}

                            {hasCommissions && (
                              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                                <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Users className="text-white" size={14} />
                                </div>
                                <div>
                                  <div className="text-blue-700 text-xs font-bold">10% sur les gains de vos affiliés</div>
                                  <div className="text-blue-600 text-[10px]">Quand ils gagnent, vous gagnez automatiquement</div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start gap-2.5 bg-yellow-50 border border-yellow-200 rounded-xl p-2.5">
                              <div className="w-7 h-7 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">F</span>
                              </div>
                              <div>
                                <div className="text-yellow-700 text-xs font-bold">10,000 F de bonus par affilié</div>
                                <div className="text-yellow-600 text-[10px]">Pour chaque personne que vous invitez et qui investit</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
                              <Clock size={10} />
                              <span>Objectif : {(user.currentLevelTarget || 0).toLocaleString()} F d&apos;investissements de vos affiliés en {user.level === 1 ? '3 semaines' : '2 semaines'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                <Link href="/user/reseau"
                  className="w-full bg-white text-yellow-600 py-3 rounded-xl font-semibold text-center block hover:bg-gray-50 transition-colors shadow-md">
                  {user.benefitsBlocked ? 'Inviter pour débloquer' : 'Inviter mes proches'}
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL INVESTIR */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 text-2xl font-bold">Investir</h2>
                <p className="text-gray-500 text-xs mt-0.5">Choisissez une opportunité et le montant à investir</p>
              </div>
              <button onClick={() => { setShowInvestModal(false); setSelectedOpp(null); setInvestAmount(''); }}
                className="text-gray-500 hover:text-gray-900 p-2">
                <X size={24} />
              </button>
            </div>

            {!selectedOpp ? (
              <div className="p-6 space-y-3">
                {opportunities.map((opp) => (
                  <button key={opp.id} onClick={() => { setSelectedOpp(opp); setInvestAmount(''); }}
                    className="w-full bg-white/70 backdrop-blur-xl hover:bg-white border border-gray-200 hover:border-yellow-400 rounded-2xl p-4 text-left transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-gray-900 font-bold text-lg">{opp.name}</h3>
                        <p className="text-gray-600 text-sm">{opp.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 text-2xl font-bold">{opp.finalRate}%</div>
                        <div className="text-gray-500 text-xs">de gains par semaine</div>
                        {opp.bonus > 0 && <div className="text-yellow-600 text-xs font-medium mt-1">+{opp.bonus}% bonus niveau</div>}
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                      <div className="text-green-700 text-xs leading-relaxed">{opp.guaranteeMessage}</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{opp.activeInvestors || 0} personnes investissent</span>
                      <span>À partir de {opp.minInvestment?.toLocaleString()} FCFA</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6">
                <button onClick={() => { setSelectedOpp(null); setInvestAmount(''); }}
                  className="text-gray-600 hover:text-gray-900 text-sm mb-6 flex items-center gap-2">
                  ← Retour
                </button>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-gray-200">
                  <h3 className="text-gray-900 font-bold text-xl mb-2">{selectedOpp.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{selectedOpp.description}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                      <span className="text-green-600 font-bold text-lg">{selectedOpp.finalRate}%</span>
                      <span className="text-gray-600 text-xs ml-1">de gains / semaine</span>
                    </div>
                    {selectedOpp.bonus > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
                        <span className="text-yellow-600 font-bold text-sm">+{selectedOpp.bonus}% bonus niveau</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="text-green-700 text-xs leading-relaxed">{selectedOpp.guaranteeMessage}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-gray-900 font-semibold mb-1 block">Combien voulez-vous investir ?</label>
                  <p className="text-gray-400 text-xs mb-3">Entrez le montant en FCFA</p>
                  <input type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="Ex: 50000" min={selectedOpp.minInvestment || 1000} step="1000"
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-4 text-xl font-bold focus:border-yellow-400 focus:outline-none placeholder:text-gray-400 placeholder:text-base placeholder:font-normal" />
                  <p className="text-gray-500 text-xs mt-2">
                    Minimum : {(selectedOpp.minInvestment || 1000).toLocaleString()} FCFA • Maximum : {(selectedOpp.maxInvestment || 10000000).toLocaleString()} FCFA
                  </p>
                </div>

                {Number(investAmount) > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-yellow-600 mb-2">
                      <Info size={16} />
                      <span className="text-sm font-medium">Ce que vous allez gagner chaque semaine</span>
                    </div>
                    <div className="text-gray-900 text-2xl font-bold">+{calculateProjection().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</div>
                    <div className="text-gray-600 text-sm">
                      {hasReferrer ? 'Net après 10% pour votre parrain' : 'Bénéfice net que vous pouvez retirer ou réinvestir'}
                    </div>
                    {hasReferrer && (
                      <div className="text-orange-500 text-xs mt-1">
                        Total brut : {(Number(investAmount) * (selectedOpp.finalRate / 100)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA • {(Number(investAmount) * (selectedOpp.finalRate / 100) * 0.10).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA pour votre parrain
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6">
                  <div className="text-gray-700 text-xs">
                    <strong>Comment ça marche :</strong> votre argent reste investi et génère des gains chaque seconde. Vous pouvez retirer vos bénéfices quand vous voulez. Votre capital reste en place pour continuer à travailler.
                  </div>
                </div>

                <button onClick={handlePay}
                  disabled={isInvesting || !investAmount || Number(investAmount) < (selectedOpp.minInvestment || 1000)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
                  {isInvesting ? 'Redirection vers le paiement...' : investAmount ? `Payer ${Number(investAmount).toLocaleString()} FCFA` : 'Entrez un montant'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}