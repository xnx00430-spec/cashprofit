"use client";

import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, X, Clock, DollarSign, Calendar, Eye, Check } from 'lucide-react';

export default function AdminWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchWithdrawals();
  }, [filterStatus]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const res = await fetch(`/api/admin/withdrawals?${params}`);
      const data = await res.json();
      if (data.success) setWithdrawals(data.withdrawals || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const name = w.user?.name || '';
    const email = w.user?.email || '';
    const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'approved': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-600 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'completed': return 'Complété';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'gains': return 'Bénéfices';
      case 'commissions': return 'Commissions';
      case 'bonus': return 'Bonus';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'gains': return 'text-gray-900';
      case 'commissions': return 'text-green-600';
      case 'bonus': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredWithdrawals.filter(w => w.status === 'pending').map(w => w.id);
    setSelectedIds(selectedIds.length === pendingIds.length ? [] : pendingIds);
  };

  const openModal = (withdrawal) => { setSelectedWithdrawal(withdrawal); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedWithdrawal(null); };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Retrait approuvé !');
        fetchWithdrawals();
        closeModal();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Retrait rejeté');
        fetchWithdrawals();
        closeModal();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors du rejet');
    }
  };

  const handleMarkCompleted = async (id) => {
    const transactionId = prompt('ID de transaction (optionnel):');
    const confirmed = confirm('Marquer ce retrait comme complété ?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', transactionId: transactionId || `TRX-${Date.now()}` })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Retrait complété !');
        fetchWithdrawals();
        closeModal();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = confirm(`Approuver ${selectedIds.length} retrait(s) ?`);
    if (!confirmed) return;
    // Approuver un par un
    let success = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/withdrawals/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' })
        });
        const data = await res.json();
        if (data.success) success++;
      } catch (e) { console.error(e); }
    }
    alert(`✅ ${success}/${selectedIds.length} retrait(s) approuvé(s)`);
    setSelectedIds([]);
    fetchWithdrawals();
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const reason = prompt('Raison du rejet (pour tous):');
    if (!reason) return;
    let success = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/withdrawals/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject', reason })
        });
        const data = await res.json();
        if (data.success) success++;
      } catch (e) { console.error(e); }
    }
    alert(`✅ ${success}/${selectedIds.length} retrait(s) rejeté(s)`);
    setSelectedIds([]);
    fetchWithdrawals();
  };

  // Stats
  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((acc, w) => acc + w.amount, 0);
  const totalApproved = withdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0);
  const totalCompleted = withdrawals.filter(w => w.status === 'completed').reduce((acc, w) => acc + w.amount, 0);
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

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
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Gestion des Retraits</h1>
          <p className="text-gray-600">{withdrawals.length} demande(s) au total</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-gray-600 text-sm">En attente</div>
            </div>
            <div className="text-orange-600 text-2xl font-black">{formatNumber(totalPending)} F</div>
            <div className="text-gray-500 text-xs mt-1">{pendingCount} demande(s)</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-gray-600 text-sm">Approuvés</div>
            </div>
            <div className="text-blue-600 text-2xl font-black">{formatNumber(totalApproved)} F</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-gray-600 text-sm">Complétés</div>
            </div>
            <div className="text-green-600 text-2xl font-black">{formatNumber(totalCompleted)} F</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-gray-600 text-sm">Total</div>
            </div>
            <div className="text-yellow-600 text-2xl font-black">{formatNumber(totalPending + totalApproved + totalCompleted)} F</div>
          </div>
        </div>

        {/* Actions multiples */}
        {selectedIds.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-md">
            <div className="text-gray-900 font-semibold">{selectedIds.length} retrait(s) sélectionné(s)</div>
            <div className="flex gap-3">
              <button onClick={handleBulkApprove} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2">
                <CheckCircle size={18} /> Approuver tout
              </button>
              <button onClick={handleBulkReject} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2">
                <X size={18} /> Rejeter tout
              </button>
              <button onClick={() => setSelectedIds([])} className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-xl font-semibold transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Rechercher par utilisateur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="completed">Complétés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4">
                    <input type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredWithdrawals.filter(w => w.status === 'pending').length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400" />
                  </th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm">Utilisateur</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm">Montant</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm">Type</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm">Méthode</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm">Compte</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm">Date</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm">Statut</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.length > 0 ? (
                  filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="p-4">
                        {w.status === 'pending' && (
                          <input type="checkbox" checked={selectedIds.includes(w.id)} onChange={() => toggleSelection(w.id)}
                            className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400" />
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-gray-900 font-semibold">{w.user?.name || 'N/A'}</div>
                        <div className="text-gray-600 text-xs">{w.user?.email}</div>
                        {w.user?.phone && <div className="text-gray-400 text-xs">{w.user?.phone}</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-gray-900 font-black">{formatNumber(w.amount)} F</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium ${getTypeColor(w.type)}`}>
                          {getTypeLabel(w.type)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-700 text-sm">{w.paymentMethod || 'Mobile Money'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-700 text-sm font-mono">{w.accountNumber || '-'}</div>
                        <div className="text-gray-500 text-xs">{w.accountName || ''}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-700 flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(w.requestedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        {w.waitingDays > 0 && w.status === 'pending' && (
                          <div className="text-orange-500 text-xs mt-0.5">{w.waitingDays}j d'attente</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(w.status)}`}>
                          {getStatusText(w.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => openModal(w)} className="p-2 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition">
                          <Eye className="w-4 h-4 text-yellow-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="9" className="p-12 text-center text-gray-500">Aucun retrait trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Détails */}
        {showModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Détails du retrait</h2>
                  <p className="text-gray-600">ID: #{String(selectedWithdrawal.id).slice(-8)}</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-6 h-6 text-gray-900" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-600 text-sm mb-1">Utilisateur</div>
                  <div className="text-gray-900 text-xl font-bold">{selectedWithdrawal.user?.name || 'N/A'}</div>
                  <div className="text-gray-600 text-sm">{selectedWithdrawal.user?.email}</div>
                  {selectedWithdrawal.user?.phone && <div className="text-gray-500 text-sm">{selectedWithdrawal.user?.phone}</div>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-gray-600 text-sm mb-1">Montant</div>
                    <div className="text-gray-900 text-xl font-black">{formatNumber(selectedWithdrawal.amount)} F</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-gray-600 text-sm mb-1">Type</div>
                    <div className={`text-xl font-bold ${getTypeColor(selectedWithdrawal.type)}`}>
                      {getTypeLabel(selectedWithdrawal.type)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-600 text-sm mb-2">Informations de paiement</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Méthode:</span>
                      <span className="text-gray-900 font-semibold">{selectedWithdrawal.paymentMethod || 'Mobile Money'}</span>
                    </div>
                    {selectedWithdrawal.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Numéro:</span>
                        <span className="text-gray-900 font-semibold font-mono">{selectedWithdrawal.accountNumber}</span>
                      </div>
                    )}
                    {selectedWithdrawal.accountName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nom:</span>
                        <span className="text-gray-900 font-semibold">{selectedWithdrawal.accountName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date demande:</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(selectedWithdrawal.requestedAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions selon statut */}
                {selectedWithdrawal.status === 'pending' && (
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(selectedWithdrawal.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Approuver
                    </button>
                    <button onClick={() => handleReject(selectedWithdrawal.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                      <X className="w-5 h-5" /> Rejeter
                    </button>
                  </div>
                )}

                {selectedWithdrawal.status === 'approved' && (
                  <button onClick={() => handleMarkCompleted(selectedWithdrawal.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Marquer comme complété
                  </button>
                )}

                {selectedWithdrawal.status === 'rejected' && selectedWithdrawal.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="text-red-600 text-sm font-semibold mb-1">Raison du rejet:</div>
                    <div className="text-gray-900">{selectedWithdrawal.rejectionReason}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}