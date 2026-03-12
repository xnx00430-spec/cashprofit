// app/(platform)/admin/crypto/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Wallet, Copy, Check, X, Trash2, Eye,
  Clock, CheckCircle, XCircle, Loader2, Image, ExternalLink,
  ToggleLeft, ToggleRight, Edit3, AlertCircle, RefreshCw
} from 'lucide-react';

export default function AdminCryptoPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState('payments');

  // Wallets
  const [wallets, setWallets] = useState([]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [walletForm, setWalletForm] = useState({ network: 'TRC20', address: '', label: '', notes: '' });
  const [walletLoading, setWalletLoading] = useState(false);

  // Payments
  const [payments, setPayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Taux USDT
  const [usdtRate, setUsdtRate] = useState(null);
  const [loadingRate, setLoadingRate] = useState(true);

  // Preview image
  const [previewImage, setPreviewImage] = useState(null);

  // Messages
  const [rejectMessage, setRejectMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  const NETWORKS = [
    { id: 'TRC20', label: 'USDT - Tron (TRC20)' },
    { id: 'BEP20', label: 'USDT - BSC (BEP20)' },
    { id: 'ERC20', label: 'USDT - Ethereum (ERC20)' },
    { id: 'SOL', label: 'USDT - Solana' },
    { id: 'POLYGON', label: 'USDT - Polygon' },
    { id: 'ARBITRUM', label: 'USDT - Arbitrum' },
    { id: 'OPTIMISM', label: 'USDT - Optimism' },
  ];

  useEffect(() => {
    fetchWallets();
    fetchPayments();
    fetchUSDTRate();
  }, [paymentFilter]);

  const fetchUSDTRate = async () => {
    setLoadingRate(true);
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=xof'
      );
      const data = await res.json();
      if (data?.tether?.xof) {
        setUsdtRate(data.tether.xof);
      } else {
        const resFallback = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd'
        );
        const dataFallback = await resFallback.json();
        if (dataFallback?.tether?.usd) {
          setUsdtRate(dataFallback.tether.usd * 605);
        } else {
          setUsdtRate(600);
        }
      }
    } catch (err) {
      console.error('Fetch USDT rate error:', err);
      setUsdtRate(600);
    } finally {
      setLoadingRate(false);
    }
  };

  const convertToUSDT = (amountFCFA) => {
    if (!usdtRate || !amountFCFA) return '—';
    return (amountFCFA / usdtRate).toFixed(2);
  };

  const fetchWallets = async () => {
    try {
      const res = await fetch('/api/admin/crypto/wallets');
      const data = await res.json();
      if (data.success) setWallets(data.wallets);
    } catch (error) {
      console.error('Fetch wallets error:', error);
    }
  };

  const fetchPayments = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/admin/crypto/payments?status=${paymentFilter}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Fetch payments error:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  // ==================== WALLETS ====================
  const handleSaveWallet = async () => {
    if (!walletForm.address || !walletForm.label) return;
    setWalletLoading(true);
    try {
      if (editingWallet) {
        const res = await fetch('/api/admin/crypto/wallets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletId: editingWallet._id, ...walletForm })
        });
        const data = await res.json();
        setResult(data);
      } else {
        const res = await fetch('/api/admin/crypto/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(walletForm)
        });
        const data = await res.json();
        setResult(data);
      }
      setShowAddWallet(false);
      setEditingWallet(null);
      setWalletForm({ network: 'TRC20', address: '', label: '', notes: '' });
      fetchWallets();
    } catch (error) {
      setResult({ success: false, message: 'Erreur réseau' });
    } finally {
      setWalletLoading(false);
    }
  };

  const toggleWallet = async (wallet) => {
    try {
      await fetch('/api/admin/crypto/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: wallet._id, isActive: !wallet.isActive })
      });
      fetchWallets();
    } catch (error) {
      console.error('Toggle wallet error:', error);
    }
  };

  const deleteWallet = async (walletId) => {
    if (!confirm('Supprimer ce wallet ?')) return;
    try {
      await fetch(`/api/admin/crypto/wallets?walletId=${walletId}`, { method: 'DELETE' });
      fetchWallets();
    } catch (error) {
      console.error('Delete wallet error:', error);
    }
  };

  // ==================== PAYMENTS ====================
  const handleApprove = async (paymentId) => {
    setProcessingId(paymentId);
    try {
      const res = await fetch('/api/admin/crypto/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action: 'approve' })
      });
      const data = await res.json();
      setResult(data);
      fetchPayments();
    } catch (error) {
      setResult({ success: false, message: 'Erreur réseau' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId) => {
    setProcessingId(paymentId);
    try {
      const res = await fetch('/api/admin/crypto/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action: 'reject', adminMessage: rejectMessage })
      });
      const data = await res.json();
      setResult(data);
      setShowRejectModal(null);
      setRejectMessage('');
      fetchPayments();
    } catch (error) {
      setResult({ success: false, message: 'Erreur réseau' });
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Paiements Crypto</h1>
            <p className="text-gray-500 text-sm">Gérer les wallets et valider les paiements USDT</p>
          </div>
          {/* Taux live */}
          <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
            <div className="text-gray-500 text-xs">Taux :</div>
            {loadingRate ? (
              <Loader2 className="animate-spin text-gray-400" size={14} />
            ) : (
              <div className="text-gray-900 text-sm font-bold">1 USDT = {usdtRate?.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</div>
            )}
            <button onClick={fetchUSDTRate} className="text-gray-400 hover:text-gray-600">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Résultat action */}
        {result && (
          <div className={`mb-6 p-4 rounded-xl border ${
            result.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span className="font-semibold">{result.message}</span>
              </div>
              <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'payments' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Clock size={18} />
            Paiements
            {counts.pending > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{counts.pending}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'wallets' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Wallet size={18} />
            Wallets ({wallets.length})
          </button>
        </div>

        {/* ==================== TAB PAIEMENTS ==================== */}
        {activeTab === 'payments' && (
          <>
            {/* Filtres statut */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'pending', label: 'En attente', count: counts.pending },
                { id: 'approved', label: 'Validés', count: counts.approved },
                { id: 'rejected', label: 'Rejetés', count: counts.rejected },
                { id: 'all', label: 'Tous', count: null },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPaymentFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    paymentFilter === f.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f.label} {f.count !== null && f.count > 0 ? `(${f.count})` : ''}
                </button>
              ))}
              <button onClick={fetchPayments} className="ml-auto p-2 text-gray-400 hover:text-gray-600">
                <RefreshCw size={18} />
              </button>
            </div>

            {/* Liste des paiements */}
            {paymentLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Chargement...
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Clock className="text-gray-300 mx-auto mb-3" size={48} />
                <p className="text-gray-500">Aucun paiement {paymentFilter === 'pending' ? 'en attente' : ''}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => {
                  const expectedUSDT = convertToUSDT(payment.amountFCFA);
                  const declaredUSDT = payment.amountUSDT;
                  const mismatch = declaredUSDT > 0 && Math.abs(declaredUSDT - parseFloat(expectedUSDT)) > 5;

                  return (
                    <div key={payment._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        {/* Infos principales */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-gray-900 font-bold text-lg">
                              {payment.amountFCFA?.toLocaleString()} FCFA
                            </h3>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-600 font-bold text-lg">
                              ≈ {expectedUSDT} USDT
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              payment.status === 'approved' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {payment.status === 'pending' ? 'En attente' :
                               payment.status === 'approved' ? 'Validé' : 'Rejeté'}
                            </span>
                          </div>

                          {/* User */}
                          <div className="text-gray-600 text-sm mb-2">
                            <span className="font-semibold text-gray-900">{payment.userId?.name || 'Inconnu'}</span>
                            {' • '}{payment.userId?.email}
                            {' • '}{payment.userId?.phone}
                          </div>

                          {/* Détails */}
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {payment.walletSnapshot?.label || payment.walletSnapshot?.network || 'N/A'}
                            </span>
                            {payment.opportunityName && (
                              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                {payment.opportunityName}
                              </span>
                            )}
                            {declaredUSDT > 0 && (
                              <span className={`px-2 py-1 rounded font-semibold ${
                                mismatch
                                  ? 'bg-red-50 text-red-600 border border-red-200'
                                  : 'bg-green-50 text-green-600'
                              }`}>
                                {declaredUSDT} USDT déclaré
                                {mismatch && ' ⚠️'}
                              </span>
                            )}
                            <span>{formatDate(payment.createdAt)}</span>
                          </div>

                          {/* Alerte si montant déclaré ne correspond pas */}
                          {mismatch && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                              <div className="text-red-600 text-xs flex items-center gap-1.5">
                                <AlertCircle size={13} />
                                <span>
                                  Le montant déclaré ({declaredUSDT} USDT) ne correspond pas au montant attendu (≈ {expectedUSDT} USDT). Vérifiez la capture.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Hash */}
                          {payment.txHash && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-gray-400 text-xs">Hash:</span>
                              <code className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded truncate max-w-xs">
                                {payment.txHash}
                              </code>
                              <button onClick={() => copyToClipboard(payment.txHash, `hash-${payment._id}`)} className="text-gray-400 hover:text-gray-600">
                                {copied === `hash-${payment._id}` ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          )}

                          {/* Message admin (si rejeté) */}
                          {payment.adminMessage && payment.status === 'rejected' && (
                            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-red-600 text-xs">
                              {payment.adminMessage}
                            </div>
                          )}
                        </div>

                        {/* Capture + Actions */}
                        <div className="flex flex-col items-end gap-3">
                          {/* Capture d'écran */}
                          {payment.proofImage && (
                            <button
                              onClick={() => setPreviewImage(payment.proofImage)}
                              className="w-20 h-20 rounded-xl border-2 border-gray-200 overflow-hidden hover:border-yellow-400 transition-all relative group"
                            >
                              <img src={payment.proofImage} alt="Preuve" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="text-white" size={20} />
                              </div>
                            </button>
                          )}

                          {/* Boutons action */}
                          {payment.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(payment._id)}
                                disabled={processingId === payment._id}
                                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
                              >
                                {processingId === payment._id ? (
                                  <Loader2 className="animate-spin" size={14} />
                                ) : (
                                  <CheckCircle size={14} />
                                )}
                                Valider
                              </button>
                              <button
                                onClick={() => setShowRejectModal(payment._id)}
                                disabled={processingId === payment._id}
                                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
                              >
                                <XCircle size={14} />
                                Rejeter
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ==================== TAB WALLETS ==================== */}
        {activeTab === 'wallets' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-500 text-sm">Les adresses que vos utilisateurs verront pour envoyer leur paiement crypto</p>
              <button
                onClick={() => {
                  setShowAddWallet(true);
                  setEditingWallet(null);
                  setWalletForm({ network: 'TRC20', address: '', label: '', notes: '' });
                }}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800"
              >
                <Plus size={18} />
                Ajouter un wallet
              </button>
            </div>

            {wallets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Wallet className="text-gray-300 mx-auto mb-3" size={48} />
                <p className="text-gray-900 font-semibold mb-1">Aucun wallet configuré</p>
                <p className="text-gray-500 text-sm">Ajoutez vos adresses USDT pour que vos utilisateurs puissent payer en crypto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <div key={wallet._id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                    wallet.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-gray-900 font-bold">{wallet.label}</h3>
                          <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {wallet.network}
                          </span>
                          {!wallet.isActive && (
                            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">
                              Désactivé
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg truncate max-w-md">
                            {wallet.address}
                          </code>
                          <button
                            onClick={() => copyToClipboard(wallet.address, wallet._id)}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            {copied === wallet._id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                        {wallet.notes && (
                          <p className="text-gray-400 text-xs mt-1">{wallet.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleWallet(wallet)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title={wallet.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {wallet.isActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingWallet(wallet);
                            setWalletForm({
                              network: wallet.network,
                              address: wallet.address,
                              label: wallet.label,
                              notes: wallet.notes || ''
                            });
                            setShowAddWallet(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => deleteWallet(wallet._id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== MODAL AJOUTER/MODIFIER WALLET ==================== */}
        {showAddWallet && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-gray-900 text-xl font-bold">
                  {editingWallet ? 'Modifier le wallet' : 'Ajouter un wallet'}
                </h2>
                <button onClick={() => { setShowAddWallet(false); setEditingWallet(null); }} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Réseau</label>
                  <select
                    value={walletForm.network}
                    onChange={(e) => {
                      const net = NETWORKS.find(n => n.id === e.target.value);
                      setWalletForm({ ...walletForm, network: e.target.value, label: net?.label || '' });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900"
                  >
                    {NETWORKS.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Label (nom affiché aux utilisateurs)</label>
                  <input
                    type="text"
                    value={walletForm.label}
                    onChange={(e) => setWalletForm({ ...walletForm, label: e.target.value })}
                    placeholder="Ex: USDT - Tron (TRC20)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Adresse du wallet</label>
                  <input
                    type="text"
                    value={walletForm.address}
                    onChange={(e) => setWalletForm({ ...walletForm, address: e.target.value })}
                    placeholder="T..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Notes internes (optionnel)</label>
                  <input
                    type="text"
                    value={walletForm.notes}
                    onChange={(e) => setWalletForm({ ...walletForm, notes: e.target.value })}
                    placeholder="Ex: Wallet principal Binance"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900"
                  />
                </div>

                <button
                  onClick={handleSaveWallet}
                  disabled={walletLoading || !walletForm.address || !walletForm.label}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all"
                >
                  {walletLoading ? 'En cours...' : editingWallet ? 'Enregistrer' : 'Ajouter le wallet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODAL REJETER ==================== */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-gray-900 text-xl font-bold mb-4">Rejeter le paiement</h2>
              <div>
                <label className="text-gray-600 text-sm mb-2 block">Raison du rejet (optionnel)</label>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="Ex: Capture illisible, montant incorrect..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-red-400 focus:outline-none text-gray-900 resize-none"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowRejectModal(null); setRejectMessage(''); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={processingId}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {processingId ? 'En cours...' : 'Confirmer le rejet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODAL PREVIEW IMAGE ==================== */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-3xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
              >
                <X size={20} />
              </button>
              <img src={previewImage} alt="Preuve de paiement" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" />
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-white"
              >
                <ExternalLink size={16} />
                Ouvrir en grand
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}