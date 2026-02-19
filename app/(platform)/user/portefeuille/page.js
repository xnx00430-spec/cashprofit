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

  const getLiveEarnings = () => investments.reduce((sum, inv) => sum + (inv.currentEarnings || 0), 0);
  const getUnsyncedEarnings = () => investments.reduce((sum, inv) => sum + (inv.unsyncedEarnings || 0), 0);
  const getTotalBenefices = () => (balances?.benefices || 0) + getUnsyncedEarnings();

  const getWithdrawableBonus = () => {
    if (!user || !balances) return 0;
    return user.level >= 10 ? balances.bonus : balances.bonus * 0.01;
  };

  const handleWithdraw = async () => {
    const minAmount = withdrawType === 'bonus' ? 100 : 1000;
    if (!withdrawAmount || withdrawAmount < minAmount) {
      showModal('error', 'Montant trop bas', `Le minimum pour retirer est de ${minAmount.toLocaleString()} FCFA`);
      return;
    }
    if (!accountNumber || !accountName) {
      showModal('error', 'Informations manquantes', 'Entrez votre numéro de téléphone et votre nom complet pour recevoir l\'argent');
      return;
    }
    if (withdrawType === 'bonus') {
      const maxBonus = getWithdrawableBonus();
      if (parseFloat(withdrawAmount) > maxBonus) {
        showModal('warning', 'Montant trop élevé', `Vous pouvez retirer maximum ${maxBonus.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} FCFA (${user.level >= 10 ? '100%' : '1%'} de votre bonus)`);
        return;
      }
    }
    if (withdrawType === 'commissions') {
      const maxComm = balances?.commissions || 0;
      if (parseFloat(withdrawAmount) > maxComm) {
        showModal('warning', 'Montant trop élevé', `Vous avez ${maxComm.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA de commissions disponibles`);
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
        showModal('success', 'Retrait demandé', `Votre demande de ${parseFloat(withdrawAmount).toLocaleString()} FCFA a été enregistrée.\n\nVous recevrez l'argent sur votre compte en moins de 24 heures.`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setAccountNumber('');
        setAccountName('');
        fetchAllData();
      } else {
        if (data.needsKYC) {
          showModal('confirm', 'Vérification d\'identité requise', 'Pour retirer de l\'argent, vous devez d\'abord vérifier votre identité. C\'est rapide et automatique.', {
            onConfirm: () => { hideModal(); router.push('/user/profil/kyc'); },
            confirmText: 'Vérifier maintenant',
            cancelText: 'Plus tard'
          });
        } else if (data.blocked) {
          showModal('error', 'Gains bloqués', `${data.message}\n\nVos commissions restent disponibles : ${(data.details?.commissionsAvailable || 0).toLocaleString()} FCFA`);
        } else {
          showModal('error', 'Erreur', data.message || 'Une erreur est survenue');
        }
      }
    } catch (error) {
      showModal('error', 'Erreur réseau', 'Impossible de contacter le serveur. Vérifiez votre connexion internet.');
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

  const getStatusIcon = (s) => ({
    pending: <Clock className="text-yellow-500" size={16} />,
    approved: <CheckCircle className="text-blue-500" size={16} />,
    completed: <CheckCircle className="text-green-500" size={16} />,
    rejected: <XCircle className="text-red-500" size={16} />
  }[s] || <AlertCircle className="text-gray-500" size={16} />);
  
  const getStatusText = (s) => ({ pending: 'En cours', approved: 'Envoyé', completed: 'Envoyé', rejected: 'Refusé' }[s] || s);
  const getStatusColor = (s) => ({ pending: 'bg-yellow-50 text-yellow-600 border-yellow-200', approved: 'bg-green-50 text-green-600 border-green-200', completed: 'bg-green-50 text-green-600 border-green-200', rejected: 'bg-red-50 text-red-600 border-red-200' }[s] || 'bg-gray-50 text-gray-600 border-gray-200');

  if (!mounted) return null;

  const liveEarnings = getLiveEarnings();
  const totalBenefices = getTotalBenefices();
  const withdrawableBonus = getWithdrawableBonus();
  const bonusPercentage = user?.level >= 10 ? 100 : 1;
  const commissions = balances?.commissions || 0;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <Modal {...modal} onClose={hideModal} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 text-3xl font-bold mb-1">Mon portefeuille</h1>
              <p className="text-gray-500 text-sm">Ici vous voyez tout l&apos;argent que vous avez gagné et vous pouvez demander un retrait</p>
            </div>
            <button onClick={() => setShowBalances(!showBalances)} className="text-gray-400 hover:text-gray-900 p-2">
              {showBalances ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Alerte bloqué */}
        {user?.benefitsBlocked && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-red-700 font-bold mb-1">Vos gains sont bloqués</h3>
                <p className="text-red-600/80 text-sm mb-3">Vous n&apos;avez pas atteint votre objectif dans les délais. Invitez des personnes à investir pour débloquer vos gains. Vos commissions et bonus restent accessibles.</p>
                <Link href="/user/reseau" className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">Inviter des proches</Link>
              </div>
            </div>
          </div>
        )}

        {/* 3 CARTES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* ==================== BÉNÉFICES ==================== */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Wallet className="text-gray-900" size={20} />
              </div>
              <div>
                <div className="text-gray-900 text-sm font-semibold">Bénéfices à retirer</div>
                <div className="text-gray-400 text-[10px]">Ce que vous pouvez retirer maintenant</div>
              </div>
            </div>

            <div className="my-4">
              <div className="text-gray-900 text-2xl font-bold">
                {showBalances
                  ? `${totalBenefices.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F`
                  : '••••••'}
              </div>
            </div>

            {showBalances && liveEarnings > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-600 text-xs font-medium">Gains en direct</span>
                </div>
                <div className="text-green-700 text-lg font-bold font-mono">
                  +{liveEarnings.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                </div>
                <div className="text-green-600/60 text-[10px] mt-1">Total gagné depuis le début (augmente chaque seconde)</div>
                {liveEarnings > totalBenefices && (
                  <div className="text-gray-500 text-[10px] mt-1">Vous avez déjà retiré {(liveEarnings - totalBenefices).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F</div>
                )}
                {hasReferrer && (
                  <div className="text-orange-500 text-[10px] mt-1">Net après 10% pour votre parrain</div>
                )}
              </div>
            )}

            {user?.benefitsBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Lock className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                  <div className="text-red-600 text-xs">
                    Bloqués — Invitez des personnes pour débloquer
                  </div>
                </div>
              </div>
            )}

            {!user?.benefitsBlocked && totalBenefices > 0 && totalBenefices < 1000 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3">
                <div className="text-orange-600 text-xs">Minimum 1,000 FCFA pour retirer. Il vous manque {Math.ceil(1000 - totalBenefices).toLocaleString()} F</div>
              </div>
            )}

            <button
              onClick={() => openWithdrawModal('gains')}
              disabled={user?.benefitsBlocked || totalBenefices < 1000}
              className={`w-full py-3 rounded-xl font-semibold transition-colors text-sm ${
                user?.benefitsBlocked || totalBenefices < 1000
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md'
              }`}
            >
              {user?.benefitsBlocked
                ? 'Bloqué — Invitez pour débloquer'
                : totalBenefices >= 1000
                  ? `Retirer mes bénéfices`
                  : 'Retirer'}
            </button>
          </div>

          {/* ==================== COMMISSIONS ==================== */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                <Users className="text-green-600" size={20} />
              </div>
              <div>
                <div className="text-gray-900 text-sm font-semibold">Vos commissions</div>
                <div className="text-gray-400 text-[10px]">L&apos;argent gagné grâce aux personnes que vous avez invitées</div>
              </div>
            </div>

            <div className="my-4">
              <div className="text-gray-900 text-2xl font-bold">
                {showBalances
                  ? `${commissions.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F`
                  : '••••••'}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
              <div className="text-green-700 text-xs font-medium mb-1">Comment ça marche</div>
              <div className="text-green-600 text-[10px] leading-relaxed">
                Chaque semaine, vous recevez automatiquement 10% des gains de chaque personne que vous avez invitée. Plus vous invitez, plus vous gagnez.
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mb-3">
              <div className="text-gray-500 text-[10px]">Retirable à tout moment dès 1,000 FCFA, sans condition</div>
            </div>

            {commissions > 0 && commissions < 1000 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3">
                <div className="text-orange-600 text-xs">Minimum 1,000 FCFA pour retirer. Il vous manque {Math.ceil(1000 - commissions).toLocaleString()} F</div>
              </div>
            )}

            <button
              onClick={() => openWithdrawModal('commissions')}
              disabled={commissions < 1000}
              className={`w-full py-3 rounded-xl font-semibold transition-colors text-sm ${
                commissions < 1000
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
              }`}
            >
              {commissions >= 1000 ? 'Retirer mes commissions' : 'Retirer'}
            </button>
          </div>

          {/* ==================== BONUS ==================== */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center">
                <Gift className="text-yellow-600" size={20} />
              </div>
              <div>
                <div className="text-gray-900 text-sm font-semibold">Vos bonus</div>
                <div className="text-gray-400 text-[10px]">10,000 FCFA reçus pour chaque personne invitée qui investit</div>
              </div>
            </div>

            <div className="my-4">
              <div className="text-gray-900 text-2xl font-bold">
                {showBalances ? `${(balances?.bonus || 0).toLocaleString()} F` : '••••••'}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-yellow-700 text-xs font-medium">Ce que vous pouvez retirer</span>
                <span className="text-yellow-700 text-sm font-bold">
                  {withdrawableBonus.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} F
                </span>
              </div>
              <div className="text-yellow-600/70 text-[10px] leading-relaxed">
                {user?.level >= 10 
                  ? 'Votre bonus est 100% retirable car vous êtes au niveau 10 ou plus'
                  : `Actuellement, ${bonusPercentage}% de votre bonus est retirable. Au niveau 10, vous pourrez retirer 100% de votre bonus.`
                }
              </div>
            </div>

            <button
              onClick={() => openWithdrawModal('bonus')}
              disabled={withdrawableBonus < 100}
              className={`w-full py-3 rounded-xl font-semibold transition-colors text-sm ${
                withdrawableBonus < 100
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md'
              }`}
            >
              {withdrawableBonus >= 100 ? 'Retirer mon bonus' : 'Retirer'}
            </button>
          </div>
        </div>

        {/* ==================== HISTORIQUE ==================== */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
          <div className="mb-2">
            <h2 className="text-gray-900 text-xl font-bold">Historique des retraits</h2>
            <p className="text-gray-400 text-xs">Toutes vos demandes de retrait passées</p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : withdrawals.length > 0 ? (
            <div className="space-y-3 mt-4">
              {withdrawals.map((w) => (
                <div key={w.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(w.status)}
                      <div>
                        <div className="text-gray-900 text-sm font-semibold">{w.amount?.toLocaleString()} FCFA</div>
                        <div className="text-gray-500 text-xs">
                          {w.type === 'gains' ? 'Bénéfices' : w.type === 'commissions' ? 'Commissions' : 'Bonus'} • {w.method || 'Mobile Money'}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(w.status)}`}>
                      {getStatusText(w.status)}
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(w.requestedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {w.status === 'rejected' && w.rejectionReason && (
                    <div className="mt-2 text-red-600 text-xs">Raison : {w.rejectionReason}</div>
                  )}
                  {w.status === 'pending' && (
                    <div className="mt-2 text-yellow-600 text-[10px]">Votre demande est en cours de traitement. Vous recevrez l&apos;argent sous 24 heures.</div>
                  )}
                  {w.status === 'completed' && (
                    <div className="mt-2 text-green-600 text-[10px]">L&apos;argent a été envoyé sur votre compte</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Download className="text-gray-300 mx-auto mb-3" size={40} />
              <div className="text-gray-900 font-semibold text-sm mb-1">Aucun retrait pour le moment</div>
              <div className="text-gray-400 text-xs">Quand vous demanderez un retrait, il apparaîtra ici</div>
            </div>
          )}
        </div>

        {/* ==================== MODAL RETRAIT ==================== */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-gray-900 text-xl font-bold">
                    Retirer {withdrawType === 'gains' ? 'vos bénéfices' : withdrawType === 'commissions' ? 'vos commissions' : 'votre bonus'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">L&apos;argent sera envoyé sur votre compte Mobile Money</p>
                </div>
                <button onClick={() => setShowWithdrawModal(false)} className="text-gray-400 hover:text-gray-900">
                  <X size={22} />
                </button>
              </div>

              {/* Solde */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
                <div className="text-gray-500 text-xs mb-1">Montant disponible</div>
                <div className="text-gray-900 text-2xl font-bold">
                  {Math.floor(withdrawType === 'gains'
                    ? totalBenefices
                    : withdrawType === 'commissions'
                      ? commissions
                      : withdrawableBonus
                  ).toLocaleString()} FCFA
                </div>
                {withdrawType === 'gains' && (
                  <div className="text-gray-400 text-[10px] mt-1">Ce sont les bénéfices générés par vos investissements</div>
                )}
                {withdrawType === 'gains' && hasReferrer && (
                  <div className="text-orange-500 text-[10px] mt-1">Net après 10% pour votre parrain</div>
                )}
                {withdrawType === 'commissions' && (
                  <div className="text-gray-400 text-[10px] mt-1">10% des gains de chaque personne que vous avez invitée</div>
                )}
                {withdrawType === 'bonus' && user?.level < 10 && (
                  <div className="text-yellow-600 text-[10px] mt-1">{bonusPercentage}% de votre bonus est retirable. 100% au niveau 10.</div>
                )}
              </div>

              {/* Formulaire */}
              <div className="space-y-4">
                <div>
                  <label className="text-gray-700 text-sm font-medium mb-1.5 block">Combien voulez-vous retirer ?</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min={withdrawType === 'bonus' ? 100 : 1000}
                    step="1000"
                    placeholder={`Minimum ${withdrawType === 'bonus' ? '100' : '1,000'} FCFA`}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-gray-700 text-sm font-medium mb-1.5 block">Comment voulez-vous recevoir l&apos;argent ?</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none text-sm"
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="mtn_money">MTN Money</option>
                    <option value="bank_transfer">Virement bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-700 text-sm font-medium mb-1.5 block">
                    {paymentMethod === 'bank_transfer' ? 'Numéro IBAN' : 'Numéro de téléphone'}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={paymentMethod === 'bank_transfer' ? 'CI00 0000 ...' : '+225 07 00 00 00 00'}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none text-sm"
                  />
                  <p className="text-gray-400 text-[10px] mt-1">Le numéro sur lequel vous recevrez l&apos;argent</p>
                </div>
                <div>
                  <label className="text-gray-700 text-sm font-medium mb-1.5 block">Nom complet du titulaire</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Votre nom tel qu'il apparaît sur votre compte"
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none text-sm"
                  />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="text-gray-600 text-xs">Vous recevrez l&apos;argent sur votre compte en moins de 24 heures</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 shadow-md text-sm"
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