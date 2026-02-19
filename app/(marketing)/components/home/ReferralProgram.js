// app/(marketing)/components/home/ReferralProgram.jsx
'use client';

import Link from 'next/link';
import { Users, Gift, TrendingUp, Share2, ArrowRight } from 'lucide-react';

export default function ReferralProgram() {
  return (
    <section id="parrainage" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT - Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 lg:p-10">
              
              <div className="text-center mb-8">
                <div className="text-gray-400 text-sm mb-3">Votre réseau d&apos;affiliés</div>
                
                {/* You */}
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl px-6 py-3 mb-8">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">V</div>
                  <div className="text-left">
                    <div className="text-white font-bold">Vous</div>
                    <div className="text-white/70 text-xs">Niveau 2 • 15%/sem</div>
                  </div>
                </div>

                <div className="flex justify-center mb-4">
                  <div className="w-px h-8 bg-gray-700" />
                </div>

                {/* Referrals */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'Ali K.', invested: '100,000 F', commission: '+1,200 F/sem' },
                    { name: 'Fatou M.', invested: '250,000 F', commission: '+3,000 F/sem' },
                    { name: 'Omar D.', invested: '50,000 F', commission: '+600 F/sem' },
                  ].map((ref, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold mx-auto mb-2">
                        {ref.name[0]}
                      </div>
                      <div className="text-white text-xs font-medium mb-1">{ref.name}</div>
                      <div className="text-gray-400 text-[10px] mb-1">A investi {ref.invested}</div>
                      <div className="text-green-400 text-xs font-bold">{ref.commission}</div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-4">
                    <div className="text-gray-400 text-xs mb-1">Bonus reçus</div>
                    <div className="text-yellow-400 text-xl font-black">30,000 F</div>
                    <div className="text-gray-500 text-[10px] mt-1">10,000 F par affilié</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                    <div className="text-gray-400 text-xs mb-1">Commissions</div>
                    <div className="text-green-400 text-xl font-black">4,800 F/sem</div>
                    <div className="text-gray-500 text-[10px] mt-1">10% de leurs gains</div>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-gray-400 text-xs mb-1">Vous gagnez grâce à 3 affiliés</div>
                  <div className="text-white text-2xl font-black">+4,800 FCFA chaque semaine</div>
                  <div className="text-gray-500 text-xs mt-1">Sans investir un franc de plus</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
              <Share2 size={14} className="text-blue-600" />
              <span className="text-blue-700 text-sm font-medium">Invitez vos proches</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              Gagnez de l&apos;argent grâce à
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600"> vos proches</span>
            </h2>

            <p className="text-gray-600 text-lg mb-10 leading-relaxed">
              Quand vous invitez quelqu&apos;un et qu&apos;il investit, vous recevez un bonus immédiat et vous touchez une commission sur ses gains chaque semaine. Plus vous invitez, plus vous gagnez.
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Gift size={22} className="text-yellow-600" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-lg mb-1">10,000 FCFA de bonus par ami</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Dès que votre ami fait son premier investissement, vous recevez 10,000 FCFA de bonus sur votre compte. C&apos;est immédiat.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={22} className="text-green-600" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-lg mb-1">10% de tout ce qu&apos;ils gagnent</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Chaque semaine, vous recevez automatiquement 10% des bénéfices de chacun de vos affiliés. Tant qu&apos;ils gagnent de l&apos;argent, vous en gagnez aussi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users size={22} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-lg mb-1">Montez de niveau plus vite</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Quand vos affiliés investissent, ça vous aide à monter de niveau. Plus votre niveau est élevé, plus vos propres taux de rendement augmentent.
                  </p>
                </div>
              </div>
            </div>

            {/* Exemple concret */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8">
              <div className="text-gray-900 text-sm font-bold mb-2">Exemple concret</div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Vous invitez 5 amis. Chacun investit 100,000 FCFA. Vous recevez <span className="text-yellow-600 font-bold">50,000 F de bonus</span> tout de suite. Et chaque semaine, vous touchez environ <span className="text-green-600 font-bold">6,000 F de commissions</span> automatiquement, sans rien faire de plus.
              </p>
            </div>

            <Link href="/auth/register"
              className="group inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:shadow-xl">
              Commencer à inviter mes proches
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}