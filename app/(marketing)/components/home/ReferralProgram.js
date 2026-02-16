// app/(marketing)/components/home/ReferralProgram.jsx
'use client';

import Link from 'next/link';
import { Users, Gift, TrendingUp, Share2 } from 'lucide-react';

export default function ReferralProgram() {
  return (
    <section id="parrainage" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT - Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 lg:p-10">
              
              {/* Simulated referral tree */}
              <div className="text-center mb-8">
                <div className="text-gray-400 text-sm mb-3">Votre réseau</div>
                
                {/* You */}
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl px-6 py-3 mb-8">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">V</div>
                  <div className="text-left">
                    <div className="text-white font-bold">Vous</div>
                    <div className="text-white/70 text-xs">Niveau 2 • 13%/sem</div>
                  </div>
                </div>

                {/* Connector */}
                <div className="flex justify-center mb-4">
                  <div className="w-px h-8 bg-gray-700" />
                </div>

                {/* Referrals */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'Ali K.', gain: '+8,000 F', bonus: '10,000 F' },
                    { name: 'Fatou M.', gain: '+12,000 F', bonus: '10,000 F' },
                    { name: 'Omar D.', gain: '+5,000 F', bonus: '10,000 F' },
                  ].map((ref, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold mx-auto mb-2">
                        {ref.name[0]}
                      </div>
                      <div className="text-white text-xs font-medium mb-1">{ref.name}</div>
                      <div className="text-green-400 text-xs font-bold">{ref.gain}</div>
                      <div className="text-yellow-400 text-[10px]">{ref.bonus}</div>
                    </div>
                  ))}
                </div>

                {/* Total commissions */}
                <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
                  <div className="text-gray-400 text-sm mb-1">Vos commissions totales</div>
                  <div className="text-green-400 text-3xl font-black">+32,500 FCFA</div>
                  <div className="text-gray-500 text-xs mt-1">10% des bénéfices de vos 3 affiliés</div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-gray-900 px-5 py-3 rounded-2xl shadow-lg font-bold text-sm">
              🎁 30,000 F de bonus
            </div>
          </div>

          {/* RIGHT - Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
              <Share2 size={14} className="text-blue-600" />
              <span className="text-blue-700 text-sm font-medium">Programme de parrainage</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              Parrainez et gagnez 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600"> encore plus</span>
            </h2>

            <p className="text-gray-600 text-lg mb-10 leading-relaxed">
              Invitez vos proches à investir et profitez d'un double revenu : bonus instantané + commissions permanentes.
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Gift size={22} className="text-yellow-600" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-lg mb-1">10,000 FCFA de bonus</h4>
                  <p className="text-gray-600 text-sm">Par affilié qui investit. Crédité instantanément sur votre compte.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={22} className="text-green-600" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-lg mb-1">10% de commissions</h4>
                  <p className="text-gray-600 text-sm">Sur tous les bénéfices de vos affiliés. Tant qu'ils gagnent, vous gagnez.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users size={22} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-lg mb-1">Montez de niveau</h4>
                  <p className="text-gray-600 text-sm">Les investissements de vos affiliés comptent dans votre cagnotte de niveau.</p>
                </div>
              </div>
            </div>

            <Link href="/auth/register"
              className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:shadow-xl">
              Commencer à parrainer
              <Share2 size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}