// app/(platform)/user/portefeuille/historique/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Download, CheckCircle, XCircle, 
  Clock, AlertCircle, Filter, Search
} from 'lucide-react';

export default function HistoriquePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setMounted(true);
    fetchWithdrawals();
  }, [statusFilter, currentPage]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage.toString(), limit: '20' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetch(`/api/user/withdrawals?${params}`);
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-600" size={20} />;
      case 'approved':
      case 'completed': return <CheckCircle className="text-green-600" size={20} />;
      case 'rejected': return <XCircle className="text-red-600" size={20} />;
      default: return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En cours';
      case 'approved':
      case 'completed': return 'Envoyé';
      case 'rejected': return 'Refusé';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'approved':
      case 'completed': return 'bg-green-50 text-green-600 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'benefices':
      case 'gains': return 'Bénéfices';
      case 'commissions': return 'Commissions';
      case 'bonus': return 'Bonus';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'benefices':
      case 'gains': return 'text-gray-900';
      case 'commissions': return 'text-green-600';
      case 'bonus': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <Link href="/user/portefeuille"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft size={20} />
            <span className="text-sm">Retour au portefeuille</span>
          </Link>
          <h1 className="text-gray-900 text-3xl font-bold mb-2">Historique des retraits</h1>
          <p className="text-gray-600 text-sm">Toutes vos demandes de retrait passées et en cours</p>
        </div>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm">
              <div className="text-yellow-600 text-xs mb-1">En cours</div>
              <div className="text-gray-900 text-xl font-bold">
                {(stats.pending || 0).toLocaleString()} F
              </div>
              <div className="text-yellow-500 text-[10px] mt-1">En attente de traitement</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 shadow-sm">
              <div className="text-green-600 text-xs mb-1">Envoyés</div>
              <div className="text-gray-900 text-xl font-bold">
                {((stats.approved || 0) + (stats.completed || 0)).toLocaleString()} F
              </div>
              <div className="text-green-500 text-[10px] mt-1">Argent reçu sur votre compte</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
              <div className="text-red-600 text-xs mb-1">Refusés</div>
              <div className="text-gray-900 text-xl font-bold">
                {(stats.rejected || 0).toLocaleString()} F
              </div>
              <div className="text-red-400 text-[10px] mt-1">Montant remis dans votre solde</div>
            </div>
          </div>
        )}

        {/* FILTRES */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-gray-600 text-xs mb-2 block">Statut</label>
              <select value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-2 text-sm focus:border-yellow-400 focus:outline-none">
                <option value="all">Tous les statuts</option>
                <option value="pending">En cours</option>
                <option value="completed">Envoyés</option>
                <option value="rejected">Refusés</option>
              </select>
            </div>
            {statusFilter !== 'all' && (
              <div className="flex items-end">
                <button onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-xl text-sm hover:bg-gray-300 transition-colors">
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LISTE */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Chargement...</div>
          ) : withdrawals.length > 0 ? (
            <>
              <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-medium">
                <div>Date</div>
                <div>Montant</div>
                <div>Type</div>
                <div>Méthode</div>
                <div>Statut</div>
                <div>Détails</div>
              </div>

              <div className="divide-y divide-gray-200">
                {withdrawals.map((w) => (
                  <div key={w.id}
                    className="grid grid-cols-1 md:grid-cols-6 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="md:hidden text-gray-500 text-xs">Date :</span>
                      <span className="text-gray-900 text-sm">
                        {new Date(w.requestedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="md:hidden text-gray-500 text-xs">Montant :</span>
                      <span className="text-gray-900 text-sm font-semibold">{w.amount.toLocaleString()} F</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="md:hidden text-gray-500 text-xs">Type :</span>
                      <span className={`text-sm font-medium ${getTypeColor(w.type)}`}>{getTypeText(w.type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="md:hidden text-gray-500 text-xs">Méthode :</span>
                      <span className="text-gray-600 text-sm">{w.method || 'Mobile Money'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="md:hidden text-gray-500 text-xs">Statut :</span>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(w.status)}`}>
                        {getStatusIcon(w.status)}
                        <span>{getStatusText(w.status)}</span>
                      </div>
                    </div>
                    <div>
                      {w.status === 'rejected' && w.rejectionReason && (
                        <div className="text-red-600 text-xs">
                          <span className="font-medium">Raison :</span> {w.rejectionReason}
                        </div>
                      )}
                      {(w.status === 'completed' || w.status === 'approved') && (
                        <div className="text-green-600 text-xs">
                          Envoyé sur votre {w.method || 'Mobile Money'}
                        </div>
                      )}
                      {w.status === 'pending' && (
                        <div className="text-yellow-600 text-xs">Traitement sous 24h</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600 text-sm">
                      Page {pagination.page} sur {pagination.pages}
                      <span className="text-gray-500 ml-2">({pagination.total} retrait{pagination.total > 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
                        Précédent
                      </button>
                      <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === pagination.pages}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md">
                        Suivant
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Download className="text-gray-400 mx-auto mb-3" size={48} />
              <div className="text-gray-600 text-sm mb-2">Aucun retrait trouvé</div>
              <div className="text-gray-500 text-xs">
                {statusFilter !== 'all' ? 'Essayez de modifier les filtres' : 'Vos demandes de retrait apparaîtront ici'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}