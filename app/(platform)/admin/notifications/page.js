"use client";

import React, { useState } from 'react';
import { Send, Users, User, Bell, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminNotifications() {
  const [notificationType, setNotificationType] = useState('all'); // 'all' or 'single'
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Données de démonstration
  const users = [
    { id: 1, name: 'Jean Kouassi', email: 'jean.k@example.com' },
    { id: 2, name: 'Marie Diallo', email: 'marie.d@example.com' },
    { id: 3, name: 'Paul Soro', email: 'paul.s@example.com' },
    { id: 4, name: 'Sophie Loukou', email: 'sophie.l@example.com' },
    { id: 5, name: 'Alex Martin', email: 'alex.m@example.com' }
  ];

  const recentNotifications = [
    {
      id: 1,
      title: 'Maintenance planifiée',
      message: 'La plateforme sera en maintenance dimanche de 2h à 4h.',
      recipient: 'Tous les utilisateurs',
      date: '2024-01-26 14:30',
      status: 'sent'
    },
    {
      id: 2,
      title: 'Nouveau taux de rendement',
      message: 'Les taux de rendement ont été mis à jour.',
      recipient: 'Marie Diallo',
      date: '2024-01-25 10:15',
      status: 'sent'
    },
    {
      id: 3,
      title: 'Compte vérifié',
      message: 'Votre compte a été vérifié avec succès.',
      recipient: 'Paul Soro',
      date: '2024-01-24 16:45',
      status: 'sent'
    }
  ];

  const handleSend = () => {
    setError('');
    
    // Validation
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!message.trim()) {
      setError('Le message est requis');
      return;
    }
    if (notificationType === 'single' && !selectedUser) {
      setError('Veuillez sélectionner un utilisateur');
      return;
    }

    // Envoi
    console.log('Envoi notification:', {
      type: notificationType,
      user: selectedUser,
      title,
      message
    });

    // API call ici

    // Success
    setSent(true);
    setTitle('');
    setMessage('');
    setSelectedUser('');
    
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Notifications</h1>
          <p className="text-white/60">Envoyer des messages aux utilisateurs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulaire Envoi */}
          <div className="space-y-6">
            {/* Alert succès */}
            {sent && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="text-green-400 font-semibold">Notification envoyée avec succès !</div>
              </div>
            )}

            {/* Alert erreur */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div className="text-red-400 font-semibold">{error}</div>
              </div>
            )}

            <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Nouvelle Notification</h2>
              </div>

              <div className="space-y-4">
                {/* Type de destinataire */}
                <div>
                  <label className="block text-white/60 text-sm mb-3">Destinataire</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNotificationType('all')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        notificationType === 'all'
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-yellow-400/20 bg-black/40 hover:border-yellow-400/40'
                      }`}
                    >
                      <Users className={`w-6 h-6 mx-auto mb-2 ${notificationType === 'all' ? 'text-yellow-400' : 'text-white/60'}`} />
                      <div className={`font-semibold text-sm ${notificationType === 'all' ? 'text-white' : 'text-white/60'}`}>
                        Tous les utilisateurs
                      </div>
                    </button>

                    <button
                      onClick={() => setNotificationType('single')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        notificationType === 'single'
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-yellow-400/20 bg-black/40 hover:border-yellow-400/40'
                      }`}
                    >
                      <User className={`w-6 h-6 mx-auto mb-2 ${notificationType === 'single' ? 'text-yellow-400' : 'text-white/60'}`} />
                      <div className={`font-semibold text-sm ${notificationType === 'single' ? 'text-white' : 'text-white/60'}`}>
                        Un utilisateur
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sélection utilisateur */}
                {notificationType === 'single' && (
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Sélectionner l'utilisateur</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="">Choisir un utilisateur...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Titre */}
                <div>
                  <label className="block text-white/60 text-sm mb-2">Titre de la notification</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Maintenance planifiée"
                    className="w-full px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-white/60 text-sm mb-2">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    rows="6"
                    className="w-full px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  />
                  <div className="text-white/40 text-xs mt-1">{message.length} caractères</div>
                </div>

                {/* Bouton Envoyer */}
                <button
                  onClick={handleSend}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Envoyer la notification
                </button>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Notifications Récentes</h2>

            <div className="space-y-4">
              {recentNotifications.map((notif) => (
                <div key={notif.id} className="bg-black/40 border border-yellow-400/10 rounded-xl p-4 hover:border-yellow-400/30 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-white font-semibold mb-1">{notif.title}</div>
                      <div className="text-white/70 text-sm mb-2">{notif.message}</div>
                    </div>
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <User className="w-3 h-3" />
                      {notif.recipient}
                    </div>
                    <div className="text-white/40">{notif.date}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message templates suggestion */}
            <div className="mt-6 pt-6 border-t border-yellow-400/10">
              <div className="text-white/60 text-sm mb-3">Messages rapides :</div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setTitle('Maintenance planifiée');
                    setMessage('La plateforme sera en maintenance ce dimanche de 2h à 4h du matin. Vos investissements continueront de générer des gains normalement.');
                  }}
                  className="w-full text-left px-4 py-3 bg-black/40 border border-yellow-400/10 rounded-lg text-white/80 hover:bg-yellow-400/10 hover:border-yellow-400/30 transition text-sm"
                >
                  📅 Maintenance planifiée
                </button>
                <button
                  onClick={() => {
                    setTitle('Nouveau taux de rendement');
                    setMessage('Bonne nouvelle ! Les taux de rendement ont été mis à jour. Connectez-vous pour voir vos nouveaux gains.');
                  }}
                  className="w-full text-left px-4 py-3 bg-black/40 border border-yellow-400/10 rounded-lg text-white/80 hover:bg-yellow-400/10 hover:border-yellow-400/30 transition text-sm"
                >
                  📈 Nouveau taux
                </button>
                <button
                  onClick={() => {
                    setTitle('Compte vérifié');
                    setMessage('Félicitations ! Votre compte a été vérifié avec succès. Vous pouvez maintenant investir et retirer vos gains.');
                  }}
                  className="w-full text-left px-4 py-3 bg-black/40 border border-yellow-400/10 rounded-lg text-white/80 hover:bg-yellow-400/10 hover:border-yellow-400/30 transition text-sm"
                >
                  ✅ Compte vérifié
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}