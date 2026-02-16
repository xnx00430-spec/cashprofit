'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole = 'user' }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Appeler l'API /me pour vérifier l'authentification
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Important pour envoyer les cookies
        });

        if (!response.ok) {
          // Non authentifié
          router.push('/auth/login');
          return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
          router.push('/auth/login');
          return;
        }

        // Vérifier le rôle
        if (requiredRole === 'admin' && data.user.role !== 'admin') {
          // User essaie d'accéder à admin
          router.push('/user');
          return;
        }

        if (requiredRole === 'user' && data.user.role === 'admin') {
          // Admin peut accéder aux routes user (optionnel)
          setIsAuthorized(true);
        } else if (data.user.role === requiredRole) {
          setIsAuthorized(true);
        } else {
          router.push('/auth/login');
          return;
        }

      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#f0b90b] mx-auto mb-4" />
          <p className="text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; 
  }

  return <>{children}</>;
}
