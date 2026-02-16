// app/(platform)/user/notifications/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, XCircle, Clock, 
  DollarSign, Users, FileText, Gift, 
  TrendingUp, AlertCircle, Check, X
} from 'lucide-react';

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url = filter === 'unread' 
        ? '/api/user/notifications?unread=true'
        : '/api/user/notifications';
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      });

      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
        // Mettre à jour localement
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });

      const data = await res.json();
      if (data.success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getIcon = (type) => {
    const iconMap = {
      investment_success: <TrendingUp className="text-green-400" size={20} />,
      withdrawal_requested: <Clock className="text-yellow-400" size={20} />,
      withdrawal_approved: <CheckCircle className="text-green-400" size={20} />,
      withdrawal_rejected: <XCircle className="text-red-400" size={20} />,
      withdrawal_completed: <CheckCircle className="text-green-400" size={20} />,
      referral_registered: <Users className="text-blue-400" size={20} />,
      referral_invested: <DollarSign className="text-green-400" size={20} />,
      commission_earned: <DollarSign className="text-yellow-400" size={20} />,
      kyc_requested: <FileText className="text-yellow-400" size={20} />,
      kyc_approved: <CheckCircle className="text-green-400" size={20} />,
      kyc_rejected: <XCircle className="text-red-400" size={20} />,
      admin_message: <Bell className="text-blue-400" size={20} />,
      level_up: <Gift className="text-purple-400" size={20} />,
      bonus_earned: <Gift className="text-yellow-400" size={20} />
    };
    return iconMap[type] || <Bell className="text-gray-400" size={20} />;
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-gray-400 text-sm">
                {unreadCount > 0 && `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                <Check size={16} />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Filtres */}
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
                filter === 'unread'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Non lues
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-400 mt-4">Chargement...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-bold mb-2">Aucune notification</h3>
            <p className="text-gray-400">
              {filter === 'unread' 
                ? 'Toutes vos notifications ont été lues'
                : 'Vous n\'avez pas encore de notifications'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => !notif.read && markAsRead(notif._id)}
                className={`bg-gray-900 border rounded-2xl p-4 transition-all cursor-pointer ${
                  notif.read 
                    ? 'border-gray-800 hover:bg-gray-800/50' 
                    : 'border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    notif.read ? 'bg-gray-800' : 'bg-yellow-400/10'
                  }`}>
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-white font-semibold">
                        {notif.title}
                      </h3>
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {getTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {notif.message}
                    </p>
                  </div>

                  {/* Badge non lu */}
                  {!notif.read && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}