// app/(platform)/user/reseau/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Copy, Share2, UserPlus, TrendingUp,
  CheckCircle, Clock, DollarSign, Gift,
  ArrowUpRight, ExternalLink, Eye, X, Info, Target
} from 'lucide-react';

export default function ReseauPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [subNetwork, setSubNetwork] = useState([]);
  const [loadingSubNetwork, setLoadingSubNetwork] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchReferralData();
    // Rafraîchissement live toutes les 5 secondes
    const interval = setInterval(fetchReferralData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchReferralData = async () => {
    try {
      const [userRes, refRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/referrals')
      ]);
      const [userData, refData] = await Promise.all([userRes.json(), refRes.json()]);
      
      if (userData.success) {
        setUser(userData.user);
        const code = userData.user.referralCode || userData.user.sponsorCode;
        setReferralCode(code);
        if (typeof window !== 'undefined') {
          setReferralLink(`${window.location.origin}/auth/register?ref=${code}`);
        }
      }

      if (refData.success) {
        setReferrals(refData.referrals || []);
        setStats(refData.stats || null);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoignez-moi sur la plateforme',
          text: 'Investissez et gagnez ensemble !',
          url: referralLink
        });
      } catch (error) {
        console.error('Erreur partage:', error);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  const viewSubNetwork = async (referral) => {
    setSelectedReferral(referral);
    setShowNetworkModal(true);
    setLoadingSubNetwork(true);

    try {
      const res = await fetch(`/api/user/referrals/sub-network/${referral._id}`);
      const data = await res.json();
      if (data.success) {
        setSubNetwork(data.subReferrals || []);
      }
    } catch (error) {
      console.error('Erreur sous-réseau:', error);
    } finally {
      setLoadingSubNetwork(false);
    }
  };

  const getReferralStatus = (ref) => {
    if ((ref.totalInvested || 0) > 0) {
      return { icon: CheckCircle, text: 'Actif', color: 'text-green-600' };
    }
    return { icon: Clock, text: 'En attente', color: 'text-yellow-600' };
  };

  const getCagnotteProgress = () => {
    if (!user) return 0;
    if (user.currentLevelTarget === 0) return 0;
    return Math.min((user.currentLevelCagnotte / user.currentLevelTarget) * 100, 100);
  };

  if (!mounted) return null;

  const cagnotteProgress = getCagnotteProgress();

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-gray-900 text-3xl font-bold mb-2">Mon Réseau</h1>
          <p className="text-gray-600 text-sm">
            Invitez vos amis et touchez 10% de leurs bénéfices en plus de vos propres revenus
          </p>
        </div>

        {/* WIDGET CAGNOTTE NIVEAU */}
        {user && user.totalInvested > 0 && (
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-6 mb-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-white" size={28} />
              <div>
                <h3 className="text-white text-xl font-bold">Cagnotte Affiliés - Niveau {user.level}</h3>
                <p className="text-white/80 text-sm">Progressez en parrainant des affiliés qui investissent</p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mb-4">
              <div className="text-white/80 text-sm mb-2">Cagnotte actuelle</div>
              <div className="text-white text-3xl font-bold mb-3">
                {(user.currentLevelCagnotte || 0).toLocaleString()} / {(user.currentLevelTarget || 0).toLocaleString()} F
              </div>
              <div className="w-full bg-white/30 h-4 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-500" 
                  style={{ width: `${cagnotteProgress}%` }} 
                />
              </div>
              <div className="text-white/70 text-xs mt-2">
                {Math.round(cagnotteProgress)}% complété
              </div>
            </div>

            <div className="bg-white/90 rounded-2xl p-4">
              <div className="text-xs text-gray-700 mb-2">Comment ça marche ?</div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs text-gray-900">
                  <span>🎯</span>
                  <span>Vos affiliés investissent {(user.currentLevelTarget || 0).toLocaleString()} F au total → Vous passez niveau {user.level + 1}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-900">
                  <span>⏱️</span>
                  <span>Vous avez {user.level === 1 ? '3 semaines' : '2 semaines'}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-900">
                  <span>🎁</span>
                  <span>Chaque affilié qui investit = +10,000 FCFA bonus direct</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATS CARDS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
              <div className="text-yellow-600 text-xs mb-1">Total Affiliés</div>
              <div className="text-gray-900 text-2xl font-bold">
                {stats.totalReferrals || 0}
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
              <div className="text-green-600 text-xs mb-1">Affiliés Actifs</div>
              <div className="text-gray-900 text-2xl font-bold">
                {stats.activeReferrals || 0}
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
              <div className="text-blue-600 text-xs mb-1">Commissions Live</div>
              <div className="text-gray-900 text-2xl font-bold flex items-center gap-2">
                {(stats.totalCommissions || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                {(stats.totalCommissions || 0) > 0 && (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
              <div className="text-purple-600 text-xs mb-1">Bonus Parrainage</div>
              <div className="text-gray-900 text-2xl font-bold">
                {(stats.bonusEarned || 0).toLocaleString()} F
              </div>
            </div>
          </div>
        )}

        {/* SECTION PARRAINAGE */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <UserPlus className="text-yellow-600" size={24} />
            </div>
            <div>
              <h2 className="text-gray-900 text-xl font-bold">Inviter des amis</h2>
              <p className="text-gray-600 text-sm">Partagez votre lien et gagnez des commissions</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-gray-600 text-xs mb-2 block">Votre code de parrainage</label>
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between shadow-sm">
              <div className="flex-1">
                <span className="text-gray-900 font-mono text-2xl font-bold tracking-wider">
                  {referralCode || 'Chargement...'}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(referralCode)}
                className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} className="text-green-600" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-gray-600 text-xs mb-2 block">Lien de parrainage</label>
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="flex-1 overflow-hidden">
                <span className="text-blue-600 text-sm block truncate">
                  {referralLink || 'Chargement...'}
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Copy size={16} />
                  <span className="hidden md:inline">Copier</span>
                </button>
                <button
                  onClick={shareLink}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md"
                >
                  <Share2 size={16} />
                  <span className="hidden md:inline">Partager</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="text-yellow-700 text-sm font-semibold mb-3">💰 Parrainez des affiliés et gagnez encore plus</div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>Gagnez <span className="font-bold text-yellow-700">10%</span> de commissions sur les bénéfices totaux de chaque affilié</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>Recevez <span className="font-bold text-yellow-700">10,000 FCFA</span> de bonus direct pour chaque affilié qui investit</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>Commissions <span className="font-bold text-green-600">toujours retirables</span>, sans condition</span>
              </div>
            </div>
          </div>
        </div>

        {/* LISTE AFFILIÉS */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 text-xl font-bold">Mes Affiliés ({referrals.length})</h2>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-600">Chargement...</div>
          ) : referrals.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {referrals.map((ref, index) => {
                const status = getReferralStatus(ref);
                const StatusIcon = status.icon;
                
                return (
                  <div key={ref._id || index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                          {(ref.firstName || ref.name || '?')[0]}
                        </div>
                        <div>
                          <div className="text-gray-900 font-semibold">
                            {ref.name || `${ref.firstName || ''} ${ref.lastName || ''}`}
                          </div>
                          <div className="text-gray-600 text-sm">{ref.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 ${status.color}`}>
                          <StatusIcon size={16} />
                          <span className="text-sm font-medium">{status.text}</span>
                        </div>
                        {(ref.totalInvested || 0) > 0 && (
                          <button
                            onClick={() => viewSubNetwork(ref)}
                            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-600 p-2 rounded-lg transition-all group"
                            title="Voir son réseau"
                          >
                            <Eye size={18} className="group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">Total investi</div>
                        <div className="text-gray-900 font-bold">
                          {(ref.totalInvested || 0).toLocaleString()} F
                        </div>
                      </div>

                      <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">Bénéfices de l'affilié</div>
                        <div className="text-green-600 font-bold flex items-center gap-1">
                          {(ref.totalEarnings || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                          {(ref.totalEarnings || 0) > 0 && (
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>

                      <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">Vos commissions</div>
                        <div className="text-yellow-600 font-bold flex items-center gap-1">
                          {(ref.yourCommission || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                          {(ref.yourCommission || 0) > 0 && (
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>

                      <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">Bonus reçu</div>
                        <div className="text-purple-600 font-bold">
                          {(ref.totalInvested || 0) > 0 ? '10,000' : '0'} F
                        </div>
                      </div>
                    </div>

                    {(ref.totalInvested || 0) > 0 && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <TrendingUp size={14} />
                          <span>Vous gagnez <span className="font-bold">10%</span> sur tous les bénéfices de cet affilié</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-gray-500 text-xs">
                      Inscrit le {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Date inconnue'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-400" size={32} />
              </div>
              <div className="text-gray-600 text-lg mb-2">Aucun affilié pour le moment</div>
              <div className="text-gray-500 text-sm mb-6">
                Partagez votre lien de parrainage pour commencer à gagner des commissions
              </div>
              <button
                onClick={shareLink}
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 transition-colors shadow-md"
              >
                <Share2 size={18} />
                Partager mon lien
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SOUS-RÉSEAU */}
      {showNetworkModal && selectedReferral && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {(selectedReferral.firstName || selectedReferral.name || '?')[0]}
                </div>
                <div>
                  <h2 className="text-gray-900 text-xl font-bold">
                    Réseau de {selectedReferral.name || `${selectedReferral.firstName || ''} ${selectedReferral.lastName || ''}`}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Voir les gains indirects que vous générez
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNetworkModal(false);
                  setSelectedReferral(null);
                  setSubNetwork([]);
                }}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingSubNetwork ? (
                <div className="text-center py-12 text-gray-600">Chargement du réseau...</div>
              ) : subNetwork.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                    <Info size={14} />
                    <span>Vous gagnez indirectement 10% des commissions que {selectedReferral.name || selectedReferral.firstName} touche</span>
                  </div>

                  {subNetwork.map((subRef, index) => {
                    const affiliéCommission = (subRef.totalEarnings || 0) * 0.10;
                    const yourIndirectGain = affiliéCommission * 0.10;

                    return (
                      <div key={subRef._id || index} className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {(subRef.firstName || subRef.name || '?')[0]}
                            </div>
                            <div>
                              <div className="text-gray-900 font-semibold text-sm">
                                {subRef.name || `${subRef.firstName || ''} ${subRef.lastName || ''}`}
                              </div>
                              <div className="text-gray-600 text-xs">
                                Affilié de {selectedReferral.name || selectedReferral.firstName}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="text-gray-600 text-xs mb-1">Investi</div>
                            <div className="text-gray-900 text-sm font-bold">
                              {(subRef.totalInvested || 0).toLocaleString()} F
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="text-gray-600 text-xs mb-1">Ses bénéfices</div>
                            <div className="text-green-600 text-sm font-bold">
                              {(subRef.totalEarnings || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} F
                            </div>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-blue-600 text-xs mb-1">→ {selectedReferral.name || selectedReferral.firstName}</div>
                            <div className="text-blue-600 text-sm font-bold">
                              {affiliéCommission.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} F
                            </div>
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="text-purple-600 text-xs mb-1">→ Vous</div>
                            <div className="text-purple-600 text-sm font-bold">
                              {yourIndirectGain.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} F
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="text-gray-400 mx-auto mb-3" size={48} />
                  <div className="text-gray-600 text-sm">
                    {selectedReferral.name || selectedReferral.firstName} n'a pas encore d'affiliés
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}