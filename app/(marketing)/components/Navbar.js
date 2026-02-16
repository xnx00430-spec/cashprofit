// app/(marketing)/components/Navbar.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-gray-900">
              Cash<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">Profit</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#comment-ca-marche" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Comment ça marche
            </a>
            <a href="#niveaux" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Niveaux
            </a>
            <a href="#parrainage" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Parrainage
            </a>
            <a href="#securite" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Sécurité
            </a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
              Connexion
            </Link>
            <Link href="/auth/register" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-gray-900/20 active:scale-95">
              Commencer maintenant
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-900">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
          <div className="px-6 py-6 space-y-4">
            <a href="#comment-ca-marche" onClick={() => setMobileOpen(false)} className="block text-gray-700 font-medium py-2">Comment ça marche</a>
            <a href="#niveaux" onClick={() => setMobileOpen(false)} className="block text-gray-700 font-medium py-2">Niveaux</a>
            <a href="#parrainage" onClick={() => setMobileOpen(false)} className="block text-gray-700 font-medium py-2">Parrainage</a>
            <a href="#securite" onClick={() => setMobileOpen(false)} className="block text-gray-700 font-medium py-2">Sécurité</a>
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <Link href="/auth/login" className="block text-center text-gray-700 font-semibold py-3 rounded-xl border border-gray-200">
                Connexion
              </Link>
              <Link href="/auth/register" className="block text-center bg-gray-900 text-white font-semibold py-3 rounded-xl">
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}