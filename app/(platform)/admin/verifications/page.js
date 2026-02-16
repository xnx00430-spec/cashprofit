"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Eye, CheckCircle, X, FileText, Calendar, Phone, Mail, User, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function AdminVerifications() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Données de démonstration
  const verifications = [
    {
      id: 1,
      user: {
        name: 'Jean Kouassi',
        email: 'jean.k@example.com',
        phone: '+225 07 12 34 56 78',
        joinDate: '2024-01-20'
      },
      status: 'pending',
      submittedDate: '2024-01-26 14:30',
      documents: {
        idCard: '/uploads/id-jean-front.jpg',
        idCardBack: '/uploads/id-jean-back.jpg',
        selfie: '/uploads/selfie-jean.jpg',
        proof: '/uploads/proof-jean.pdf'
      },
      personalInfo: {
        fullName: 'Jean Kouassi',
        birthDate: '1995-03-15',
        nationality: 'Ivoirienne',
        address: 'Cocody Riviera 2, Abidjan',
        idNumber: 'CI123456789'
      }
    },
    {
      id: 2,
      user: {
        name: 'Marie Diallo',
        email: 'marie.d@example.com',
        phone: '+225 05 98 76 54 32',
        joinDate: '2024-01-22'
      },
      status: 'approved',
      submittedDate: '2024-01-24 10:15',
      approvedDate: '2024-01-24 16:20',
      documents: {
        idCard: '/uploads/id-marie-front.jpg',
        idCardBack: '/uploads/id-marie-back.jpg',
        selfie: '/uploads/selfie-marie.jpg',
        proof: '/uploads/proof-marie.pdf'
      },
      personalInfo: {
        fullName: 'Marie Diallo',
        birthDate: '1992-08-22',
        nationality: 'Sénégalaise',
        address: 'Plateau, Abidjan',
        idNumber: 'SN987654321'
      }
    },
    {
      id: 3,
      user: {
        name: 'Paul Soro',
        email: 'paul.s@example.com',
        phone: '+225 01 23 45 67 89',
        joinDate: '2024-01-25'
      },
      status: 'rejected',
      submittedDate: '2024-01-25 09:00',
      rejectedDate: '2024-01-25 15:30',
      rejectionReason: 'Photo d\'identité floue, impossible de lire les informations. Veuillez soumettre une photo plus nette.',
      documents: {
        idCard: '/uploads/id-paul-front.jpg',
        idCardBack: '/uploads/id-paul-back.jpg',
        selfie: '/uploads/selfie-paul.jpg'
      },
      personalInfo: {
        fullName: 'Paul Soro',
        birthDate: '1998-11-10',
        nationality: 'Burkinabé',
        address: 'Yopougon, Abidjan',
        idNumber: 'BF456789123'
      }
    },
    {
      id: 4,
      user: {
        name: 'Sophie Loukou',
        email: 'sophie.l@example.com',
        phone: '+225 07 88 99 00 11',
        joinDate: '2024-01-26'
      },
      status: 'pending',
      submittedDate: '2024-01-26 16:45',
      documents: {
        idCard: '/uploads/id-sophie-front.jpg',
        idCardBack: '/uploads/id-sophie-back.jpg',
        selfie: '/uploads/selfie-sophie.jpg',
        proof: '/uploads/proof-sophie.pdf'
      },
      personalInfo: {
        fullName: 'Sophie Loukou',
        birthDate: '1990-05-30',
        nationality: 'Ivoirienne',
        address: 'Marcory, Abidjan',
        idNumber: 'CI789123456'
      }
    }
  ];

  const filteredVerifications = verifications.filter(v => {
    const matchSearch = v.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       v.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === 'all' || v.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const openModal = (verification) => {
    setSelectedVerification(verification);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVerification(null);
  };

  // Ouvrir automatiquement le modal si userId est dans l'URL
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId) {
      const verification = verifications.find(v => v.id === parseInt(userId));
      if (verification) {
        openModal(verification);
      }
    }
  }, [searchParams]);

  const handleApprove = (id) => {
    console.log('Approuver vérification', id);
    // API call ici
    closeModal();
  };

  const handleReject = (id) => {
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      alert('Veuillez indiquer une raison');
      return;
    }
    
    // Si c'est une modification (déjà rejeté), on update
    if (selectedVerification.status === 'rejected') {
      console.log('Modifier raison du rejet', selectedVerification.id, rejectReason);
      // API call pour update la raison
    } else {
      // Sinon c'est un nouveau rejet
      console.log('Rejeter vérification', selectedVerification.id, rejectReason);
      // API call pour rejeter
    }
    
    setShowRejectModal(false);
    setRejectReason('');
    closeModal();
  };

  const handleRequestMoreInfo = (id) => {
    const message = prompt('Quel document ou information supplémentaire demander ?');
    if (message) {
      console.log('Demander plus d\'infos', id, message);
      // API call ici
    }
  };

  const pendingCount = verifications.filter(v => v.status === 'pending').length;
  const approvedCount = verifications.filter(v => v.status === 'approved').length;
  const rejectedCount = verifications.filter(v => v.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Vérifications KYC</h1>
          <p className="text-white/60">{verifications.length} demandes au total</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-white/60 text-sm">En attente</div>
            </div>
            <div className="text-orange-400 text-2xl font-black">{pendingCount}</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-white/60 text-sm">Approuvés</div>
            </div>
            <div className="text-green-400 text-2xl font-black">{approvedCount}</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-white/60 text-sm">Rejetés</div>
            </div>
            <div className="text-red-400 text-2xl font-black">{rejectedCount}</div>
          </div>
        </div>

        {/* Filtres et Recherche */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-yellow-400/30 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-3 rounded-xl font-semibold transition ${
                  filterStatus === 'all' ? 'bg-yellow-400 text-black' : 'bg-black/40 text-white/60 border border-yellow-400/20'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-3 rounded-xl font-semibold transition ${
                  filterStatus === 'pending' ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/60 border border-yellow-400/20'
                }`}
              >
                En attente
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-3 rounded-xl font-semibold transition ${
                  filterStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-black/40 text-white/60 border border-yellow-400/20'
                }`}
              >
                Approuvés
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-3 rounded-xl font-semibold transition ${
                  filterStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-black/40 text-white/60 border border-yellow-400/20'
                }`}
              >
                Rejetés
              </button>
            </div>
          </div>
        </div>

        {/* Liste Vérifications */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-yellow-400/20">
                <tr>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Utilisateur</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Contact</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Date soumission</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Statut</th>
                  <th className="text-left p-4 text-white/60 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerifications.map((verification) => (
                  <tr key={verification.id} className="border-b border-yellow-400/10 hover:bg-yellow-400/5 transition">
                    <td className="p-4">
                      <div className="text-white font-semibold">{verification.user.name}</div>
                      <div className="text-white/60 text-xs">Inscrit le {verification.user.joinDate}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white/80 text-sm flex items-center gap-2">
                        <Mail className="w-4 h-4 text-white/40" />
                        {verification.user.email}
                      </div>
                      <div className="text-white/80 text-sm flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-white/40" />
                        {verification.user.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white/80 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white/40" />
                        {verification.submittedDate}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(verification.status)}`}>
                        {getStatusText(verification.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openModal(verification)}
                        className="p-2 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4 text-yellow-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Détails */}
        {showModal && selectedVerification && (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
      
      {/* Header Modal - Sticky */}
      <div className="bg-gradient-to-br from-gray-900 to-black border-b border-yellow-400/20 p-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white mb-1">Vérification KYC</h2>
          <p className="text-yellow-400 font-semibold text-lg">{selectedVerification.user.name}</p>
          <p className="text-white/60 text-sm">{selectedVerification.user.email}</p>
        </div>
        <button onClick={closeModal} className="p-3 hover:bg-white/10 rounded-xl transition">
          <X className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Content Modal - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLONNE GAUCHE - Informations */}
          <div className="space-y-6">
            
            {/* Contact */}
            <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-bold text-xl">Contact</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-black/60 rounded-lg">
                  <Mail className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-white/60 text-xs mb-1">Email</div>
                    <div className="text-white font-semibold break-all">{selectedVerification.user.email}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-black/60 rounded-lg">
                  <Phone className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-white/60 text-xs mb-1">Téléphone</div>
                    <div className="text-white font-semibold">{selectedVerification.user.phone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-black/60 rounded-lg">
                  <Calendar className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-white/60 text-xs mb-1">Date d'inscription</div>
                    <div className="text-white font-semibold">{selectedVerification.user.joinDate}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identité */}
            <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-bold text-xl">Identité</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-black/60 rounded-lg">
                  <div className="text-white/60 text-xs mb-1">Nom complet</div>
                  <div className="text-white font-bold text-xl">{selectedVerification.personalInfo.fullName}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-black/60 rounded-lg">
                    <div className="text-white/60 text-xs mb-1">Date de naissance</div>
                    <div className="text-white font-semibold">{selectedVerification.personalInfo.birthDate}</div>
                  </div>
                  <div className="p-4 bg-black/60 rounded-lg">
                    <div className="text-white/60 text-xs mb-1">Nationalité</div>
                    <div className="text-white font-semibold">{selectedVerification.personalInfo.nationality}</div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-400/10 border-2 border-yellow-400/30 rounded-lg">
                  <div className="text-yellow-400/80 text-xs mb-1">N° Pièce d'identité</div>
                  <div className="text-yellow-400 font-black text-2xl">{selectedVerification.personalInfo.idNumber}</div>
                </div>
                <div className="p-4 bg-black/60 rounded-lg">
                  <div className="text-white/60 text-xs mb-1">Adresse complète</div>
                  <div className="text-white font-semibold">{selectedVerification.personalInfo.address}</div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-bold text-xl">Chronologie</h3>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-black/60 rounded-lg">
                  <div className="text-white/60 text-xs mb-1">Demande soumise</div>
                  <div className="text-white font-bold">{selectedVerification.submittedDate}</div>
                </div>
                {selectedVerification.approvedDate && (
                  <div className="p-4 bg-green-500/10 border border-green-500/40 rounded-lg">
                    <div className="text-green-400/80 text-xs mb-1">Approuvée le</div>
                    <div className="text-green-400 font-bold">{selectedVerification.approvedDate}</div>
                  </div>
                )}
                {selectedVerification.rejectedDate && (
                  <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-lg">
                    <div className="text-red-400/80 text-xs mb-1">Rejetée le</div>
                    <div className="text-red-400 font-bold">{selectedVerification.rejectedDate}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Raison rejet si applicable */}
            {selectedVerification.status === 'rejected' && selectedVerification.rejectionReason && (
              <div className="bg-red-500/10 border-2 border-red-500/40 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <h3 className="text-red-400 font-bold text-xl">Raison du rejet</h3>
                </div>
                <div className="text-white text-lg bg-black/60 p-4 rounded-lg leading-relaxed mb-3">
                  {selectedVerification.rejectionReason}
                </div>
                <button
                  onClick={() => {
                    setRejectionReason(selectedVerification.rejectionReason);
                    setShowRejectModal(true);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition"
                >
                  ✏️ Modifier la raison du rejet
                </button>
              </div>
            )}
            
            {selectedVerification.status === 'pending' && (
              <div className="bg-orange-500/10 border-2 border-orange-500/40 rounded-xl p-4">
                <div className="text-orange-400 text-sm text-center">
                  💡 Vous pouvez approuver, demander plus d'infos ou rejeter cette demande
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE - Documents */}
          <div className="space-y-4">
            <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon className="w-6 h-6 text-yellow-400" />
                <h3 className="text-white font-bold text-xl">Documents KYC</h3>
              </div>
              
              <div className="space-y-5">
                {/* Pièce Recto */}
                {selectedVerification.documents.idCard && (
                  <div className="bg-black/60 border-2 border-yellow-400/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-white font-bold text-lg">Pièce d'identité (Recto)</div>
                        <div className="text-white/60 text-xs">CNI / Passeport / Permis</div>
                      </div>
                      <FileText className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mb-4 border-2 border-yellow-400/20 hover:border-yellow-400/40 transition">
                      <div className="text-center p-6">
                        <ImageIcon className="w-20 h-20 text-yellow-400/30 mx-auto mb-3" />
                        <div className="text-white/40 text-sm font-semibold">Image de la pièce</div>
                        <div className="text-white/20 text-xs mt-1">Cliquer pour agrandir</div>
                      </div>
                    </div>
                    <button className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 border-2 border-yellow-400/40 text-yellow-400 font-bold py-3 rounded-lg transition">
                      🔍 Voir en plein écran
                    </button>
                  </div>
                )}

                {/* Pièce Verso */}
                {selectedVerification.documents.idCardBack && (
                  <div className="bg-black/60 border-2 border-yellow-400/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-white font-bold text-lg">Pièce d'identité (Verso)</div>
                        <div className="text-white/60 text-xs">Dos de la pièce</div>
                      </div>
                      <FileText className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mb-4 border-2 border-yellow-400/20 hover:border-yellow-400/40 transition">
                      <div className="text-center p-6">
                        <ImageIcon className="w-20 h-20 text-yellow-400/30 mx-auto mb-3" />
                        <div className="text-white/40 text-sm font-semibold">Image du verso</div>
                        <div className="text-white/20 text-xs mt-1">Cliquer pour agrandir</div>
                      </div>
                    </div>
                    <button className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 border-2 border-yellow-400/40 text-yellow-400 font-bold py-3 rounded-lg transition">
                      🔍 Voir en plein écran
                    </button>
                  </div>
                )}

                {/* Selfie */}
                {selectedVerification.documents.selfie && (
                  <div className="bg-black/60 border-2 border-yellow-400/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-white font-bold text-lg">Selfie avec pièce</div>
                        <div className="text-white/60 text-xs">Photo de vérification</div>
                      </div>
                      <User className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mb-4 border-2 border-yellow-400/20 hover:border-yellow-400/40 transition">
                      <div className="text-center p-6">
                        <User className="w-20 h-20 text-yellow-400/30 mx-auto mb-3" />
                        <div className="text-white/40 text-sm font-semibold">Photo selfie</div>
                        <div className="text-white/20 text-xs mt-1">Cliquer pour agrandir</div>
                      </div>
                    </div>
                    <button className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 border-2 border-yellow-400/40 text-yellow-400 font-bold py-3 rounded-lg transition">
                      🔍 Voir en plein écran
                    </button>
                  </div>
                )}

                {/* Justificatif */}
                {selectedVerification.documents.proof && (
                  <div className="bg-black/60 border-2 border-yellow-400/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-white font-bold text-lg">Justificatif de domicile</div>
                        <div className="text-white/60 text-xs">Facture / Quittance</div>
                      </div>
                      <FileText className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mb-4 border-2 border-yellow-400/20 hover:border-yellow-400/40 transition">
                      <div className="text-center p-6">
                        <FileText className="w-20 h-20 text-yellow-400/30 mx-auto mb-3" />
                        <div className="text-white/40 text-sm font-semibold">Document PDF</div>
                        <div className="text-white/20 text-xs mt-1">Format PDF</div>
                      </div>
                    </div>
                    <button className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 border-2 border-yellow-400/40 text-yellow-400 font-bold py-3 rounded-lg transition">
                      📄 Télécharger le PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - Sticky Bottom */}
      {selectedVerification.status === 'pending' && (
        <div className="bg-gradient-to-t from-gray-900 to-black/80 border-t-2 border-yellow-400/20 p-6 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleApprove(selectedVerification.id)}
              className="bg-green-500 hover:bg-green-600 text-white font-black py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl text-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Approuver ✓
            </button>

            <button
              onClick={() => handleRequestMoreInfo(selectedVerification.id)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl text-lg"
            >
              <AlertCircle className="w-6 h-6" />
              Plus d'infos ?
            </button>

            <button
              onClick={() => handleReject(selectedVerification.id)}
              className="bg-red-500 hover:bg-red-600 text-white font-black py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl text-lg"
            >
              <X className="w-6 h-6" />
              Rejeter ✗
            </button>
          </div>
        </div>
      )}

    </div>
  </div>
)}

        {/* Modal Rejet avec textarea */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-red-500/40 rounded-2xl max-w-2xl w-full">
              <div className="p-6 border-b border-red-500/20">
                <h3 className="text-2xl font-black text-white mb-2">
                  {selectedVerification?.status === 'rejected' ? 'Modifier la raison du rejet' : 'Rejeter la vérification'}
                </h3>
                <p className="text-white/60">Cette raison sera envoyée à l'utilisateur</p>
              </div>

              <div className="p-6">
                <label className="block text-white font-semibold mb-3">
                  Raison du rejet *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Exemple : Photo d'identité floue, veuillez soumettre une photo plus nette..."
                  rows="8"
                  className="w-full px-4 py-3 bg-black/60 border border-red-500/30 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-base leading-relaxed"
                />
                <div className="text-white/40 text-xs mt-2">
                  {rejectReason.length} caractères • Soyez précis pour aider l'utilisateur
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={confirmReject}
                    disabled={!rejectReason.trim()}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition"
                  >
                    {selectedVerification?.status === 'rejected' ? '✓ Enregistrer la modification' : '✗ Confirmer le rejet'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}