// app/(platform)/user/layout.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  TrendingUp, Wallet, Rocket, Users, 
  User, Bell, Menu, ChevronDown, LogOut, Settings, Loader2,
  CheckCircle, XCircle, Clock, DollarSign, FileText, Gift, AlertCircle
} from 'lucide-react';

// Logo Cash Profit
function CashProfitLogo({ size = 'default' }) {
  const sizes = {
    small: { wrapper: 'gap-1.5', icon: 'w-6 h-6 text-[10px]', text: 'text-sm', sub: 'text-[8px] px-1 py-0' },
    default: { wrapper: 'gap-2', icon: 'w-8 h-8 text-xs', text: 'text-lg', sub: 'text-[9px] px-1.5 py-0.5' },
    large: { wrapper: 'gap-3', icon: 'w-10 h-10 text-sm', text: 'text-xl', sub: 'text-[10px] px-2 py-0.5' }
  };
  const s = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center ${s.wrapper}`}>
      <div className={`${s.icon} bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-yellow-500/30`}>
        C₽
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.text} font-black tracking-tight text-gray-900`}>
          Cash<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">Profit</span>
        </span>
      </div>
    </div>
  );
}

export default function UserLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/user/notifications?limit=5');
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
        setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => { setShowUserMenu(false); setShowNotifications(false); };
    if (showUserMenu || showNotifications) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu, showNotifications]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (response.ok) router.push('/auth/login');
      else setIsLoggingOut(false);
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      investment_success: <TrendingUp className="text-green-500" size={18} />,
      withdrawal_requested: <Clock className="text-yellow-500" size={18} />,
      withdrawal_approved: <CheckCircle className="text-green-500" size={18} />,
      withdrawal_rejected: <XCircle className="text-red-500" size={18} />,
      withdrawal_completed: <CheckCircle className="text-green-500" size={18} />,
      referral_registered: <Users className="text-blue-500" size={18} />,
      referral_invested: <DollarSign className="text-green-500" size={18} />,
      commission_earned: <DollarSign className="text-yellow-500" size={18} />,
      kyc_requested: <FileText className="text-yellow-500" size={18} />,
      kyc_approved: <CheckCircle className="text-green-500" size={18} />,
      kyc_rejected: <XCircle className="text-red-500" size={18} />,
      admin_message: <Bell className="text-blue-500" size={18} />,
      level_up: <Gift className="text-purple-500" size={18} />,
      bonus_earned: <Gift className="text-yellow-500" size={18} />
    };
    return iconMap[type] || <Bell className="text-gray-500" size={18} />;
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} j`;
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const navItems = [
    { id: 'marche', label: 'Marché', icon: TrendingUp, href: '/user', description: 'Aperçu global' },
    { id: 'portefeuille', label: 'Portefeuille', icon: Wallet, href: '/user/portefeuille', description: 'Soldes & retraits' },
    { id: 'investir', label: 'Investir', icon: Rocket, href: '/user/investir', isMain: true, description: 'Opportunités' },
    { id: 'reseau', label: 'Réseau', icon: Users, href: '/user/reseau', description: 'Filleuls & gains' },
    { id: 'profil', label: 'Profil', icon: User, href: '/user/profil', description: 'Paramètres' },
  ];

  return (
    <div className="min-h-screen bg-white">
      
      {/* DESKTOP HEADER */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 px-6">
        <div className="flex items-center justify-between w-full max-w-[1920px] mx-auto">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <Menu size={20} />
            </button>
            <CashProfitLogo size="default" />
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-gray-600">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <>
                        {notifications.map((notif) => (
                          <div 
                            key={notif._id} 
                            onClick={() => { if (!notif.read) markAsRead(notif._id); router.push('/user/notifications'); }}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-2 transition-colors ${notif.read ? 'border-transparent' : 'border-yellow-400 bg-yellow-50'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.read ? 'bg-gray-100' : 'bg-yellow-100'}`}>
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">{notif.title}</h4>
                                <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                                <span className="text-xs text-gray-500 mt-1.5 inline-block">{getTimeAgo(notif.createdAt)}</span>
                              </div>
                              {!notif.read && <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-1.5"></div>}
                            </div>
                          </div>
                        ))}
                        <Link href="/user/notifications" className="block px-4 py-3 text-center text-sm text-yellow-600 hover:bg-gray-50 border-t border-gray-200">
                          Voir toutes les notifications
                        </Link>
                      </>
                    ) : (
                      <div className="px-4 py-12 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Aucune notification</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : getInitials(user?.name)}
                  </div>
                )}
                {!isLoading && user && (
                  <>
                    <span className="text-sm text-gray-700 font-medium">{user.name}</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </>
                )}
              </button>

              {showUserMenu && user && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1">
                      <span className="text-xs font-medium text-yellow-600">Niveau {user.level || 1}</span>
                    </div>
                  </div>
                  <Link href="/user/profil" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                    <User size={16} /> Mon profil
                  </Link>
                  <Link href="/user/parametres" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                    <Settings size={16} /> Paramètres
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button onClick={handleLogout} disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm disabled:opacity-50">
                    {isLoggingOut ? (<><Loader2 size={16} className="animate-spin" /> Déconnexion...</>) : (<><LogOut size={16} /> Se déconnecter</>)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex fixed left-0 top-16 bottom-0 bg-white/80 backdrop-blur-md border-r border-gray-200 transition-all duration-300 z-40 flex-col ${showSidebar ? 'w-60' : 'w-20'}`}>
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            if (item.isMain) {
              return (
                <Link key={item.id} href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-600 hover:from-yellow-500 hover:to-amber-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl ${!showSidebar ? 'justify-center' : ''}`}
                  title={!showSidebar ? item.label : ''}>
                  <Icon size={20} strokeWidth={2.5} />
                  {showSidebar && (<div className="flex-1"><div>{item.label}</div><div className="text-xs opacity-75">{item.description}</div></div>)}
                </Link>
              );
            }
            
            return (
              <Link key={item.id} href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'} ${!showSidebar ? 'justify-center' : ''}`}
                title={!showSidebar ? item.label : ''}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {showSidebar && (<div className="flex-1"><div className="text-sm">{item.label}</div><div className="text-xs opacity-60">{item.description}</div></div>)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <CashProfitLogo size="small" />
        
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
            className="p-2 text-gray-600 relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99' : unreadCount}
              </span>
            )}
          </button>

          <button onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }} className="relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : getInitials(user?.name)}
              </div>
            )}
          </button>
        </div>

        {/* Mobile User Menu */}
        {showUserMenu && user && (
          <div className="absolute top-14 right-0 w-64 bg-white/95 backdrop-blur-xl rounded-b-xl shadow-2xl border-b border-x border-gray-200 py-2 z-50" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1">
                <span className="text-xs font-medium text-yellow-600">Niveau {user.level || 1}</span>
              </div>
            </div>
            <Link href="/user/profil" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
              <User size={16} /> Mon profil
            </Link>
            <Link href="/user/parametres" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
              <Settings size={16} /> Paramètres
            </Link>
            <div className="border-t border-gray-200 my-1"></div>
            <button onClick={handleLogout} disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm disabled:opacity-50">
              {isLoggingOut ? (<><Loader2 size={16} className="animate-spin" /> Déconnexion...</>) : (<><LogOut size={16} /> Se déconnecter</>)}
            </button>
          </div>
        )}

        {/* Mobile Notifications */}
        {showNotifications && (
          <div className="absolute top-14 right-0 left-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg max-h-96 overflow-y-auto z-50" onClick={(e) => e.stopPropagation()}>
            {notifications.length > 0 ? (
              <>
                {notifications.map((notif) => (
                  <div key={notif._id}
                    onClick={() => { if (!notif.read) markAsRead(notif._id); router.push('/user/notifications'); }}
                    className={`px-4 py-3 border-l-2 ${notif.read ? 'border-transparent' : 'border-yellow-400 bg-yellow-50'}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.read ? 'bg-gray-100' : 'bg-yellow-100'}`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                        <span className="text-xs text-gray-500 mt-1 inline-block">{getTimeAgo(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/user/notifications" className="block px-4 py-3 text-center text-sm text-yellow-600 border-t border-gray-200">Voir tout</Link>
              </>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">Aucune notification</div>
            )}
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className={`transition-all duration-300 pt-20 lg:pt-16 pb-24 lg:pb-6 ${showSidebar ? 'lg:ml-60' : 'lg:ml-20'}`}>
        {children}
      </main>

      {/* BOUTON WHATSAPP SUPPORT */}
      <a
        href="https://wa.me/47XXXXXXXXXXXX?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20CashProfit"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-3.5 rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-105"
        title="Contacter le support"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isMain) {
              return (
                <div key={item.id} className="relative flex flex-col items-center">
                  <Link href={item.href} className="-mt-6">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-600 p-3.5 rounded-full shadow-lg shadow-yellow-500/30">
                      <Icon size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                  </Link>
                  <span className="text-[10px] font-medium mt-2 text-gray-900 whitespace-nowrap">{item.label}</span>
                </div>
              );
            }

            return (
              <Link key={item.id} href={item.href}
                className={`flex flex-col items-center p-2 transition-colors ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}