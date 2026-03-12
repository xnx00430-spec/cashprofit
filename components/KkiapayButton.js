// components/KkiapayButton.jsx
'use client';

import { useEffect, useCallback, useRef } from 'react';
import Script from 'next/script';

/**
 * Bouton de paiement KkiaPay avec pré-remplissage des données utilisateur
 * 
 * Usage:
 * <KkiapayButton
 *   amount={50000}
 *   opportunityId="abc123"
 *   opportunityName="Or Premium"
 *   customerName="Kouadio Jean"
 *   customerEmail="jean@email.com"
 *   customerPhone="0700000000"
 *   onSuccess={(data) => router.push('/user')}
 *   onError={(msg) => setError(msg)}
 *   className="bg-yellow-400 text-black font-bold py-4 rounded-xl w-full"
 * >
 *   Investir 50,000 FCFA
 * </KkiapayButton>
 */
export default function KkiapayButton({
  amount,
  opportunityId,
  opportunityName,
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  onSuccess,
  onError,
  onLoading,
  disabled = false,
  className = '',
  children
}) {
  const sdkLoaded = useRef(false);
  const listenerAttached = useRef(false);

  const handlePaymentSuccess = useCallback(async (response) => {
    const transactionId = response.transactionId;
    console.log('💳 KkiaPay success, transactionId:', transactionId);

    onLoading?.(true);

    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, opportunityId, amount }),
      });

      const data = await res.json();

      if (data.success) {
        console.log('✅ Investment created:', data.investmentId);
        onSuccess?.(data);
      } else {
        console.error('❌ Verify failed:', data.message);
        onError?.(data.message || 'Erreur lors de la vérification du paiement');
      }
    } catch (err) {
      console.error('❌ Verify error:', err);
      onError?.(err.message || 'Erreur réseau. Votre paiement sera traité automatiquement.');
    } finally {
      onLoading?.(false);
    }
  }, [amount, opportunityId, onSuccess, onError, onLoading]);

  // Attacher le listener une fois le SDK chargé
  useEffect(() => {
    if (typeof window !== 'undefined' && window.addSuccessListener && !listenerAttached.current) {
      window.addSuccessListener(handlePaymentSuccess);
      listenerAttached.current = true;
    }

    return () => {
      if (typeof window !== 'undefined' && window.removeKkiapayListener) {
        window.removeKkiapayListener('success', handlePaymentSuccess);
        listenerAttached.current = false;
      }
    };
  }, [handlePaymentSuccess]);

  const handleScriptLoad = () => {
    sdkLoaded.current = true;
    if (window.addSuccessListener && !listenerAttached.current) {
      window.addSuccessListener(handlePaymentSuccess);
      listenerAttached.current = true;
    }
  };

  const openPayment = () => {
    if (typeof window !== 'undefined' && window.openKkiapayWidget) {
      window.openKkiapayWidget({
        amount: amount,
        key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY,
        sandbox: process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX === 'true',
        theme: '#f0b90b',
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        reason: `Investissement ${opportunityName || ''} - ${amount?.toLocaleString()} FCFA`,
        paymentmethod: ['momo', 'card'],
        countries: ['CI'],
      });
    } else {
      onError?.('Le widget de paiement n\'est pas encore chargé. Veuillez réessayer.');
    }
  };

  return (
    <>
      <Script
        src="https://cdn.kkiapay.me/k.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <button
        type="button"
        onClick={openPayment}
        disabled={disabled || !amount || amount < 1000}
        className={className}
      >
        {children || `Payer ${amount?.toLocaleString() || ''} FCFA`}
      </button>
    </>
  );
}