"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Stats globales
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
        // Utiliser l'activité récente des stats
        setRecentActivity(statsData.stats?.recentActivity || []);
      }
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stats cards configuration
  const statsCards = stats ? [
    {
      title: 'Total Investi',
      value: `${(stats.investments?.totalAmount || 0).toLocaleString()} F`,
      change: '+12%',
      trend: 'up',
      icon: DollarSign,
      color: 'yellow'
    },
    {
      title: 'Utilisateurs Actifs',
      value: `${stats.users?.active || 0} / ${stats.users?.total || 0}`,
      change: '',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Bénéfices Versés',
      value: `${(stats.withdrawals?.totalPaid || 0).toLocaleString()} F`,
      change: '+15%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Retraits en Attente',
      value: (stats.withdrawals?.pending || 0).toLocaleString(),
      change: 'À traiter',
      trend: 'neutral',
      icon: Wallet,
      color: 'orange'
    }
  ] : [];

  const getActivityIcon = (type) => {
    switch(type) {
      case 'investment': return '💰';
      case 'withdrawal': return '🏦';
      case 'registration': return '👤';
      case 'referral': return '🤝';
      default: return '📊';
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'investment': return 'bg-green-50 text-green-600';
      case 'withdrawal': return 'bg-orange-50 text-orange-600';
      case 'registration': return 'bg-blue-50 text-blue-600';
      case 'referral': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Dashboard Admin</h1>
          <p className="text-gray-600">Vue d'ensemble de la plateforme</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${
                  stat.color === 'yellow' ? 'bg-yellow-100' :
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  'bg-orange-100'
                } rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    'text-orange-600'
                  }`} />
                </div>
                {stat.trend !== 'neutral' && (
                  <div className={`flex items-center gap-1 text-xs font-bold ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <div className="text-gray-600 text-sm mb-1">{stat.title}</div>
              <div className="text-gray-900 text-2xl font-black">{stat.value}</div>
              {stat.trend === 'neutral' && (
                <div className="text-orange-600 text-xs font-medium mt-1">{stat.change}</div>
              )}
            </div>
          ))}
        </div>

        {/* Graphiques - Masqués pour l'instant car pas de données */}
        {stats?.growth?.monthly && stats.growth.monthly.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Évolution Investissements */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-gray-900 font-bold text-lg mb-4">Évolution des Utilisateurs</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.growth.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#111827' }}
                  />
                  <Bar dataKey="users" fill="#eab308" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Évolution Investissements */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-gray-900 font-bold text-lg mb-4">Évolution des Investissements</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.growth.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#111827' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="invested" 
                    stroke="#eab308" 
                    strokeWidth={3}
                    dot={{ fill: '#eab308', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Activité Récente */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 font-bold text-lg">Activité Récente</h3>
            <button 
              onClick={() => window.location.href = '/admin/investisseurs'}
              className="text-yellow-600 text-sm font-semibold hover:text-yellow-700 transition"
            >
              Voir tout
            </button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-blue-50 text-blue-600">
                      👤
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">{activity.name}</div>
                      <div className="text-gray-600 text-sm">
                        {activity.lastLogin 
                          ? `Dernière connexion: ${new Date(activity.lastLogin).toLocaleDateString('fr-FR')}`
                          : 'Jamais connecté'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucune activité récente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}