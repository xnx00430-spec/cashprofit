// app/(marketing)/components/home/HeroSection.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Shield, TrendingUp, Users } from 'lucide-react';

function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return <span>{prefix}{count.toLocaleString('fr-FR')}{suffix}</span>;
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      
      {/* Background subtil */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-yellow-50 via-amber-50/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-gray-50 to-transparent rounded-full blur-3xl" />
        {/* Grille subtile */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT - Texte */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700 text-sm font-medium">+3,200 investisseurs actifs</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[0.95] mb-6 tracking-tight">
              Investissez.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600">
                Profitez.
              </span>
              <br />
              Chaque semaine.
            </h1>

            <p className="text-gray-600 text-lg lg:text-xl leading-relaxed mb-10 max-w-lg">
              Placez votre argent sur des marchés rentables et recevez jusqu'à 
              <span className="text-gray-900 font-bold"> 18% de bénéfices par semaine</span>. 
              Vos gains s'affichent en temps réel.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/auth/register"
                className="group bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:shadow-2xl hover:shadow-gray-900/20 active:scale-[0.98] flex items-center justify-center gap-3">
                Commencer à investir
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#comment-ca-marche"
                className="group bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center gap-3">
                Comment ça marche
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Shield size={16} className="text-green-600" />
                <span>Capital protégé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <TrendingUp size={16} className="text-green-600" />
                <span>Gains en temps réel</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Users size={16} className="text-green-600" />
                <span>Retrait sous 48h</span>
              </div>
            </div>
          </div>

          {/* RIGHT - Visual Card */}
          <div className="relative">
            {/* Card principale */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2rem] p-8 shadow-2xl shadow-gray-900/30 border border-gray-700/50">
              
              {/* Header card */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-gray-500 text-sm mb-1">Solde Total</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-medium">Live</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  CP
                </div>
              </div>

              {/* Montant */}
              <div className="mb-8">
                <div className="text-white text-5xl font-black tracking-tight mb-1">
                  <AnimatedCounter end={847293} prefix="" suffix="" />
                </div>
                <div className="text-gray-500 text-xl">FCFA</div>
              </div>

              {/* Gains live */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Bénéfices cette semaine</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs">LIVE</span>
                  </div>
                </div>
                <div className="text-green-400 text-3xl font-bold font-mono">
                  +<AnimatedCounter end={67450} duration={2500} />
                </div>
                <div className="text-gray-500 text-sm mt-1">FCFA</div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-yellow-400 text-lg font-bold">8%</div>
                  <div className="text-gray-500 text-[10px]">Min/sem</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-yellow-400 text-lg font-bold">18%</div>
                  <div className="text-gray-500 text-[10px]">Max/sem</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-yellow-400 text-lg font-bold">48h</div>
                  <div className="text-gray-500 text-[10px]">Retrait</div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-green-500/30 text-sm font-bold animate-bounce">
              +12,000 F/jour
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-lg">
              <div className="text-gray-500 text-xs mb-0.5">Investisseurs</div>
              <div className="text-gray-900 text-lg font-black"><AnimatedCounter end={3248} /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}