// app/(marketing)/components/home/Testimonials.jsx
'use client';

import { Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Aminata Koné',
      location: 'Abidjan, Côte d\'Ivoire',
      photo: 'https://res.cloudinary.com/dzird4mfe/image/upload/v1771464260/866f6943dd82013747095a9182cc4056_f7kmm0.jpg',
      initials: 'AK',
      amount: '250,000 F investi',
      text: 'Je gagne plus de 40,000 FCFA par semaine sans rien faire. J\'ai commencé avec 50,000 F et j\'ai réinvesti mes gains. Aujourd\'hui, mon argent travaille pour moi.',
      gradient: 'from-yellow-400 to-amber-500'
    },
    {
      name: 'Ibrahim Traoré',
      location: 'Ouagadougou, Burkina Faso',
      photo: 'https://res.cloudinary.com/dzird4mfe/image/upload/v1771464238/d3f4a7fb5041ff0fa589933c8a77007e_uyaajo.jpg',
      initials: 'IT',
      amount: '500,000 F investi',
      text: 'Grâce au système d\'affiliation, j\'ai invité 8 personnes et je touche des commissions chaque semaine en plus de mes propres gains. C\'est comme un deuxième salaire.',
      gradient: 'from-green-400 to-emerald-500'
    },
    {
      name: 'Moussa Ouédraogo',
      location: 'Bobo-Dioulasso, Burkina Faso',
      photo: 'https://res.cloudinary.com/dzird4mfe/image/upload/v1771464215/97e64e91c01ea1be5a9f65cac58c8a4b_quh6nk.jpg',
      initials: 'MO',
      amount: '150,000 F investi',
      text: 'Le retrait est rapide et simple. J\'ai demandé un retrait le matin et l\'argent était sur mon Orange Money le soir même. Je recommande à tout le monde.',
      gradient: 'from-blue-400 to-indigo-500'
    },
    {
      name: 'Adama Sanogo',
      location: 'Bamako, Mali',
      photo: 'https://res.cloudinary.com/dzird4mfe/image/upload/v1771464215/05aaf2ef63d533b1c7b12e3254df0853_yarzne.jpg',
      initials: 'AS',
      amount: '300,000 F investi',
      text: 'J\'ai commencé avec 10,000 F juste pour tester. Quand j\'ai vu que ça marchait vraiment, j\'ai mis plus. Aujourd\'hui je suis au niveau 3 et mes taux sont au maximum.',
      gradient: 'from-purple-400 to-violet-500'
    },
    {
      name: 'Kouassi Ange',
      location: 'Abidjan, Côte d\'Ivoire',
      photo: 'https://res.cloudinary.com/dzird4mfe/image/upload/v1771464215/9da07543bb0fa6f144c40cec4705e533_og6xd0.jpg',
      initials: 'KA',
      amount: '100,000 F investi',
      text: 'Au début j\'hésitais, mais j\'ai vu que mes amis gagnaient vraiment. J\'ai investi 100,000 F et une semaine après j\'avais déjà 18,000 F de bénéfices sur mon compte.',
      gradient: 'from-orange-400 to-red-500'
    },
    {
      name: 'Fatou Diallo',
      location: 'Dakar, Sénégal',
      photo: 'https://res.cloudinary.com/dzird4mfe/image/upload/v1771464215/599a33719a73c8635f751ba6a44ba6b0_vnaavm.jpg',
      initials: 'FD',
      amount: '75,000 F investi',
      text: 'Je suis commerçante et je cherchais un moyen de faire fructifier mes économies. Avec CashProfit, je vois mes gains augmenter chaque seconde sur mon téléphone.',
      gradient: 'from-teal-400 to-cyan-500'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2 mb-6">
            <span className="text-yellow-700 text-sm font-medium">Ils nous font confiance</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            Des milliers de personnes<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">gagnent déjà</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Découvrez les témoignages de personnes qui ont commencé comme vous et qui gagnent de l&apos;argent chaque semaine avec CashProfit.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-700 text-sm leading-relaxed mb-5">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className={`w-11 h-11 bg-gradient-to-br ${t.gradient} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 text-sm font-bold">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.location}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg px-2.5 py-1 flex-shrink-0">
                  <span className="text-green-700 text-[11px] font-bold">{t.amount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-14 bg-white border border-gray-200 rounded-2xl p-6 max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-gray-900 text-2xl lg:text-3xl font-black">26,000+</div>
              <div className="text-gray-500 text-xs mt-1">Personnes inscrites</div>
            </div>
            <div className="border-x border-gray-200">
              <div className="text-green-600 text-2xl lg:text-3xl font-black">98%</div>
              <div className="text-gray-500 text-xs mt-1">Satisfaits</div>
            </div>
            <div>
              <div className="text-yellow-600 text-2xl lg:text-3xl font-black">2 Mrd+</div>
              <div className="text-gray-500 text-xs mt-1">FCFA de gains versés</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}