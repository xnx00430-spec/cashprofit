'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import Script from 'next/script';

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
  const [config, setConfig] = useState(null);
  const sdkLoaded = useRef(false);
  const listenerAttached = useRef(false);

  // Récupérer la config au montage
  useEffect(() => {
    fetch('/api/config/kkiapay')
      .then(r => r.json())
      .then(setConfig)
      .catch(err => console.error('Erreur fetch config:', err));
  }, []);

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
    if (!config) {
      onError?.('Configuration non chargée. Veuillez réessayer.');
      return;
    }
    if (typeof window !== 'undefined' && window.openKkiapayWidget) {
      window.openKkiapayWidget({
        amount: amount,
        key: config.publicKey,
        sandbox: config.sandbox,
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
        disabled={disabled || !amount || amount < 1000 || !config}
        className={className}
      >
        {children || `Payer ${amount?.toLocaleString() || ''} FCFA`}
      </button>
    </>
  );
}