"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Menu, 
  X,
  LogOut,
  CreditCard
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard
    },
    {
      name: 'Retraits',
      path: '/admin/retraits',
      icon: Wallet
    },
    {
      name: 'Investisseurs',
      path: '/admin/investisseurs',
      icon: Users
    },
    {
      name: 'Gestion Manuelle',
      path: '/admin/credit',
      icon: CreditCard
    }
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          <div className="flex h-20 shrink-0 items-center">
            <div className="text-2xl font-black text-gray-900">INVEST</div>
            <div className="ml-2 px-2 py-1 bg-yellow-400 border border-yellow-500 rounded text-white text-xs font-bold">
              ADMIN
            </div>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => router.push(item.path)}
                      className={`group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 w-full transition-all ${
                        active
                          ? 'bg-yellow-400 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`} />
                      {item.name}
                    </button>
                  </li>
                );
              })}

              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 w-full text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Déconnexion
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />

            <div className="relative flex w-full max-w-xs flex-col bg-white border-r border-gray-200 shadow-2xl">
              <div className="absolute top-0 right-0 -mr-12 pt-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
                >
                  <X className="h-6 w-6 text-gray-900" />
                </button>
              </div>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4">
                <div className="flex h-20 shrink-0 items-center">
                  <div className="text-2xl font-black text-gray-900">INVEST</div>
                  <div className="ml-2 px-2 py-1 bg-yellow-400 border border-yellow-500 rounded text-white text-xs font-bold">
                    ADMIN
                  </div>
                </div>

                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      
                      return (
                        <li key={item.name}>
                          <button
                            onClick={() => {
                              router.push(item.path);
                              setSidebarOpen(false);
                            }}
                            className={`group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 w-full transition-all ${
                              active
                                ? 'bg-yellow-400 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-gray-600'}`} />
                            {item.name}
                          </button>
                        </li>
                      );
                    })}

                    <li className="mt-auto">
                      <button
                        onClick={handleLogout}
                        className="group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 w-full text-red-600 hover:bg-red-50 transition-all"
                      >
                        <LogOut className="h-5 w-5 shrink-0" />
                        Déconnexion
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 text-center">
            <div className="text-lg font-black text-gray-900">INVEST ADMIN</div>
          </div>
        </div>

        <main>
          {children}
        </main>
      </div>
    </div>
  );
}