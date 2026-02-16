// app/(platform)/admin/credit/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { Search, CreditCard, TrendingUp, Users, Gift, Check, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminCreditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);

  // Formulaire crédit
  const [creditType, setCreditType] = useState('benefices');
  const [creditAmount, setCreditAmount] = useState('');

  // Formulaire niveau
  const [newLevel, setNewLevel] = useState('');

  // Formulaire investissement
  const [investAmount, setInvestAmount] = useState('');
  const [investStartDate, setInvestStartDate] = useState('');
  const [investRate, setInvestRate] = useState('');
  const [investOppId, setInvestOppId] = useState('');

  // Résultat
  const [result, setResult] = useState(null);

  // Tab active
  const [activeTab, setActiveTab] = useState('credit');

  useEffect(() => {
    fetch('/api/opportunities')
      .then(r => r.json())
      .then(data => {
        if (data.success) setOpportunities(data.opportunities);
      })
      .catch(console.error);
  }, []);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleCredit = async () => {
    if (!selectedUser || !creditAmount) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'credit',
          userId: selectedUser._id || selectedUser.id,
          amount: parseFloat(creditAmount),
          type: creditType
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setCreditAmount('');
        setSelectedUser(data.user);
      }
    } catch (error) {
      setResult({ success: false, message: 'Erreur réseau' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetLevel = async () => {
    if (!selectedUser || !newLevel) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setLevel',
          userId: selectedUser._id || selectedUser.id,
          level: parseInt(newLevel)
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setNewLevel('');
        setSelectedUser(data.user);
      }
    } catch (error) {
      setResult({ success: false, message: 'Erreur réseau' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvestment = async () => {
    if (!selectedUser || !investAmount) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createInvestment',
          userId: selectedUser._id || selectedUser.id,
          investmentData: {
            investAmount: parseFloat(investAmount),
            startDate: investStartDate || null,
            weeklyRate: investRate ? parseFloat(investRate) : null,
            opportunityId: investOppId || null
          }
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setInvestAmount('');
        setInvestStartDate('');
        setInvestRate('');
        setSelectedUser(data.user);
      }
    } catch (error) {
      setResult({ success: false, message: 'Erreur réseau' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion Manuelle</h1>
            <p className="text-gray-500 text-sm">Créditer, modifier niveau, créer investissement</p>
          </div>
        </div>

        {/* Recherche utilisateur */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-gray-900 font-bold mb-4">Rechercher un utilisateur</h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                placeholder="Nom, email ou téléphone..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900"
              />
            </div>
            <button
              onClick={searchUsers}
              disabled={searching}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {searching ? <Loader2 className="animate-spin" size={20} /> : 'Rechercher'}
            </button>
          </div>

          {/* Résultats recherche */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((u) => (
                <button
                  key={u._id || u.id}
                  onClick={() => { setSelectedUser(u); setSearchResults([]); setResult(null); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    (selectedUser?._id || selectedUser?.id) === (u._id || u.id)
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-900 font-semibold">{u.name}</div>
                      <div className="text-gray-500 text-sm">{u.email} • {u.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-600 font-bold text-sm">Niv. {u.level}</div>
                      <div className="text-gray-500 text-xs">{(u.totalInvested || 0).toLocaleString()} F investi</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User sélectionné */}
        {selectedUser && (
          <>
            {/* Infos user */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">{selectedUser.name}</h3>
                  <div className="text-gray-500 text-sm">{selectedUser.email} • {selectedUser.phone}</div>
                </div>
                <button
                  onClick={() => { setSelectedUser(null); setResult(null); }}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  Changer
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-yellow-600 font-bold">{selectedUser.level}</div>
                  <div className="text-gray-500 text-xs">Niveau</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-gray-900 font-bold text-sm">{(selectedUser.totalInvested || 0).toLocaleString()}</div>
                  <div className="text-gray-500 text-xs">Investi</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-green-600 font-bold text-sm">{(selectedUser.balance || 0).toLocaleString()}</div>
                  <div className="text-gray-500 text-xs">Bénéfices</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-green-600 font-bold text-sm">{(selectedUser.totalCommissions || 0).toLocaleString()}</div>
                  <div className="text-gray-500 text-xs">Commissions</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-yellow-600 font-bold text-sm">{(selectedUser.bonusParrainage || 0).toLocaleString()}</div>
                  <div className="text-gray-500 text-xs">Bonus</div>
                </div>
              </div>
            </div>

            {/* Résultat action */}
            {result && (
              <div className={`mb-6 p-4 rounded-xl border ${
                result.success
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  {result.success ? <Check size={20} /> : <AlertCircle size={20} />}
                  <span className="font-semibold">{result.message}</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'credit', label: 'Créditer', icon: CreditCard },
                { id: 'level', label: 'Niveau', icon: TrendingUp },
                { id: 'investment', label: 'Investissement', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setResult(null); }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ==================== TAB CRÉDITER ==================== */}
            {activeTab === 'credit' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-gray-900 font-bold text-lg mb-4">Créditer le compte</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">Type de crédit</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'benefices', label: 'Bénéfices', color: 'green' },
                        { id: 'commissions', label: 'Commissions', color: 'blue' },
                        { id: 'bonus', label: 'Bonus', color: 'yellow' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setCreditType(t.id)}
                          className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                            creditType === t.id
                              ? `border-${t.color}-400 bg-${t.color}-50 text-${t.color}-700`
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">Montant (FCFA)</label>
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900 text-xl font-bold"
                    />
                  </div>

                  {/* Presets rapides */}
                  <div className="flex gap-2 flex-wrap">
                    {[5000, 10000, 25000, 50000, 100000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCreditAmount(amount.toString())}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium"
                      >
                        {amount.toLocaleString()} F
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCredit}
                    disabled={loading || !creditAmount}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all"
                  >
                    {loading ? 'En cours...' : `Créditer ${creditAmount ? parseFloat(creditAmount).toLocaleString() : '0'} F en ${creditType}`}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB NIVEAU ==================== */}
            {activeTab === 'level' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-gray-900 font-bold text-lg mb-4">Modifier le niveau</h3>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <div className="text-yellow-700 text-sm">
                    Niveau actuel : <strong>{selectedUser.level}</strong>
                    <br />
                    ⚠️ Changer le niveau reset le défi en cours et débloque les bénéfices.
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">Nouveau niveau (1-20)</label>
                    <input
                      type="number"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      placeholder="1"
                      min="1"
                      max="20"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900 text-xl font-bold"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 5, 10, 15, 20].map((lv) => (
                      <button
                        key={lv}
                        onClick={() => setNewLevel(lv.toString())}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          newLevel === lv.toString()
                            ? 'bg-yellow-400 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        Niv. {lv}
                      </button>
                    ))}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="text-gray-600 text-xs">
                      Bonus taux : Niv 1 = +0% • Niv 2 = +5% • Niv 3+ = +10%
                    </div>
                  </div>

                  <button
                    onClick={handleSetLevel}
                    disabled={loading || !newLevel}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all"
                  >
                    {loading ? 'En cours...' : `Passer au niveau ${newLevel || '?'}`}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB INVESTISSEMENT ==================== */}
            {activeTab === 'investment' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-gray-900 font-bold text-lg mb-4">Créer un investissement</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">Opportunité</label>
                    <select
                      value={investOppId}
                      onChange={(e) => setInvestOppId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900"
                    >
                      <option value="">Auto (première active)</option>
                      {opportunities.map((opp) => (
                        <option key={opp.id || opp._id} value={opp.id || opp._id}>
                          {opp.name} - {opp.baseRate || opp.finalRate}%/sem
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">Montant (FCFA)</label>
                    <input
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder="100,000"
                      min="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900 text-xl font-bold"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {[50000, 100000, 250000, 500000, 1000000].map((a) => (
                      <button
                        key={a}
                        onClick={() => setInvestAmount(a.toString())}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium"
                      >
                        {a.toLocaleString()} F
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">
                      Date de début <span className="text-gray-400">(vide = aujourd'hui)</span>
                    </label>
                    <input
                      type="date"
                      value={investStartDate}
                      onChange={(e) => setInvestStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">
                      Taux hebdo (%) <span className="text-gray-400">(vide = auto selon niveau)</span>
                    </label>
                    <input
                      type="number"
                      value={investRate}
                      onChange={(e) => setInvestRate(e.target.value)}
                      placeholder="Auto"
                      min="1"
                      max="50"
                      step="0.5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900"
                    />
                  </div>

                  {investAmount && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="text-blue-700 text-sm">
                        <strong>Récap :</strong> {parseFloat(investAmount).toLocaleString()} F
                        {investStartDate ? ` • Début ${new Date(investStartDate).toLocaleDateString('fr-FR')}` : ' • Début aujourd\'hui'}
                        {investRate ? ` • ${investRate}%/sem` : ' • Taux auto'}
                        <br />
                        <span className="text-blue-600 text-xs">Durée : 52 semaines</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCreateInvestment}
                    disabled={loading || !investAmount}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all"
                  >
                    {loading ? 'En cours...' : `Créer l'investissement`}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}