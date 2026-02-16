"use client";

import React, { useState } from 'react';
import { Search, TrendingUp, Clock, Calendar, DollarSign } from 'lucide-react';

export default function AdminInvestments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const investments = [
    {
      id: 1,
      user: 'Jean Kouassi',
      amount: 500000,
      status: 'active',
      startDate: '2024-01-15',
      gains: 75000,
      weeklyReturn: 10,
      level: 2,
      duration: '12 semaines'
    },
    {
      id: 2,
      user: 'Marie Diallo',
      amount: 1200000,
      status: 'active',
      startDate: '2023-11-20',
      gains: 240000,
      weeklyReturn: 15,
      level: 3,
      duration: '8 semaines'
    },
    {
      id: 3,
      user: 'Paul Soro',
      amount: 100000,
      status: 'active',
      startDate: '2024-01-26',
      gains: 10000,
      weeklyReturn: 10,
      level: 1,
      duration: '1 semaine'
    },
    {
      id: 4,
      user: 'Sophie Loukou',
      amount: 750000,
      status: 'completed',
      startDate: '2023-06-10',
      gains: 450000,
      weeklyReturn: 15,
      level: 2,
      duration: '24 semaines'
    },
    {
      id: 5,
      user: 'Alex Martin',
      amount: 250000,
      status: 'active',
      startDate: '2024-01-20',
      gains: 37500,
      weeklyReturn: 10,
      level: 1,
      duration: '4 semaines'
    }
  ];

  const filteredInvestments = investments.filter(inv => {
    const matchSearch = inv.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'En cours' : 'Terminé';
  };

  const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const totalGains = investments.reduce((acc, inv) => acc + inv.gains, 0);
  const activeCount = investments.filter(inv => inv.status === 'active').length;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Gestion Investissements</h1>
          <p className="text-white/60">{investments.length} investissements au total</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-white/60 text-sm">Total Investi</div>
            </div>
            <div className="text-yellow-400 text-2xl font-black">{formatNumber(totalInvested)} F</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-white/60 text-sm">Total Gains</div>
            </div>
            <div className="text-green-400 text-2xl font-black">{formatNumber(totalGains)} F</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-white/60 text-sm">En cours</div>
            </div>
            <div className="text-white text-2xl font-black">{activeCount}</div>
          </div>
        </div>

        {/* Filtres et Recherche */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Rechercher par utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-yellow-400/30 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Filtres Statut */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-3 rounded-xl font-semibold transition ${
                  filterStatus === 'all'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-black/40 text-white/60 border border-yellow-400/20 hover:border-yellow-400/40'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-3 rounded-xl font-semibold transition ${
                  filterStatus === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-black/40 text-white/60 border border-yellow-400/20 hover:border-yellow-400/40'
                }`}
              >
                En cours
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-3 rounded-xl font-semibold transition ${
                  filterStatus === 'completed'
                    ? 'bg-gray-500 text-white'
                    : 'bg-black/40 text-white/60 border border-yellow-400/20 hover:border-yellow-400/40'
                }`}
              >
                Terminés
              </button>
            </div>
          </div>
        </div>

        {/* Liste Investissements */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-yellow-400/20">
                <tr>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Utilisateur</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Montant</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Rendement</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Gains</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Durée</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Date début</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestments.map((investment) => (
                  <tr key={investment.id} className="border-b border-yellow-400/10 hover:bg-yellow-400/5 transition">
                    <td className="p-4">
                      <div className="text-white font-semibold">{investment.user}</div>
                      <div className="text-white/60 text-xs">Niveau {investment.level}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-yellow-400 font-black">{formatNumber(investment.amount)} F</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-bold">{investment.weeklyReturn}% / sem</div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-400 font-bold">{formatNumber(investment.gains)} F</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white/80">{investment.duration}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white/80 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white/40" />
                        {investment.startDate}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(investment.status)}`}>
                        {getStatusText(investment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}