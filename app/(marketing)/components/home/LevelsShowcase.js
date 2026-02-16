// app/(marketing)/components/home/LevelsShowcase.jsx
'use client';

import Link from 'next/link';
import { TrendingUp, Star, Crown, Gem, ArrowRight, Lock } from 'lucide-react';

export default function LevelsShowcase() {
  const levels = [
    {
      level: 1,
      name: 'Niveau 1',
      rate: '8-10%',
      bonus: '0%',
      deadline: '3 semaines',
      features: ['Accès aux 3 marchés', 'Gains en temps réel', 'Retrait tous les 3 jours'],
      iconBg: 'bg-gray-900',
      cardBg: 'bg-gray-100',
      border: 'border-gray-200',
      active: true
    },
    {
      level: 2,
      name: 'Niveau 2',
      rate: '13-15%',
      bonus: '+5%',
      deadline: '2 semaines',
      features: ['+5% bonus sur vos taux', '10% de commission affiliés', '10,000 F de bonus par filleul'],
      iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      cardBg: 'bg-yellow-50',
      border: 'border-yellow-300',
      highlight: true
    },
    {
      level: '3+',
      name: 'Niveau 3+',
      rate: '18-20%',
      bonus: '+10%',
      deadline: '2 semaines',
      features: ['+10% bonus sur vos taux', 'Commissions illimitées', 'Bonus 100% retirable au niv. 10'],
      iconBg: 'bg-gradient-to-br from-gray-800 to-black',
      cardBg: 'bg-gray-50',
      border: 'border-gray-200'
    }
  ];

  return (
    <section id="niveaux" className="py-24 lg:py-32 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2 mb-6">
            <Gem size={14} className="text-yellow-600" />
            <span className="text-yellow-700 text-sm font-medium">Système de niveaux</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            Plus vous progressez,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">plus vous gagnez</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Tout le monde commence au niveau 1. Investissez et parrainez pour débloquer des taux plus élevés.
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          {levels.map((lvl, i) => (
            <div key={i} className="relative flex gap-6 lg:gap-10">
              
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-12 h-12 ${lvl.iconBg} rounded-2xl flex items-center justify-center shadow-lg z-10`}>
                  <span className="text-white font-black text-sm">{lvl.level}</span>
                </div>
                {i < levels.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-300 to-gray-200 my-2" />
                )}
              </div>

              {/* Content card */}
              <div className={`flex-1 mb-10 ${lvl.cardBg} border ${lvl.border} ${lvl.highlight ? 'shadow-lg shadow-yellow-500/10' : ''} rounded-3xl p-6 lg:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-gray-900 text-xl font-bold">{lvl.name}</h3>
                      {lvl.active && (
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-green-700 text-xs font-medium">Vous commencez ici</span>
                        </div>
                      )}
                      {!lvl.active && (
                        <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                          <Lock size={10} className="text-gray-500" />
                          <span className="text-gray-500 text-xs font-medium">À débloquer</span>
                        </div>
                      )}
                    </div>
                    <div className="text-gray-500 text-sm">Objectif : atteindre la cagnotte en {lvl.deadline}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{lvl.rate}</div>
                    <div className="text-gray-500 text-xs">par semaine</div>
                  </div>
                </div>

                {/* Bonus badge */}
                {lvl.bonus !== '0%' && (
                  <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 mb-4">
                    <TrendingUp size={14} className="text-green-600" />
                    <span className="text-green-700 text-sm font-bold">{lvl.bonus} de bonus sur vos taux</span>
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {lvl.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="flex-shrink-0">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-gray-700 text-xs font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Final - Niveau 20 + CTA unique */}
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown size={20} className="text-white" />
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-3xl p-6 lg:p-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-gray-900 text-xl font-bold mb-1">Niveau 20 — Maximum</h3>
                  <p className="text-gray-600 text-sm">Bonus retirable à 100% • Taux maximum • Revenus illimités</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA unique */}
          <div className="text-center mt-12">
            <Link href="/auth/register"
              className="group inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all hover:shadow-2xl hover:shadow-gray-900/20 active:scale-[0.98]">
              Commencer au niveau 1
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-gray-500 text-sm mt-4">Inscription gratuite • Investissement dès 10,000 FCFA</p>
          </div>
        </div>
      </div>
    </section>
  );
}