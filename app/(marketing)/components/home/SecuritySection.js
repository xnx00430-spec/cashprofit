// app/(marketing)/components/home/SecuritySection.jsx
'use client';

import { Shield, Lock, Eye, RefreshCw, CheckCircle } from 'lucide-react';

export default function SecuritySection() {
  const guarantees = [
    {
      icon: Shield,
      title: 'Capital protégé',
      description: 'Votre capital est garanti par un fonds de réserve. En cas de baisse du marché, votre investissement est couvert à 100%.',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      icon: Lock,
      title: 'Données sécurisées',
      description: 'Vos informations personnelles et financières sont protégées par un chiffrement de niveau bancaire.',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      icon: Eye,
      title: 'Transparence totale',
      description: 'Suivez vos bénéfices en temps réel. Chaque centime est traçable sur votre tableau de bord.',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    {
      icon: RefreshCw,
      title: 'Retrait garanti',
      description: 'Retirez vos bénéfices à tout moment. Transfert sous 24 à 48 heures sur votre Mobile Money.',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <section id="securite" className="py-24 lg:py-32 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-6">
            <Shield size={14} className="text-green-600" />
            <span className="text-green-700 text-sm font-medium">Sécurité & confiance</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            Investissez l'esprit <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">tranquille</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Votre sécurité est notre priorité absolue. Nous mettons tout en œuvre pour protéger votre investissement.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {guarantees.map((item, i) => (
            <div key={i} className={`${item.color} border rounded-3xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <item.icon size={24} className={item.iconColor} />
                </div>
                <div>
                  <h3 className="text-gray-900 text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-16 bg-white border border-gray-200 rounded-3xl p-8 max-w-3xl mx-auto shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <span className="text-gray-900 font-semibold">Risque 0% garanti</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <span className="text-gray-900 font-semibold">Experts certifiés</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <span className="text-gray-900 font-semibold">Support 7j/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}