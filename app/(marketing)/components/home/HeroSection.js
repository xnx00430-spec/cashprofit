// app/(marketing)/components/home/HeroSection.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, Users, Zap } from 'lucide-react';

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 800);
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

  return <span>{count.toLocaleString('fr-FR')}{suffix}</span>;
}

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.3); }
          50% { box-shadow: 0 0 40px rgba(250, 204, 21, 0.6); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-fadeUp { animation: fadeUp 0.8s ease-out forwards; }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        .animate-slideInRight { animation: slideInRight 0.8s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulseGlow { animation: pulseGlow 2s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #facc15 0%, #fbbf24 25%, #ffffff 50%, #fbbf24 75%, #facc15 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
        .delay-1000 { animation-delay: 1s; }
        .delay-1200 { animation-delay: 1.2s; }
      `}</style>

      {/* ===== IMAGE DE FOND ===== */}
      <div className="absolute inset-0">
        <img 
          src="https://res.cloudinary.com/dzird4mfe/image/upload/v1771278938/CashProfit_Publication_Facebook_1_lqyafq.png"
          alt="CashProfit"
          className="w-full h-full object-cover object-[center_20%] sm:object-[center_15%]"
          onLoad={() => setLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/10 lg:hidden" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 hidden lg:block" style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.3)' }} />
      </div>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <div className="relative z-10 flex-1 flex flex-col justify-end lg:justify-center max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pb-8 lg:pb-0 pt-28 lg:pt-32">
        <div className="max-w-2xl">
          
          {/* Badge live */}
          <div className={`inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2.5 mb-6 opacity-0 ${loaded ? 'animate-fadeUp delay-100' : ''}`}>
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
            </div>
            <span className="text-white text-sm font-semibold tracking-wide"><AnimatedCounter end={26000} /> personnes inscrites</span>
          </div>

          {/* TITRE */}
          <h1 className={`mb-6 opacity-0 ${loaded ? 'animate-fadeUp delay-200' : ''}`}>
            <span className="block text-[2.75rem] sm:text-6xl lg:text-[5.5rem] font-black text-white leading-[0.9] tracking-tight">
              Investissez.
            </span>
            <span className="block text-[2.75rem] sm:text-6xl lg:text-[5.5rem] font-black leading-[0.9] tracking-tight mt-1 shimmer-text">
              Gagnez.
            </span>
            <span className="block text-[2.75rem] sm:text-6xl lg:text-[5.5rem] font-black text-white leading-[0.9] tracking-tight mt-1">
              Chaque semaine.
            </span>
          </h1>

          {/* Sous-titre */}
          <p className={`text-white/70 text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-lg opacity-0 ${loaded ? 'animate-fadeUp delay-400' : ''}`}>
            Placez votre argent et gagnez jusqu&apos;à{' '}
            <span className="text-yellow-400 font-extrabold">20% par semaine</span>.
            Vos gains s&apos;affichent en direct sur votre téléphone, même quand vous dormez.
          </p>

          {/* CTA */}
          <div className={`flex flex-col sm:flex-row gap-3 mb-8 opacity-0 ${loaded ? 'animate-fadeUp delay-500' : ''}`}>
            <Link href="/auth/register"
              className="group relative bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-black transition-all hover:shadow-2xl hover:shadow-yellow-500/40 active:scale-[0.97] flex items-center justify-center gap-3 animate-pulseGlow overflow-hidden">
              <span className="relative z-10 flex items-center gap-3">
                Commencer maintenant
                <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
              </span>
            </Link>
            <a href="#comment-ca-marche"
              className="group bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white px-8 py-4 sm:py-5 rounded-2xl text-lg font-semibold border border-white/20 hover:border-white/40 transition-all flex items-center justify-center gap-2">
              Comment ça marche
            </a>
          </div>

          {/* STATS */}
          <div className={`grid grid-cols-3 gap-2 sm:gap-3 mb-6 opacity-0 ${loaded ? 'animate-fadeUp delay-600' : ''}`}>
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-5 text-center hover:bg-white/15 transition-all hover:scale-[1.02]">
              <div className="text-yellow-400 text-2xl sm:text-4xl font-black leading-none">20%</div>
              <div className="text-white/40 text-[10px] sm:text-xs font-medium mt-1.5 uppercase tracking-wider">par semaine</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-5 text-center hover:bg-white/15 transition-all hover:scale-[1.02]">
              <div className="text-green-400 text-2xl sm:text-4xl font-black leading-none">24h</div>
              <div className="text-white/40 text-[10px] sm:text-xs font-medium mt-1.5 uppercase tracking-wider">pour retirer</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-5 text-center hover:bg-white/15 transition-all hover:scale-[1.02]">
              <div className="text-white text-2xl sm:text-4xl font-black leading-none">10K</div>
              <div className="text-white/40 text-[10px] sm:text-xs font-medium mt-1.5 uppercase tracking-wider">pour commencer</div>
            </div>
          </div>

          {/* Trust row */}
          <div className={`flex flex-wrap items-center gap-4 sm:gap-6 opacity-0 ${loaded ? 'animate-fadeUp delay-700' : ''}`}>
            <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm">
              <Shield size={14} className="text-green-400" />
              <span>Votre argent est protégé</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm">
              <TrendingUp size={14} className="text-green-400" />
              <span>Gains en temps réel</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm">
              <Zap size={14} className="text-yellow-400" />
              <span>Inscription en 30 secondes</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FLOATING CARD - Gains live ===== */}
      <div className={`hidden lg:block absolute top-36 right-12 z-20 opacity-0 ${loaded ? 'animate-slideInRight delay-1000' : ''}`}>
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl px-6 py-5 shadow-2xl animate-float">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-green-400" />
            </div>
            <div>
              <div className="text-white/50 text-xs font-medium uppercase tracking-wider">Gains cette semaine</div>
              <div className="text-green-400 text-2xl font-black">+<AnimatedCounter end={67450} duration={2500} /> F</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FLOATING CARD - Communauté ===== */}
      <div className={`hidden lg:block absolute bottom-28 right-20 z-20 opacity-0 ${loaded ? 'animate-slideInRight delay-1200' : ''}`}>
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl px-6 py-4 shadow-2xl animate-float" style={{ animationDelay: '1.5s' }}>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-black text-gray-900">AK</div>
              <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-black text-white">FM</div>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-black text-white">OD</div>
              <div className="w-9 h-9 bg-white/20 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-bold text-white">+99</div>
            </div>
            <div>
              <div className="text-white text-sm font-bold">Des milliers de personnes nous font confiance</div>
              <div className="text-white/50 text-xs"><AnimatedCounter end={26000} />+ inscrits</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SCROLL INDICATOR ===== */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-2">
        <span className="text-white/30 text-[10px] uppercase tracking-[0.2em]">Défiler</span>
        <div className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}