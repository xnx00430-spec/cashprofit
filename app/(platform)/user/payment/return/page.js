// app/(platform)/user/payment/return/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const depositId = searchParams.get('depositId');
  const [status, setStatus] = useState('checking'); // checking, success, failed, pending
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!depositId) {
      setStatus('failed');
      return;
    }
    checkStatus();
  }, [depositId]);

  useEffect(() => {
    // Polling : revérifier toutes les 3 secondes si pas encore finalisé
    if (status === 'checking' || status === 'pending') {
      if (attempts >= 20) {
        // Après 60 secondes, on arrête
        setStatus('pending');
        return;
      }
      const timer = setTimeout(() => {
        checkStatus();
        setAttempts(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, attempts]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/payments/status?depositId=${depositId}`);
      const data = await res.json();

      if (data.success) {
        if (data.status === 'completed') {
          setStatus('success');
        } else if (data.status === 'failed') {
          setStatus('failed');
        } else {
          setStatus('checking');
        }
      } else {
        if (attempts > 5) setStatus('pending');
      }
    } catch (error) {
      console.error('Check status error:', error);
      if (attempts > 5) setStatus('pending');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        
        {/* CHECKING */}
        {status === 'checking' && (
          <div>
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="text-yellow-500 animate-spin" size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Vérification du paiement...</h1>
            <p className="text-gray-600 mb-8">Nous vérifions votre paiement, veuillez patienter quelques instants.</p>
            <div className="w-48 bg-gray-200 h-1.5 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full animate-pulse" style={{ width: `${Math.min(attempts * 5, 95)}%` }} />
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Paiement confirmé !</h1>
            <p className="text-gray-600 mb-8">
              Votre investissement est actif. Vos bénéfices commencent à s'accumuler dès maintenant.
            </p>
            <Link href="/user"
              className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-2xl transition-all">
              Voir mon tableau de bord
            </Link>
          </div>
        )}

        {/* FAILED */}
        {status === 'failed' && (
          <div>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="text-red-500" size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Paiement échoué</h1>
            <p className="text-gray-600 mb-8">
              Le paiement n'a pas pu être complété. Aucun montant n'a été débité. Vous pouvez réessayer.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/user"
                className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-2xl transition-all">
                Réessayer
              </Link>
              <Link href="/user"
                className="inline-block text-gray-600 hover:text-gray-900 font-semibold py-3 transition-colors">
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        )}

        {/* PENDING - timeout */}
        {status === 'pending' && (
          <div>
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="text-yellow-500" size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Paiement en cours de traitement</h1>
            <p className="text-gray-600 mb-8">
              Votre paiement est en cours de vérification. Il apparaîtra sur votre tableau de bord dès qu'il sera confirmé. Cela peut prendre quelques minutes.
            </p>
            <Link href="/user"
              className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-2xl transition-all">
              Aller au tableau de bord
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}