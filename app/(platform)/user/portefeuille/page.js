// app/(platform)/user/portefeuille/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wallet, TrendingUp, Users, Gift, 
  ArrowUpRight, Eye, EyeOff, Clock,
  CheckCircle, XCircle, AlertCircle, Download, Lock, X
} from 'lucide-react';

function Modal({ show, type, title, message, onClose, onConfirm, confirmText, cancelText }) {
  if (!show) return null;
  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    confirm: 'bg-white border-gray-200'
  };
  const iconColors = {
    success: <CheckCircle className="text-green-600" size={24} />,
    error: <XCircle className="text-red-600" size={24} />,
    warning: <AlertCircle className="text-yellow-600" size={24} />,
    info: <AlertCircle className="text-blue-600" size={24} />,
    confirm: <AlertCircle className="text-yellow-600" size={24} />
  };
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className={`${colors[type]} border rounded-2xl p-6 max-w-sm w-full shadow-2xl`}>
        <div className="flex items-start gap-3 mb-4">
          {iconColors[type]}
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-base mb-1">{title}</div>
            <div className="text-gray-600 text-sm whitespace-pre-line">{message}</div>
          </div>
        </div>
        {onConfirm ? (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2.5 rounded-xl transition-colors">{cancelText || 'Annuler'}</button>
            <button onClick={onConfirm} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-md">{confirmText || 'Confirmer'}</button>
          </div>
        ) : (
          <button onClick={onClose} className="w-full bg-white/80 hover:bg-white text-gray-900 font-semibold py-2.5 rounded-xl transition-colors border border-gray-200">OK</button>
        )}
      </div>
    </div>
  );
}

