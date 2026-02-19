// app/(marketing)/components/home/LevelsShowcase.jsx
'use client';

import Link from 'next/link';
import { TrendingUp, Star, Crown, Gem, ArrowRight, Lock, Users, Gift, Wallet } from 'lucide-react';

export default function LevelsShowcase() {
  const levels = [
    {
      level: 1,
      name: 'Débutant',
      rate: '8-10%',
      bonus: null,
      deadline: '3 semaines',
      description: 'Vous démarrez ici dès votre premier investissement. Vos gains commencent immédiatement et s\'affichent en temps réel sur votre téléphone.',
      features: [
        'Accès à toutes les opportunités d\'investissement',
        'Vos gains apparaissent en direct, seconde par seconde',
        'Retirez vos bénéfices à tout moment dès 1,000 FCFA',
        'Support disponible 7j/7 pour vous accompagner'
      ],
      iconBg: 'bg-gray-900',
      cardBg: 'bg-gray-100',
      border: 'border-gray-200',
      active: true
    },
    {
      level: 2,
      name: 'Confirmé',
      rate: '13-15%',
      bonus: '+5%',
      deadline: '2 semaines',
      description: 'Vous gagnez plus et vous commencez à toucher de l\'argent grâce à vos proches. Chaque personne que vous invitez vous rapporte de l\'argent automatiquement.',
      features: [
        'Vos taux augmentent de 5% : vous gagnez plus chaque semaine',
        'Vous recevez 10% des bénéfices de chaque personne que vous invitez',
        'Bonus de 10,000 FCFA pour chaque ami qui investit',
        'Votre capital est retirable dès ce niveau'
      ],
      iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      cardBg: 'bg-yellow-50',
      border: 'border-yellow-300',
      highlight: true
    },
    {
      level: '3-20',
      name: 'Expert',
      rate: '18-20%',
      bonus: '+10%',
      deadline: '2 semaines',
      description: 'Vous êtes au maximum de vos gains. Votre argent travaille à pleine puissance et votre réseau vous génère des revenus passifs tous les jours.',
      features: [
        'Taux maximum : jusqu\'à 20% de rendement par semaine',
        'Commissions illimitées sur tous vos affiliés',
        'À partir du niveau 10, votre bonus est 100% retirable',
        'Vous continuez à monter jusqu\'au niveau 20'
      ],
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
            Plus vous avancez,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">plus vous gagnez</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Tout le monde commence au niveau 1. Invitez vos proches et montez de niveau pour gagner encore plus d&apos;argent chaque semaine.
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
                <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-gray-900 text-xl font-bold">Niveau {lvl.level} — {lvl.name}</h3>
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
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{lvl.rate}</div>
                    <div className="text-gray-500 text-xs">par semaine</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{lvl.description}</p>

                {/* Bonus badge */}
                {lvl.bonus && (
                  <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 mb-4">
                    <TrendingUp size={14} className="text-green-600" />
                    <span className="text-green-700 text-sm font-bold">{lvl.bonus} de bonus sur tous vos gains</span>
                  </div>
                )}

                {/* Objectif */}
                <div className="bg-white/70 border border-gray-200 rounded-xl px-4 py-2.5 mb-4">
                  <span className="text-gray-500 text-xs">Pour passer au niveau suivant : faites investir vos affiliés pour atteindre la cagnotte en </span>
                  <span className="text-gray-900 text-xs font-bold">{lvl.deadline}</span>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {lvl.features.map((feat, j) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="flex-shrink-0 mt-1.5">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-gray-700 text-sm">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Final - Niveau 20 */}
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown size={20} className="text-white" />
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-3xl p-6 lg:p-8">
              <h3 className="text-gray-900 text-xl font-bold mb-2">Niveau 20 — Le sommet</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Vous avez atteint le maximum. Vos taux sont au plus haut, votre bonus est entièrement retirable, et votre réseau vous rapporte de l&apos;argent tous les jours sans rien faire.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/auth/register"
              className="group inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all hover:shadow-2xl hover:shadow-gray-900/20 active:scale-[0.98]">
              Commencer maintenant
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-gray-500 text-sm mt-4">Inscription gratuite • À partir de 10,000 FCFA</p>
          </div>
        </div>
      </div>
    </section>
  );
}