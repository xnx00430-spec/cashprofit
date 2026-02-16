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
      if (userData.success) setUser(userData.user);
      if (invData.success) setInvestments(invData.investments);
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
    return Number(investAmount) * (selectedOpp.finalRate / 100);
  };

  const getTotalEarnings = () => {
    return investments.reduce((sum, inv) => sum + (inv.currentEarnings || 0), 0);
  };

  if (!mounted) return null;

  const totalEarnings = getTotalEarnings();
  const totalBalance = (user?.totalInvested || 0) + totalEarnings + (user?.balance || 0) + (user?.totalCommissions || 0) + (user?.bonusParrainage || 0);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
          <h1 className="text-gray-900 text-3xl font-bold mb-2">Investir</h1>
          <p className="text-gray-600 text-sm">Investissez sur plusieurs opportunités en même temps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 text-[10px] font-medium">LIVE</span>
            </div>
            <div className="text-gray-600 text-xs mb-2">Bénéfices en cours</div>
            <div className="text-green-600 text-4xl font-bold mb-2 font-mono tracking-tight">
              +{totalEarnings.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp size={12} />
                <span>En croissance</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{investments.length} investissement{investments.length > 1 ? 's' : ''}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-green-100 to-transparent rounded-full blur-2xl" />
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
            <div className="text-gray-600 text-xs mb-1">Solde total</div>
            <div className="text-gray-900 text-2xl font-bold">
              {Math.floor(totalBalance).toLocaleString('fr-FR')} F
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-md">
            <div className="text-gray-600 text-xs mb-1">Total investi</div>
            <div className="text-gray-900 text-2xl font-bold">{(user?.totalInvested || 0).toLocaleString()} F</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-4 shadow-lg">
            <div className="text-white/70 text-xs mb-1">Niveau actuel</div>
            <div className="text-white text-2xl font-bold">Niveau {user?.level || 1}</div>
            <div className="text-white/80 text-[10px] mt-1">
              +{user?.level === 1 ? 0 : user?.level === 2 ? 5 : 10}% bonus taux
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Chargement des opportunités...</div>
        ) : opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {opportunities.map((opp, index) => (
              <div key={opp.id} onClick={() => openInvestModal(opp)}
                className="relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 cursor-pointer">
                {index === 0 && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full">⭐ TOP</div>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-gray-900 text-xl font-bold mb-2">{opp.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{opp.description}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <div>
                      <div className="text-green-600 text-3xl font-bold">{opp.finalRate}%</div>
                      <div className="text-gray-600 text-xs">de Bénéfices par semaine</div>
                    </div>
                    {opp.bonus > 0 && (
                      <div className="text-yellow-600 text-xs font-bold bg-yellow-50 px-2 py-1 rounded">+{opp.bonus}% bonus</div>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                  <div className="text-blue-700 text-[10px] leading-relaxed">{opp.guaranteeMessage}</div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{opp.activeInvestors || 0} investisseurs</span>
                  </div>
                  <div>Min: {opp.minInvestment?.toLocaleString()} F</div>
                </div>
                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-xl text-sm font-bold transition-colors">
                  Investir maintenant
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-600 text-sm mb-2">Aucune opportunité disponible</div>
          </div>
        )}

        {showInvestModal && selectedOpp && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-gray-900 text-2xl font-bold mb-2">{selectedOpp.name}</h2>
                  <p className="text-gray-600 text-sm">{selectedOpp.description}</p>
                </div>
                <button onClick={() => setShowInvestModal(false)} className="text-gray-500 hover:text-gray-900 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <div className="text-gray-700 text-sm mb-2">Votre taux (Niveau {user?.level || 1})</div>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-green-600 text-5xl font-bold">{selectedOpp.finalRate}%</span>
                  <span className="text-gray-600 text-lg">de Bénéfices par semaine</span>
                </div>
                {selectedOpp.bonus > 0 && (
                  <div className="text-yellow-600 text-sm font-medium">✨ Inclus +{selectedOpp.bonus}% bonus niveau</div>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-blue-700 text-sm leading-relaxed">{selectedOpp.guaranteeMessage}</div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-md">
                <h3 className="text-gray-900 font-bold mb-4">Montant de l&apos;investissement</h3>
                <div className="mb-4">
                  <label className="text-gray-600 text-sm mb-2 block">Montant (FCFA)</label>
                  <input type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="Entrez le montant à investir" min={selectedOpp.minInvestment || 1000} step="1000"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-2xl font-bold rounded-xl px-4 py-4 focus:border-yellow-400 focus:outline-none placeholder:text-gray-400 placeholder:text-base placeholder:font-normal" />
                  <div className="text-gray-600 text-xs mt-2">
                    Min: {(selectedOpp.minInvestment || 1000).toLocaleString()} F • Max: {(selectedOpp.maxInvestment || 10000000).toLocaleString()} F
                  </div>
                </div>
                {Number(investAmount) > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <div className="text-gray-700 text-xs mb-2">Bénéfices estimés par semaine</div>
                    <div className="text-yellow-600 text-3xl font-bold">+{calculateProjection().toLocaleString()} FCFA</div>
                    <div className="text-gray-600 text-xs mt-1">Bénéfice net à retirer ou réinvestir chaque semaine</div>
                  </div>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                  <div className="text-gray-700 text-xs">
                    💡 <strong>Votre capital travaille pour vous</strong> : il reste investi et génère vos bénéfices. Seuls les bénéfices sont retirables.
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowInvestModal(false)}
                    className="flex-1 bg-gray-200 text-gray-900 py-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors">Annuler</button>
                  <button onClick={handlePay}
                    disabled={isInvesting || !investAmount || Number(investAmount) < (selectedOpp.minInvestment || 1000)}
                    className="flex-1 bg-yellow-400 text-white py-4 rounded-xl font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                    {isInvesting ? 'Redirection vers le paiement...' : investAmount ? `Payer ${Number(investAmount).toLocaleString()} F` : 'Entrez un montant'}
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