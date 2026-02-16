"use client";

import React, { useState, useEffect } from 'react';
import { Search, Eye, X, Users as UsersIcon, RefreshCw } from 'lucide-react';

export default function AdminInvestisseurs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    // Refresh auto toutes les 10 secondes pour gains live
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const matchSearch = fullName.includes(searchTerm.toLowerCase()) ||
                       user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getLevelColor = (level) => {
    switch(level) {
      case 1: return 'bg-blue-50 text-blue-600 border-blue-200';
      case 2: return 'bg-purple-50 text-purple-600 border-purple-200';
      case 3: return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-50 text-green-600 border-green-200';
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'blocked': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'blocked': return 'Bloqué';
      default: return status;
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    setShowModal(true);
    
    try {
      const res = await fetch(`/api/admin/users/${user._id}/network`);
      const data = await res.json();
      
      if (data.success) {
        setSelectedUser(prev => ({
          ...prev,
          referrals: data.referrals || []
        }));
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
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
          <h1 className="text-3xl font-black text-gray-900 mb-2">Liste des Investisseurs</h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-600">{users.length} investisseur(s) au total</p>
            <div className="flex items-center gap-1.5 text-green-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Filtres et Recherche */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="blocked">Bloqués</option>
            </select>
          </div>
        </div>

        {/* Liste Utilisateurs */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-600">Aucun investisseur trouvé</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-gray-600 font-semibold text-sm">Utilisateur</th>
                    <th className="text-left p-4 text-gray-600 font-semibold text-sm">Niveau</th>
                    <th className="text-left p-4 text-gray-600 font-semibold text-sm">Statut</th>
                    <th className="text-left p-4 text-gray-600 font-semibold text-sm">Total Investi</th>
                    <th className="text-left p-4 text-gray-600 font-semibold text-sm">Bénéfices</th>
                    <th className="text-left p-4 text-gray-600 font-semibold text-sm">Affiliés</th>
                    <th className="text-left p-4 text-gray-600 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div>
                          <div className="text-gray-900 font-semibold">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-gray-600 text-sm">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelColor(user.level || 1)}`}>
                          Niveau {user.level || 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(user.status)}`}>
                          {getStatusText(user.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-900 font-bold">{formatNumber(user.totalInvested)} F</div>
                      </td>
                      <td className="p-4">
                        <div className="text-green-600 font-bold">{formatNumber((user.totalBenefits || 0) + (user.totalCommissions || 0) + (user.bonusParrainage || 0))} F</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-900 font-semibold">{user.referralCount || 0}</div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openUserModal(user)}
                          className="p-2 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4 text-yellow-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Détails Utilisateur */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-gray-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header Modal */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X className="w-6 h-6 text-gray-900" />
                </button>
              </div>

              {/* Content Modal */}
              <div className="p-6">
                {/* Stats Utilisateur */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-gray-600 text-xs mb-1">Niveau</div>
                    <div className="text-yellow-600 text-2xl font-black">{selectedUser.level || 1}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-gray-600 text-xs mb-1">Total Investi</div>
                    <div className="text-gray-900 text-lg font-bold">{formatNumber(selectedUser.totalInvested)} F</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="text-gray-600 text-xs mb-1">Bénéfices (live)</div>
                    <div className="text-green-600 text-lg font-bold">{formatNumber(selectedUser.totalBenefits)} F</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-gray-600 text-xs mb-1">Affiliés</div>
                    <div className="text-gray-900 text-2xl font-black">{selectedUser.referralCount || 0}</div>
                  </div>
                </div>

                {/* Détail des revenus */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                  <h3 className="text-gray-900 font-bold mb-4">Détail des revenus</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bénéfices personnels</span>
                      <span className="text-green-600 font-bold">{formatNumber(selectedUser.totalBenefits)} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commissions affiliés</span>
                      <span className="text-blue-600 font-bold">{formatNumber(selectedUser.totalCommissions)} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonus parrainage</span>
                      <span className="text-yellow-600 font-bold">{formatNumber(selectedUser.bonusParrainage)} F</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3">
                      <span className="text-gray-600">Total retiré</span>
                      <span className="text-red-600 font-bold">-{formatNumber(selectedUser.totalWithdrawn)} F</span>
                    </div>
                  </div>
                </div>

                {/* Informations */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                  <h3 className="text-gray-900 font-bold mb-4">Informations</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Téléphone</span>
                      <span className="text-gray-900 font-semibold">{selectedUser.phone || 'Non renseigné'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Code parrain</span>
                      <span className="text-gray-900 font-semibold font-mono">{selectedUser.sponsorCode || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parrainé par</span>
                      <span className="text-gray-900 font-semibold">{selectedUser.referredByCode || 'Aucun'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date d'inscription</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedUser.status)}`}>
                        {getStatusText(selectedUser.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Réseau de Parrainage */}
                {selectedUser.referrals && selectedUser.referrals.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                    <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-yellow-600" />
                      Réseau d'Affiliés ({selectedUser.referrals.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedUser.referrals.map((ref, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <div className="text-gray-900 font-semibold">{ref.name}</div>
                            <div className="text-gray-600 text-xs">Niveau {ref.level || 1}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-900 font-bold text-sm">
                              {formatNumber(ref.totalInvested || 0)} F
                            </div>
                            <div className="text-green-600 text-xs">
                              +{formatNumber((ref.balance || 0) * 0.10)} F comm.
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cagnotte Niveau */}
                {selectedUser.totalInvested > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <h3 className="text-gray-900 font-bold mb-3">Progression Niveau</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cagnotte actuelle</span>
                        <span className="text-gray-900 font-bold">
                          {formatNumber(selectedUser.currentLevelCagnotte || 0)} / {formatNumber(selectedUser.currentLevelTarget || 0)} F
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 transition-all duration-500"
                          style={{ 
                            width: `${Math.min(((selectedUser.currentLevelCagnotte || 0) / (selectedUser.currentLevelTarget || 1)) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedUser.status === 'active' || selectedUser.status === 'pending' ? (
                    <button
                      onClick={async () => {
                        const reason = prompt('Raison du blocage :');
                        if (!reason) return;
                        const confirmed = confirm(`Bloquer ${selectedUser.name} ?`);
                        if (!confirmed) return;
                        try {
                          const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'block', reason })
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert('✅ Utilisateur bloqué');
                            fetchUsers();
                            closeModal();
                          } else {
                            alert('❌ ' + data.message);
                          }
                        } catch (error) {
                          alert('❌ Erreur réseau');
                        }
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition"
                    >
                      Bloquer le compte
                    </button>
                  ) : selectedUser.status === 'blocked' ? (
                    <button
                      onClick={async () => {
                        const confirmed = confirm(`Débloquer ${selectedUser.name} ?`);
                        if (!confirmed) return;
                        try {
                          const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'unblock' })
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert('✅ Utilisateur débloqué');
                            fetchUsers();
                            closeModal();
                          } else {
                            alert('❌ ' + data.message);
                          }
                        } catch (error) {
                          alert('❌ Erreur réseau');
                        }
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition"
                    >
                      Débloquer le compte
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}