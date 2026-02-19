// app/(marketing)/components/home/CTASection.jsx
'use client';

import Link from 'next/link';
import { ArrowRight, Rocket } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2.5rem] p-12 lg:p-20 overflow-hidden">
          
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          <div className="relative text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl mb-8 shadow-lg shadow-yellow-500/20">
              <Rocket size={28} className="text-white" />
            </div>

            <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
              Votre argent peut<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
                travailler pour vous
              </span>
            </h2>

            <p className="text-gray-400 text-lg lg:text-xl mb-4 max-w-xl mx-auto">
              Des milliers de personnes gagnent de l&apos;argent chaque semaine avec CashProfit. Vous pouvez commencer aujourd&apos;hui avec seulement <span className="text-white font-semibold">10,000 FCFA</span>.
            </p>

            <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">
              L&apos;inscription est gratuite, ça prend 30 secondes, et vos gains commencent dès votre premier investissement.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register"
                className="group bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 px-10 py-5 rounded-2xl text-lg font-bold transition-all hover:shadow-2xl hover:shadow-yellow-500/20 active:scale-[0.98] flex items-center gap-3">
                Commencer maintenant
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/auth/login"
                className="text-gray-400 hover:text-white font-semibold px-8 py-5 transition-colors">
                J&apos;ai déjà un compte
              </Link>
            </div>

            {/* Mini stats */}
            <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-white/10">
              <div>
                <div className="text-white text-2xl font-black">26,000+</div>
                <div className="text-gray-500 text-xs">Personnes inscrites</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-white text-2xl font-black">2 Mrd+</div>
                <div className="text-gray-500 text-xs">FCFA de gains versés</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-white text-2xl font-black">24h</div>
                <div className="text-gray-500 text-xs">Pour recevoir vos gains</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}