export default function PortefeuillePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasReferrer, setHasReferrer] = useState(false);
  const [balances, setBalances] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawType, setWithdrawType] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [modal, setModal] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null, confirmText: '', cancelText: '' });

  const showModal = (type, title, message, opts = {}) => setModal({ show: true, type, title, message, ...opts });
  const hideModal = () => setModal({ ...modal, show: false, onConfirm: null });

  useEffect(() => {
    setMounted(true);
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [userRes, invRes, wRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/investments'),
        fetch('/api/user/withdrawals?limit=10')
      ]);
      const [userData, invData, wData] = await Promise.all([userRes.json(), invRes.json(), wRes.json()]);
      if (userData.success) {
        setUser(userData.user);
        setHasReferrer(userData.user.hasReferrer || false);
        setBalances({
          benefices: userData.user.balance || 0,
          commissions: userData.user.totalCommissions || 0,
          bonus: userData.user.bonusParrainage || 0
        });
      }
      if (invData.success) {
        setInvestments(invData.investments);
        if (invData.hasReferrer !== undefined) setHasReferrer(invData.hasReferrer);
      }
      if (wData.success) setWithdrawals(wData.withdrawals);
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gains live (déjà nets via l'API investments)
  const getLiveEarnings = () => investments.reduce((sum, inv) => sum + (inv.currentEarnings || 0), 0);
  
  // Total bénéfices = solde DB + gains live (pas encore synchronisés)
  const getTotalBenefices = () => (balances?.benefices || 0) + getLiveEarnings();

  // 1% retirable à tout moment, 100% au niveau 10
  const getWithdrawableBonus = () => {
    if (!user || !balances) return 0;
    return user.level >= 10 ? balances.bonus : balances.bonus * 0.01;
  };

  const handleWithdraw = async () => {
    const minAmount = withdrawType === 'bonus' ? 100 : 1000;
    if (!withdrawAmount || withdrawAmount < minAmount) {
      showModal('error', 'Montant invalide', `Le montant minimum de retrait est de ${minAmount.toLocaleString()} FCFA`);
      return;
    }
    if (!accountNumber || !accountName) {
      showModal('error', 'Champs manquants', 'Veuillez remplir le numéro de compte et le nom complet');
      return;
    }
    if (withdrawType === 'bonus') {
      const maxBonus = getWithdrawableBonus();
      if (parseFloat(withdrawAmount) > maxBonus) {
        showModal('warning', 'Montant trop élevé', `Maximum retirable : ${maxBonus.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} FCFA (${user.level >= 10 ? '100%' : '1%'})`);
        return;
      }
    }
    if (withdrawType === 'commissions') {
      const maxComm = balances?.commissions || 0;
      if (parseFloat(withdrawAmount) > maxComm) {
        showModal('warning', 'Montant trop élevé', `Maximum retirable : ${maxComm.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA`);
        return;
      }
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          type: withdrawType,
          paymentMethod,
          accountNumber,
          accountName
        })
      });
      const data = await res.json();
      if (data.success) {
        showModal('success', 'Retrait demandé ✅', `Votre demande de ${parseFloat(withdrawAmount).toLocaleString()} FCFA a été enregistrée.\n\nDélai : 24-48 heures.`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setAccountNumber('');
        setAccountName('');
        fetchAllData();
      } else {
        if (data.needsKYC) {
          showModal('confirm', 'Vérification KYC requise', 'Veuillez compléter votre KYC pour effectuer votre premier retrait.', {
            onConfirm: () => { hideModal(); router.push('/user/profil/kyc'); },
            confirmText: 'Soumettre le KYC',
            cancelText: 'Plus tard'
          });
        } else if (data.blocked) {
          showModal('error', 'Bénéfices bloqués', `${data.message}\n\nCommissions disponibles : ${(data.details?.commissionsAvailable || 0).toLocaleString()} FCFA`);
        } else if (data.cooldown) {
          showModal('warning', '⏳ Délai de 3 jours', data.message);
        } else {
          showModal('error', 'Erreur', data.message || 'Erreur lors de la demande');
        }
      }
    } catch (error) {
      showModal('error', 'Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const openWithdrawModal = (type) => {
    setWithdrawType(type);
    setWithdrawAmount('');
    setAccountNumber('');
    setAccountName('');
    setShowWithdrawModal(true);
  };

  const getStatusIcon = (s) => {
    const m = {
      pending: <Clock className="text-yellow-500" size={16} />,
      approved: <CheckCircle className="text-blue-500" size={16} />,
      completed: <CheckCircle className="text-green-500" size={16} />,
      rejected: <XCircle className="text-red-500" size={16} />
    };
    return m[s] || <AlertCircle className="text-gray-500" size={16} />;
  };
  const getStatusText = (s) => ({ pending: 'En attente', approved: 'Approuvé', completed: 'Complété', rejected: 'Rejeté' }[s] || s);
  const getStatusColor = (s) => ({ pending: 'bg-yellow-50 text-yellow-600 border-yellow-200', approved: 'bg-blue-50 text-blue-600 border-blue-200', completed: 'bg-green-50 text-green-600 border-green-200', rejected: 'bg-red-50 text-red-600 border-red-200' }[s] || 'bg-gray-50 text-gray-600 border-gray-200');

  if (!mounted) return null;

  const liveEarnings = getLiveEarnings();
  const totalBenefices = getTotalBenefices();
  const withdrawableBonus = getWithdrawableBonus();
  const bonusPercentage = user?.level >= 10 ? 100 : 1;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <Modal {...modal} onClose={hideModal} />

        <div className="mb-8">
          <h1 className="text-gray-900 text-3xl font-bold mb-2">Portefeuille</h1>
          <p className="text-gray-600 text-sm">Gérez vos soldes et demandes de retrait</p>
        </div>

        {user?.benefitsBlocked && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-red-600 font-bold text-lg mb-2">⚠️ Bénéfices bloqués</h3>
                <p className="text-red-600/80 text-sm mb-4">Parrainez des affiliés pour débloquer vos bénéfices. Vos commissions et bonus restent accessibles.</p>
                <Link href="/user/reseau" className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl">Parrainer</Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* ==================== BÉNÉFICES ==================== */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Wallet className="text-gray-900" size={20} />
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Bénéfices Personnels</div>
                  <div className="text-gray-900 text-xl font-bold">
                    {showBalances
                      ? `${totalBenefices.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F`
                      : '••••••'}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowBalances(!showBalances)} className="text-gray-500 hover:text-gray-900">
                {showBalances ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {showBalances && liveEarnings > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-600 text-xs font-medium">Gains en cours (live)</span>
                </div>
                <div className="text-green-700 text-lg font-bold font-mono">
                  +{liveEarnings.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                </div>
                {hasReferrer && (
                  <div className="text-orange-500 text-[10px] mt-1">Net après 10% commission parrain</div>
                )}
              </div>
            )}

            {user?.benefitsBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Lock className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-red-600 text-xs">
                    <div className="font-semibold">Bloqués</div>
                    <div>Parrainez pour débloquer</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => openWithdrawModal('gains')}
              disabled={user?.benefitsBlocked || totalBenefices < 1000}
              className={`w-full py-3 rounded-xl font-semibold transition-colors shadow-md ${
                user?.benefitsBlocked || totalBenefices < 1000
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {user?.benefitsBlocked
                ? '🔒 Bloqué'
                : totalBenefices >= 1000
                  ? `Retirer ${Math.floor(totalBenefices).toLocaleString()} F`
                  : 'Retirer'}
            </button>
          </div>

          {/* ==================== COMMISSIONS ==================== */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <Users className="text-green-600" size={20} />
              </div>
              <div>
                <div className="text-gray-600 text-xs">Commissions</div>
                <div className="text-gray-900 text-xl font-bold">
                  {showBalances
                    ? `${(balances?.commissions || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F`
                    : '••••••'}
                </div>
              </div>
            </div>

            {(balances?.commissions || 0) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-600 text-xs font-medium">10% des bénéfices de vos affiliés</span>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <div className="text-green-600 text-xs">✅ Toujours retirable sans condition</div>
            </div>

            <button
              onClick={() => openWithdrawModal('commissions')}
              disabled={(balances?.commissions || 0) <= 0}
              className={`w-full py-3 rounded-xl font-semibold transition-colors shadow-md ${
                (balances?.commissions || 0) <= 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {(balances?.commissions || 0) > 0
                ? `Retirer ${(balances?.commissions || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} F`
                : 'Retirer'}
            </button>
          </div>

          {/* ==================== BONUS ==================== */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <Gift className="text-yellow-600" size={20} />
              </div>
              <div>
                <div className="text-gray-600 text-xs">Bonus Parrainage</div>
                <div className="text-gray-900 text-xl font-bold">
                  {showBalances ? `${(balances?.bonus || 0).toLocaleString()} F` : '••••••'}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
              <div className="text-yellow-600 text-xs mb-2">🎁 10,000 FCFA par affilié</div>
              <div className="flex justify-between">
                <span className="text-yellow-700 text-xs">Retirable :</span>
                <span className="text-yellow-700 text-sm font-bold">
                  {withdrawableBonus.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} F ({bonusPercentage}%)
                </span>
              </div>
              {user?.level < 10 && (
                <div className="text-green-600/70 text-[10px] mt-1">✅ 1% retirable à tout moment • 100% au niveau 10</div>
              )}
            </div>

            <button
              onClick={() => openWithdrawModal('bonus')}
              disabled={withdrawableBonus < 100}
              className={`w-full py-3 rounded-xl font-semibold transition-colors shadow-md ${
                withdrawableBonus < 100
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {withdrawableBonus >= 100
                ? `Retirer ${withdrawableBonus.toLocaleString()} F`
                : 'Retirer'}
            </button>
          </div>
        </div>

        {/* ==================== HISTORIQUE DES RETRAITS ==================== */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
          <h2 className="text-gray-900 text-xl font-bold mb-6">Historique des Retraits</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : withdrawals.length > 0 ? (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(w.status)}
                      <div>
                        <div className="text-gray-900 text-sm font-semibold">{w.amount?.toLocaleString()} FCFA</div>
                        <div className="text-gray-600 text-xs">
                          {w.type === 'gains' ? 'Bénéfices' : w.type === 'commissions' ? 'Commissions' : 'Bonus'} • {w.method || 'Mobile Money'}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(w.status)}`}>
                      {getStatusText(w.status)}
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(w.requestedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {w.status === 'rejected' && w.rejectionReason && (
                    <div className="mt-2 text-red-600 text-xs">Raison : {w.rejectionReason}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Download className="text-gray-400 mx-auto mb-3" size={48} />
              <div className="text-gray-600 text-sm">Aucun retrait</div>
            </div>
          )}
        </div>

        {/* ==================== MODAL RETRAIT ==================== */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-gray-900 text-xl font-bold">
                  Retirer {withdrawType === 'gains' ? 'Bénéfices' : withdrawType === 'commissions' ? 'Commissions' : 'Bonus'}
                </h3>
                <button onClick={() => setShowWithdrawModal(false)} className="text-gray-500 hover:text-gray-900">
                  <X size={24} />
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
                <div className="text-gray-600 text-xs mb-1">Solde disponible</div>
                <div className="text-gray-900 text-2xl font-bold">
                  {Math.floor(withdrawType === 'gains'
                    ? totalBenefices
                    : withdrawType === 'commissions'
                      ? (balances?.commissions || 0)
                      : withdrawableBonus
                  ).toLocaleString()} FCFA
                </div>
                {withdrawType === 'gains' && liveEarnings > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600 text-xs">
                      dont +{liveEarnings.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} F de gains live
                    </span>
                  </div>
                )}
                {withdrawType === 'gains' && hasReferrer && (
                  <div className="text-orange-500 text-xs mt-1">Net après 10% commission parrain</div>
                )}
                {withdrawType === 'commissions' && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600 text-xs">10% des bénéfices de vos affiliés</span>
                  </div>
                )}
                {withdrawType === 'bonus' && user?.level < 10 && (
                  <div className="text-yellow-600 text-xs mt-1">1% du bonus total • 100% au niveau 10</div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Montant à retirer</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min={withdrawType === 'bonus' ? 100 : 1000}
                    step="1000"
                    placeholder={`Minimum ${withdrawType === 'bonus' ? '100' : '1,000'} FCFA`}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Méthode de paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="mtn_money">MTN Money</option>
                    <option value="bank_transfer">Virement bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">
                    {paymentMethod === 'bank_transfer' ? 'IBAN' : 'Numéro de téléphone'}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={paymentMethod === 'bank_transfer' ? 'CI00 0000 ...' : '+225 XX XX XX XX'}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Nom complet</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Votre nom complet"
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="text-blue-600 text-xs">⏱️ Délai : 24-48 heures</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="flex-1 bg-yellow-400 text-white py-3 rounded-xl font-semibold hover:bg-yellow-500 disabled:opacity-50 shadow-md"
                  >
                    {isWithdrawing ? 'En cours...' : `Retirer ${withdrawAmount ? parseFloat(withdrawAmount).toLocaleString() : ''} F`}
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