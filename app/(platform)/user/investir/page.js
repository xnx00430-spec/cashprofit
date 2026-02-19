// app/(platform)/user/investir/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, X, Users, CheckCircle
} from 'lucide-react';

export default function InvestirPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [user, setUser] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [hasReferrer, setHasReferrer] = useState(false);
  
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [investAmount, setInvestAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [oppRes, userRes, invRes] = await Promise.all([
        fetch('/api/opportunities'),
        fetch('/api/user/profile'),
        fetch('/api/user/investments')
      ]);
      const [oppData, userData, invData] = await Promise.all([
        oppRes.json(), userRes.json(), invRes.json()
      ]);
      if (oppData.success) setOpportunities(oppData.opportunities);
      if (userData.success) {
        setUser(userData.user);
        setHasReferrer(userData.user.hasReferrer || false);
      }
      if (invData.success) {
        setInvestments(invData.investments);
        if (invData.hasReferrer !== undefined) setHasReferrer(invData.hasReferrer);
      }
    } catch (error) {
      console.error('Erreur fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInvestModal = (opp) => {
    setSelectedOpp(opp);
    setInvestAmount('');
    setShowInvestModal(true);
  };

  const handlePay = async () => {
    const amount = Number(investAmount);
    const min = selectedOpp.minInvestment || 1000;
    const max = selectedOpp.maxInvestment || 10000000;
    if (!amount || amount < min) {
      alert(`Le montant minimum est de ${min.toLocaleString()} FCFA`);
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
        alert(data.message || 'Erreur lors du paiement');
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

  const getTotalEarnings = () => {
    return investments.reduce((sum, inv) => sum + (inv.currentEarnings || 0), 0);
  };

  if (!mounted) return null;

  const totalEarnings = getTotalEarnings();
  // Fix: balance contient déjà les gains sync - retraits
  // On ajoute seulement unsyncedEarnings pour avoir le total réel
  const unsyncedEarnings = investments.reduce((sum, inv) => sum + (inv.unsyncedEarnings || 0), 0);
  const totalBenefices = (user?.balance || 0) + unsyncedEarnings;
  const totalBalance = (user?.totalInvested || 0) + totalBenefices + (user?.totalCommissions || 0) + (user?.bonusParrainage || 0);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-gray-900 text-3xl font-bold mb-1">Investir</h1>
          <p className="text-gray-500 text-sm">Choisissez une opportunité et investissez. Vos gains commencent immédiatement.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 text-[10px] font-medium">EN DIRECT</span>
            </div>
            <div className="text-gray-600 text-xs mb-1">Vos gains en cours</div>
            <div className="text-gray-400 text-[10px] mb-2">Ce que vos investissements vous ont rapporté</div>
            <div className="text-green-600 text-4xl font-bold mb-2 font-mono tracking-tight">
              +{totalEarnings.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp size={12} />
                <span>Augmente chaque seconde</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{investments.length} investissement{investments.length > 1 ? 's' : ''} actif{investments.length > 1 ? 's' : ''}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-green-100 to-transparent rounded-full blur-2xl" />
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
            <div className="text-gray-600 text-xs mb-1">Solde total</div>
            <div className="text-gray-400 text-[10px] mb-1">Tout votre argent</div>
            <div className="text-gray-900 text-2xl font-bold">
              {Math.floor(totalBalance).toLocaleString('fr-FR')} F
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
            <div className="text-gray-600 text-xs mb-1">Capital investi</div>
            <div className="text-gray-400 text-[10px] mb-1">L&apos;argent que vous avez placé</div>
            <div className="text-gray-900 text-2xl font-bold">{(user?.totalInvested || 0).toLocaleString()} F</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-4 shadow-lg">
            <div className="text-white/70 text-xs mb-1">Votre niveau</div>
            <div className="text-white text-2xl font-bold">Niveau {user?.level || 1}</div>
            <div className="text-white/80 text-[10px] mt-1">
              {user?.level === 1 ? 'Taux de base' : user?.level === 2 ? '+5% de bonus' : '+10% de bonus'} sur vos gains
            </div>
          </div>
        </div>

        {/* Opportunités */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement des opportunités...</div>
        ) : opportunities.length > 0 ? (
          <>
            <div className="mb-4">
              <h2 className="text-gray-900 text-lg font-bold">Opportunités disponibles</h2>
              <p className="text-gray-400 text-xs">Cliquez sur une opportunité pour investir. Vous pouvez investir sur plusieurs en même temps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {opportunities.map((opp, index) => {
                const exampleGain = Math.round(100000 * opp.finalRate / 100);
                return (
                  <div key={opp.id} onClick={() => openInvestModal(opp)}
                    className="relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    {index === 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-yellow-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Populaire</div>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-gray-900 text-xl font-bold mb-2">{opp.name}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{opp.description}</p>
                    </div>

                    {/* Taux */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                      <div className="flex items-baseline justify-between mb-1">
                        <div>
                          <div className="text-green-600 text-3xl font-bold">{opp.finalRate}%</div>
                          <div className="text-gray-500 text-xs">de gains par semaine</div>
                        </div>
                        {opp.bonus > 0 && (
                          <div className="text-yellow-600 text-xs font-bold bg-yellow-50 px-2 py-1 rounded">+{opp.bonus}% bonus</div>
                        )}
                      </div>
                      <div className="text-green-600/60 text-[10px] mt-2">
                        Exemple : 100,000 F investis = {exampleGain.toLocaleString()} F de gains par semaine
                      </div>
                    </div>

                    {/* Garantie */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                      <div className="text-blue-700 text-[10px] leading-relaxed">{opp.guaranteeMessage}</div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{opp.activeInvestors || 0} personnes investissent</span>
                      </div>
                      <div>À partir de {opp.minInvestment?.toLocaleString()} F</div>
                    </div>

                    <button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl text-sm font-bold transition-colors">
                      Investir maintenant
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bloc explicatif */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h3 className="text-gray-900 text-sm font-bold mb-3">Comment ça marche ?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                <div>
                  <div className="text-gray-900 font-semibold mb-1">1. Choisissez un montant</div>
                  <div>À partir de 10,000 FCFA. Vous payez avec votre Mobile Money (Orange, MTN, Wave, Moov). Aucun frais.</div>
                </div>
                <div>
                  <div className="text-gray-900 font-semibold mb-1">2. Vos gains commencent tout de suite</div>
                  <div>Dès que le paiement est confirmé, votre investissement est activé. Vos bénéfices s&apos;affichent en temps réel.</div>
                </div>
                <div>
                  <div className="text-gray-900 font-semibold mb-1">3. Retirez quand vous voulez</div>
                  <div>Vos bénéfices sont retirables à tout moment dès 1,000 FCFA. L&apos;argent arrive sur votre compte en moins de 24h.</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-900 font-semibold mb-1">Aucune opportunité disponible</div>
            <div className="text-gray-400 text-sm">Revenez bientôt, de nouvelles opportunités arrivent régulièrement</div>
          </div>
        )}

        {/* ==================== MODAL INVESTIR ==================== */}
        {showInvestModal && selectedOpp && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-gray-900 text-2xl font-bold mb-1">{selectedOpp.name}</h2>
                  <p className="text-gray-500 text-sm">{selectedOpp.description}</p>
                </div>
                <button onClick={() => setShowInvestModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={22} />
                </button>
              </div>

              {/* Taux */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-5">
                <div className="text-gray-600 text-sm mb-2">Ce que vous gagnez chaque semaine</div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-green-600 text-5xl font-bold">{selectedOpp.finalRate}%</span>
                  <span className="text-gray-500 text-lg">de votre investissement</span>
                </div>
                {selectedOpp.bonus > 0 && (
                  <div className="text-yellow-600 text-sm">Dont +{selectedOpp.bonus}% grâce à votre niveau {user?.level || 1}</div>
                )}
                <div className="text-green-600/60 text-xs mt-2">
                  Exemple : 100,000 F investis = {Math.round(100000 * selectedOpp.finalRate / 100).toLocaleString()} F de gains par semaine
                </div>
              </div>

              {/* Garantie */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-blue-700 text-sm leading-relaxed">{selectedOpp.guaranteeMessage}</div>
                </div>
              </div>

              {/* Formulaire */}
              <div className="border border-gray-200 rounded-2xl p-6">
                <h3 className="text-gray-900 font-bold mb-1">Combien voulez-vous investir ?</h3>
                <p className="text-gray-400 text-xs mb-4">Entrez le montant en FCFA. Plus vous investissez, plus vous gagnez.</p>
                
                <div className="mb-4">
                  <input type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="Ex: 50000" min={selectedOpp.minInvestment || 1000} step="1000"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-2xl font-bold rounded-xl px-4 py-4 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none placeholder:text-gray-400 placeholder:text-base placeholder:font-normal" />
                  <div className="text-gray-400 text-xs mt-2">
                    Minimum : {(selectedOpp.minInvestment || 1000).toLocaleString()} F • Maximum : {(selectedOpp.maxInvestment || 10000000).toLocaleString()} F
                  </div>
                </div>

                {/* Projection */}
                {Number(investAmount) > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <div className="text-gray-700 text-xs mb-1">Ce que vous allez gagner chaque semaine</div>
                    <div className="text-gray-900 text-3xl font-bold">+{calculateProjection().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {hasReferrer ? 'Net après 10% pour la personne qui vous a invité' : 'Bénéfice net que vous pouvez retirer ou réinvestir'}
                    </div>
                    {hasReferrer && (
                      <div className="text-orange-500 text-[10px] mt-2">
                        Total brut : {(Number(investAmount) * (selectedOpp.finalRate / 100)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F — {(Number(investAmount) * (selectedOpp.finalRate / 100) * 0.10).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F vont à votre parrain
                      </div>
                    )}

                    {/* Projection 1 mois */}
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <div className="text-gray-500 text-[10px] mb-1">Si vous laissez votre investissement pendant 1 mois :</div>
                      <div className="text-gray-900 text-sm font-bold">
                        Environ +{(calculateProjection() * 4).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA de gains
                      </div>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                  <div className="text-gray-600 text-xs leading-relaxed">
                    <strong>Comment ça marche :</strong> votre argent reste investi et génère des gains automatiquement, chaque seconde. Vous pouvez retirer vos bénéfices quand vous voulez à partir de 1,000 FCFA. Votre capital reste en place et continue à travailler pour vous.
                  </div>
                </div>

                {/* Paiement info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
                  <div className="text-gray-600 text-xs leading-relaxed">
                    <strong>Paiement :</strong> vous serez redirigé vers la page de paiement Mobile Money. Le montant sera débité de votre compte et votre investissement sera activé immédiatement après confirmation.
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3">
                  <button onClick={() => setShowInvestModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">
                    Annuler
                  </button>
                  <button onClick={handlePay}
                    disabled={isInvesting || !investAmount || Number(investAmount) < (selectedOpp.minInvestment || 1000)}
                    className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm">
                    {isInvesting ? 'Redirection vers le paiement...' : investAmount ? `Payer ${Number(investAmount).toLocaleString()} FCFA` : 'Entrez un montant'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}