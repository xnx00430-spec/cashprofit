// app/(marketing)/components/home/LiveStatsBar.jsx
'use client';

import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react';

export default function LiveStatsBar() {
  const stats = [
    { icon: DollarSign, label: 'Investis au total', value: '2.4 Mrd FCFA', color: 'text-yellow-600' },
    { icon: Users, label: 'Investisseurs actifs', value: '3,248+', color: 'text-blue-600' },
    { icon: TrendingUp, label: 'Bénéfices distribués', value: '890 M FCFA', color: 'text-green-600' },
    { icon: Clock, label: 'Délai de retrait', value: '24-48h', color: 'text-gray-900' },
  ];

  return (
    <section className="relative py-6 border-y border-gray-100 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-gray-500 text-xs">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}