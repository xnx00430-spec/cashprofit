// app/(marketing)/components/home/HowItWorks.jsx
'use client';

import { Wallet, TrendingUp, ArrowDownToLine, Check } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: Wallet,
      title: 'Déposez votre argent',
      description: 'Vous choisissez combien vous voulez investir et vous payez avec votre Mobile Money. C\'est rapide, sécurisé, et votre argent commence à travailler pour vous tout de suite.',
      details: [
        'À partir de 10,000 FCFA seulement',
        'Paiement par Orange Money, MTN, Wave ou Moov',
        'Votre investissement est activé immédiatement',
        'Zéro frais, vous investissez 100% de votre montant'
      ],
      color: 'from-yellow-400 to-amber-500',
      bgLight: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      accentText: 'text-yellow-700',
      accentBg: 'bg-yellow-100'
    },
    {
      step: '02',
      icon: TrendingUp,
      title: 'Votre argent grandit',
      description: 'Chaque seconde, vous gagnez de l\'argent. Vous pouvez suivre vos gains en direct depuis votre téléphone, jour et nuit, même quand vous dormez.',
      details: [
        'Vous gagnez entre 10% et 20% par semaine',
        'Vos gains s\'affichent en temps réel',
        'Plus vous montez de niveau, plus vous gagnez',
        'Invitez vos proches et gagnez 10% sur leurs bénéfices'
      ],
      color: 'from-green-400 to-emerald-500',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200',
      accentText: 'text-green-700',
      accentBg: 'bg-green-100'
    },
    {
      step: '03',
      icon: ArrowDownToLine,
      title: 'Récupérez vos gains',
      description: 'Quand vous voulez retirer, c\'est simple : vous demandez et l\'argent arrive directement sur votre Mobile Money. Pas de délai, pas de complications.',
      details: [
        'Retrait possible dès 1,000 FCFA',
        'Retirez à tout moment, quand vous voulez',
        'L\'argent arrive sur votre compte en moins de 24h',
        'Vérification d\'identité rapide et automatique'
      ],
      color: 'from-blue-400 to-blue-500',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200',
      accentText: 'text-blue-700',
      accentBg: 'bg-blue-100'
    }
  ];

  return (
    <section id="comment-ca-marche" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-6">
            <span className="text-gray-600 text-sm font-medium">Simple & rapide</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            Comment ça marche ?
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            En 3 étapes, vous commencez à gagner de l&apos;argent. C&apos;est simple, tout se fait depuis votre téléphone.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="group relative">
              {i < 2 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gray-200 z-0" />
              )}
              
              <div className={`relative ${step.bgLight} border ${step.borderColor} rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full`}>
                <div className="text-gray-200 text-7xl font-black absolute top-4 right-6 select-none">
                  {step.step}
                </div>
                
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg relative z-10`}>
                  <step.icon size={28} className="text-white" />
                </div>

                <h3 className="text-gray-900 text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-5">{step.description}</p>

                <div className="space-y-2.5">
                  {step.details.map((detail, j) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 ${step.accentBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check size={12} className={step.accentText} strokeWidth={3} />
                      </div>
                      <span className="text-gray-700 text-sm">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}