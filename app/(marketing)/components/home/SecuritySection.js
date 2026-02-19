// app/(marketing)/components/home/SecuritySection.jsx
'use client';

import { Shield, Lock, Eye, RefreshCw, CheckCircle } from 'lucide-react';

export default function SecuritySection() {
  const guarantees = [
    {
      icon: Shield,
      title: 'Votre argent est protégé',
      description: 'Votre investissement est sécurisé par un fonds de réserve. Même si le marché bouge, votre capital reste intact. Vous ne perdez jamais ce que vous avez investi.',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      icon: Lock,
      title: 'Vos données restent privées',
      description: 'Toutes vos informations personnelles, votre numéro de téléphone et vos données financières sont chiffrées. Personne ne peut y accéder à part vous.',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      icon: Eye,
      title: 'Tout est transparent',
      description: 'Vous voyez vos gains en temps réel sur votre tableau de bord. Chaque franc gagné est visible. Pas de surprises, pas de frais cachés.',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    {
      icon: RefreshCw,
      title: 'Retirez quand vous voulez',
      description: 'Vos bénéfices vous appartiennent. Demandez un retrait à tout moment et recevez votre argent sur votre Mobile Money en moins de 24 heures.',
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
            <span className="text-green-700 text-sm font-medium">Sécurité et confiance</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            Investissez l&apos;esprit <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">tranquille</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Nous savons que confier son argent demande de la confiance. C&apos;est pourquoi nous faisons tout pour que votre investissement soit en sécurité.
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
              <div>
                <span className="text-gray-900 font-semibold block">Capital garanti</span>
                <span className="text-gray-500 text-xs">Vous ne perdez jamais votre investissement</span>
              </div>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-200" />
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <span className="text-gray-900 font-semibold block">Retrait sous 24h</span>
                <span className="text-gray-500 text-xs">Directement sur votre Mobile Money</span>
              </div>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-200" />
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <span className="text-gray-900 font-semibold block">Support 7j/7</span>
                <span className="text-gray-500 text-xs">On est là pour vous aider</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}