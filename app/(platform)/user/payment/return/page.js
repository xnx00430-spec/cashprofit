'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

function PaymentReturnInner() {
  const searchParams = useSearchParams();
  const depositId = searchParams.get('depositId');
  
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 20;

  useEffect(() => {
    if (!depositId) {
      setStatus('failed');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/status?depositId=${depositId}`);
        const data = await res.json();

        if (data.status === 'completed') {
          setStatus('success');
          return;
        }
        
        if (data.status === 'failed') {
          setStatus('failed');
          return;
        }

        setAttempts(prev => {
          const next = prev + 1;
          if (next >= maxAttempts) {
            setStatus('pending');
            return next;
          }
          return next;
        });
      } catch (error) {
        console.error('Erreur vérification statut:', error);
      }
    };

    if (status === 'checking') {
      checkStatus();
      const interval = setInterval(() => {
        if (status === 'checking') checkStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [depositId, status, attempts]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-50 border-2 border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="text-yellow-500 animate-spin" size={36} />
          </div>
          <h1 className="text-gray-900 text-2xl font-bold mb-3">Vérification du paiement...</h1>
          <p className="text-gray-600 mb-4">Nous vérifions votre paiement auprès de l&apos;opérateur. Veuillez patienter.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="text-yellow-700 text-sm">Tentative {attempts}/{maxAttempts}</div>
            <div className="w-full bg-yellow-200 h-2 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${(attempts / maxAttempts) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={36} />
          </div>
          <h1 className="text-gray-900 text-2xl font-bold mb-3">Paiement confirmé ! 🎉</h1>
          <p className="text-gray-600 mb-6">Votre investissement a été activé avec succès. Vos bénéfices commencent à s&apos;accumuler dès maintenant.</p>
          <Link href="/user"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-md">
            Voir mon dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-500" size={36} />
          </div>
          <h1 className="text-gray-900 text-2xl font-bold mb-3">Paiement échoué</h1>
          <p className="text-gray-600 mb-6">Le paiement n&apos;a pas abouti. Aucun montant n&apos;a été débité de votre compte.</p>
          <Link href="/user/investir"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-md">
            Réessayer
          </Link>
        </div>
      </div>
    );
  }

  // status === 'pending'
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-yellow-50 border-2 border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="text-yellow-500" size={36} />
        </div>
        <h1 className="text-gray-900 text-2xl font-bold mb-3">Paiement en cours de traitement</h1>
        <p className="text-gray-600 mb-6">Votre paiement est en cours de traitement par l&apos;opérateur. Il apparaîtra sur votre dashboard dès confirmation.</p>
        <Link href="/user"
          className="inline-block bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-md">
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-900">Chargement...</div></div>}>
      <PaymentReturnInner />
    </Suspense>
  );
}