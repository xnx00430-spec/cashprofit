// components/CryptoPaymentModal.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  X, Copy, Check, Upload, Wallet, Clock, CheckCircle,
  AlertCircle, Loader2, ChevronLeft, RefreshCw
} from 'lucide-react';

/**
 * Modal de paiement par crypto USDT
 * Convertit automatiquement FCFA → USDT via CoinGecko
 */
export default function CryptoPaymentModal({
  isOpen,
  onClose,
  amount,
  opportunityId,
  opportunityName,
  onSuccess
}) {
  const [step, setStep] = useState(1);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  // Taux de conversion
  const [usdtRate, setUsdtRate] = useState(null); // 1 USDT = X FCFA
  const [loadingRate, setLoadingRate] = useState(true);
  const [rateError, setRateError] = useState(false);

  // Form
  const [amountUSDT, setAmountUSDT] = useState('');
  const [txHash, setTxHash] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWallets();
      fetchUSDTRate();
      setStep(1);
      setSelectedWallet(null);
      setAmountUSDT('');
      setTxHash('');
      setProofFile(null);
      setProofPreview(null);
      setError(null);
    }
  }, [isOpen]);

  // Pré-remplir le montant USDT quand le taux est chargé
  useEffect(() => {
    if (usdtRate && amount) {
      const converted = (amount / usdtRate).toFixed(2);
      setAmountUSDT(converted);
    }
  }, [usdtRate, amount]);

  const fetchWallets = async () => {
    setLoadingWallets(true);
    try {
      const res = await fetch('/api/crypto/wallets');
      const data = await res.json();
      if (data.success) {
        setWallets(data.wallets);
      }
    } catch (err) {
      console.error('Fetch wallets error:', err);
    } finally {
      setLoadingWallets(false);
    }
  };

  const fetchUSDTRate = async () => {
    setLoadingRate(true);
    setRateError(false);
    try {
      // CoinGecko API : prix de 1 USDT en XOF (FCFA)
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=xof'
      );
      const data = await res.json();
      if (data?.tether?.xof) {
        setUsdtRate(data.tether.xof); // ex: 615.5
      } else {
        // Fallback : essayer USD puis convertir (1 USD ≈ 605 XOF)
        const resFallback = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd'
        );
        const dataFallback = await resFallback.json();
        if (dataFallback?.tether?.usd) {
          // 1 USDT ≈ 1 USD, 1 USD ≈ 605 FCFA
          setUsdtRate(dataFallback.tether.usd * 605);
        } else {
          setUsdtRate(600); // Fallback fixe
          setRateError(true);
        }
      }
    } catch (err) {
      console.error('Fetch USDT rate error:', err);
      setUsdtRate(600); // Fallback fixe en cas d'erreur
      setRateError(true);
    } finally {
      setLoadingRate(false);
    }
  };

  const getConvertedAmount = () => {
    if (!usdtRate || !amount) return null;
    return (amount / usdtRate).toFixed(2);
  };

  const copyAddress = () => {
    if (selectedWallet) {
      navigator.clipboard.writeText(selectedWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('La capture ne doit pas dépasser 10 Mo');
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!proofFile) {
      setError('Veuillez uploader la capture d\'écran de votre paiement');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('walletId', selectedWallet._id);
      formData.append('amountFCFA', amount.toString());
      formData.append('amountUSDT', amountUSDT || '0');
      formData.append('opportunityId', opportunityId || '');
      formData.append('opportunityName', opportunityName || '');
      formData.append('txHash', txHash || '');
      formData.append('proof', proofFile);

      const res = await fetch('/api/crypto/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setStep(3);
        setTimeout(() => {
          onSuccess?.();
        }, 3000);
      } else {
        setError(data.message || 'Erreur lors de la soumission');
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const getNetworkColor = (network) => {
    const colors = {
      TRC20: 'border-red-200 bg-red-50 text-red-700',
      BEP20: 'border-yellow-200 bg-yellow-50 text-yellow-700',
      ERC20: 'border-blue-200 bg-blue-50 text-blue-700',
      SOL: 'border-purple-200 bg-purple-50 text-purple-700',
      POLYGON: 'border-violet-200 bg-violet-50 text-violet-700',
      ARBITRUM: 'border-cyan-200 bg-cyan-50 text-cyan-700',
      OPTIMISM: 'border-red-200 bg-red-50 text-red-700',
    };
    return colors[network] || 'border-gray-200 bg-gray-50 text-gray-700';
  };

  if (!isOpen) return null;

  const convertedAmount = getConvertedAmount();

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button onClick={() => { setStep(1); setSelectedWallet(null); setError(null); }} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={22} />
              </button>
            )}
            <div>
              <h2 className="text-gray-900 text-lg font-bold">
                {step === 1 ? 'Paiement Crypto' : step === 2 ? 'Envoyer le paiement' : 'Paiement soumis'}
              </h2>
              <p className="text-gray-500 text-xs">
                {step === 1 ? 'Choisissez le réseau USDT' : step === 2 ? `${amount?.toLocaleString()} FCFA via ${selectedWallet?.label}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="p-5">

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {/* ==================== STEP 1: CHOISIR WALLET ==================== */}
          {step === 1 && (
            <>
              {/* Montant FCFA + conversion USDT */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
                <div className="text-yellow-800 text-sm font-semibold mb-1">Montant à investir</div>
                <div className="text-gray-900 text-2xl font-bold">{amount?.toLocaleString()} FCFA</div>
                {opportunityName && (
                  <div className="text-yellow-600 text-xs mt-1">{opportunityName}</div>
                )}

                {/* Conversion USDT */}
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  {loadingRate ? (
                    <div className="flex items-center gap-2 text-yellow-600 text-sm">
                      <Loader2 className="animate-spin" size={14} />
                      <span>Calcul du montant USDT...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-yellow-800 text-xs font-medium">Montant à envoyer</div>
                          <div className="text-gray-900 text-xl font-bold">
                            ≈ {convertedAmount} USDT
                          </div>
                        </div>
                        <button
                          onClick={fetchUSDTRate}
                          className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-lg transition-colors"
                          title="Rafraîchir le taux"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                      <div className="text-yellow-600 text-[10px] mt-1">
                        Taux : 1 USDT ≈ {usdtRate?.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                        {rateError && ' (taux estimé)'}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {loadingWallets ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Chargement des adresses...
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="text-gray-300 mx-auto mb-3" size={40} />
                  <p className="text-gray-500 text-sm">Aucune adresse crypto disponible pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm font-medium">Choisissez un réseau :</p>
                  {wallets.map((wallet) => (
                    <button
                      key={wallet._id}
                      onClick={() => { setSelectedWallet(wallet); setStep(2); setError(null); }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${getNetworkColor(wallet.network)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm">{wallet.label}</div>
                          <div className="text-xs mt-0.5 opacity-70 font-mono truncate max-w-[250px]">
                            {wallet.address}
                          </div>
                        </div>
                        <Wallet size={20} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ==================== STEP 2: ENVOYER + UPLOAD ==================== */}
          {step === 2 && selectedWallet && (
            <>
              {/* Montant USDT à envoyer - bien visible */}
              <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 mb-5 text-center">
                <div className="text-green-700 text-sm font-medium mb-1">Montant à envoyer</div>
                <div className="text-green-700 text-4xl font-black">{convertedAmount} USDT</div>
                <div className="text-green-600 text-xs mt-2">
                  = {amount?.toLocaleString()} FCFA • Taux : 1 USDT ≈ {usdtRate?.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                </div>
              </div>

              {/* Adresse à copier */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5">
                <div className="text-gray-600 text-xs mb-2">Envoyez vos USDT à cette adresse ({selectedWallet.network}) :</div>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl p-3">
                  <code className="flex-1 text-sm text-gray-900 font-mono break-all">
                    {selectedWallet.address}
                  </code>
                  <button
                    onClick={copyAddress}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                      copied ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-yellow-600 text-xs">
                  <AlertCircle size={14} />
                  <span>Envoyez uniquement de l&apos;USDT sur le réseau <strong>{selectedWallet.network}</strong></span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
                <div className="text-blue-700 text-xs leading-relaxed">
                  <strong>1.</strong> Copiez l&apos;adresse ci-dessus<br />
                  <strong>2.</strong> Envoyez <strong>{convertedAmount} USDT</strong> depuis votre wallet ou exchange<br />
                  <strong>3.</strong> Faites une capture d&apos;écran de la confirmation<br />
                  <strong>4.</strong> Uploadez la capture ci-dessous et envoyez
                </div>
              </div>

              {/* Montant USDT envoyé */}
              <div className="mb-4">
                <label className="text-gray-600 text-sm mb-1 block">Montant USDT envoyé</label>
                <input
                  type="number"
                  value={amountUSDT}
                  onChange={(e) => setAmountUSDT(e.target.value)}
                  placeholder="Ex: 83.33"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900 text-lg font-bold"
                />
                <div className="text-gray-400 text-[10px] mt-1">
                  Montant recommandé : {convertedAmount} USDT
                </div>
              </div>

              {/* Hash transaction (optionnel) */}
              <div className="mb-4">
                <label className="text-gray-600 text-sm mb-1 block">Hash de transaction (optionnel)</label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none text-gray-900 font-mono text-sm"
                />
              </div>

              {/* Upload capture */}
              <div className="mb-5">
                <label className="text-gray-600 text-sm mb-2 block">
                  Capture d&apos;écran du paiement <span className="text-red-500">*</span>
                </label>
                {proofPreview ? (
                  <div className="relative">
                    <img src={proofPreview} alt="Capture" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                    <button
                      onClick={() => { setProofFile(null); setProofPreview(null); }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                      <Check size={12} />
                      Capture ajoutée
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-yellow-400 hover:bg-yellow-50/30 transition-all">
                      <Upload className="text-gray-400 mx-auto mb-2" size={32} />
                      <p className="text-gray-600 text-sm font-medium">Cliquez pour uploader</p>
                      <p className="text-gray-400 text-xs mt-1">PNG, JPG — Max 10 Mo</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Bouton soumettre */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !proofFile}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Envoi en cours...
                  </span>
                ) : (
                  `J'ai envoyé ${amountUSDT || convertedAmount} USDT`
                )}
              </button>
            </>
          )}

          {/* ==================== STEP 3: SUCCÈS ==================== */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h3 className="text-gray-900 text-xl font-bold mb-2">Paiement soumis !</h3>
              <p className="text-gray-500 text-sm mb-4">
                Votre paiement de <strong>{amountUSDT || convertedAmount} USDT</strong> ({amount?.toLocaleString()} FCFA) est en cours de vérification.
                Vous serez notifié dès qu&apos;il sera validé.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-center gap-2 text-yellow-700 text-sm">
                  <Clock size={16} />
                  <span>Délai de validation : généralement moins de 24h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}