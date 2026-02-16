// app/(marketing)/components/home/HowItWorks.jsx
'use client';

import { Wallet, TrendingUp, ArrowDownToLine } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: Wallet,
      title: 'Investissez',
      description: 'Choisissez une opportunité et investissez à partir de 10,000 FCFA. Paiement sécurisé par Mobile Money.',
      color: 'from-yellow-400 to-amber-500',
      bgLight: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      step: '02',
      icon: TrendingUp,
      title: 'Gagnez chaque seconde',
      description: 'Vos bénéfices s\'affichent en temps réel sur votre tableau de bord. Jusqu\'à 18% par semaine.',
      color: 'from-green-400 to-emerald-500',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      step: '03',
      icon: ArrowDownToLine,
      title: 'Retirez vos gains',
      description: 'Demandez un retrait en 2 clics. Vos bénéfices sont transférés sous 24 à 48 heures.',
      color: 'from-blue-400 to-blue-500',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200'
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
            Trois étapes simples pour commencer à générer des bénéfices dès aujourd'hui.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="group relative">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gray-200 z-0" />
              )}
              
              <div className={`relative ${step.bgLight} border ${step.borderColor} rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                {/* Step number */}
                <div className="text-gray-200 text-7xl font-black absolute top-4 right-6 select-none">
                  {step.step}
                </div>
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg relative z-10`}>
                  <step.icon size={28} className="text-white" />
                </div>

                <h3 className="text-gray-900 text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}