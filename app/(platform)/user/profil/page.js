// app/(platform)/user/profil/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, Mail, Phone, MapPin, Calendar, Shield,
  Edit2, Save, X, Copy, CheckCircle, Camera,
  Lock, Key, Eye, EyeOff, Award, TrendingUp,
  Users, DollarSign, FileText, Upload, MessageCircle, Headphones
} from 'lucide-react';

export default function ProfilPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  });
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const profileRes = await fetch('/api/user/profile');
      const profileData = await profileRes.json();
      
      if (profileData.success) {
        setUser(profileData.user);
        setEditData({
          firstName: profileData.user.firstName || '',
          lastName: profileData.user.lastName || '',
          phone: profileData.user.phone || '',
          address: profileData.user.address || ''
        });
        
        setStats({
          totalInvested: profileData.user.totalInvested || 0,
          totalEarnings: profileData.user.balance || 0,
          activeInvestments: 0,
          totalReferrals: 0
        });
      }

      try {
        const invRes = await fetch('/api/user/investments');
        const invData = await invRes.json();
        if (invData.success) {
          setStats(prev => ({
            ...prev,
            activeInvestments: invData.investments?.length || 0
          }));
        }
      } catch (e) {
        console.error('Erreur investments:', e);
      }

      try {
        const refRes = await fetch('/api/user/referrals');
        const refData = await refRes.json();
        if (refData.success) {
          setStats(prev => ({
            ...prev,
            totalReferrals: refData.referrals?.length || 0
          }));
        }
      } catch (e) {
        console.error('Erreur referrals:', e);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      const data = await res.json();
      
      if (data.success) {
        setUser({ ...user, ...editData });
        setIsEditing(false);
        alert('✅ Profil mis à jour avec succès');
        fetchUserData();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur réseau');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('❌ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('✅ Mot de passe modifié avec succès');
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur réseau');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900">Erreur de chargement</div>
      </div>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-gray-900 text-3xl font-bold mb-2">Mon Profil</h1>
          <p className="text-gray-600 text-sm">
            Gérez vos informations personnelles et paramètres
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLONNE GAUCHE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CARD PRINCIPALE */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                    <h2 className="text-gray-900 text-2xl font-bold">{fullName}</h2>
                    {user.kyc?.status === 'approved' && (
                      <div className="bg-green-50 border border-green-200 rounded-full px-3 py-1 flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-green-600 text-xs font-medium">Vérifié</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 justify-center md:justify-start">
                      <Mail size={14} />
                      <span>
                        {showEmail ? user.email : user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                      </span>
                      <button onClick={() => setShowEmail(!showEmail)} className="text-gray-500 hover:text-gray-900 transition-colors">
                        {showEmail ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    
                    {user.phone && (
                      <div className="flex items-center gap-2 text-gray-600 justify-center md:justify-start">
                        <Phone size={14} />
                        <span>
                          {showPhone ? user.phone : user.phone?.replace(/(\d{3})(\d*)(\d{2})/, '$1****$3')}
                        </span>
                        <button onClick={() => setShowPhone(!showPhone)} className="text-gray-500 hover:text-gray-900 transition-colors">
                          {showPhone ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )}
                    
                    {user.address && (
                      <div className="flex items-center gap-2 text-gray-600 justify-center md:justify-start">
                        <MapPin size={14} />
                        <span>{user.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 justify-center md:justify-start">
                      <Calendar size={14} />
                      <span>Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <button onClick={() => setIsEditing(true)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                    <Edit2 size={16} />
                    <span>Modifier</span>
                  </button>
                )}
              </div>

              {isEditing && (
                <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
                  <h3 className="text-gray-900 font-bold mb-4">Modifier mes informations</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">Prénom</label>
                      <input type="text" value={editData.firstName} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">Nom</label>
                      <input type="text" value={editData.lastName} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">Téléphone</label>
                      <input type="tel" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">Adresse</label>
                      <input type="text" value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                        <X size={18} /> Annuler
                      </button>
                      <button onClick={handleSaveProfile}
                        className="flex-1 bg-yellow-400 text-white py-3 rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md">
                        <Save size={18} /> Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-700 text-xs mb-1">Code de parrainage</div>
                    <div className="text-gray-900 text-xl font-mono font-bold">
                      {user.referralCode || user.sponsorCode || '---'}
                    </div>
                  </div>
                  <button onClick={() => copyToClipboard(user.referralCode || user.sponsorCode)}
                    className="bg-yellow-100 hover:bg-yellow-200 border border-yellow-200 text-yellow-700 p-3 rounded-lg transition-colors">
                    {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* SÉCURITÉ */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Shield className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-900 text-xl font-bold">Sécurité</h3>
                  <p className="text-gray-600 text-sm">Protégez votre compte</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <button onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="w-full bg-white/70 backdrop-blur-xl hover:bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <Lock className="text-gray-600" size={20} />
                      <div className="text-left">
                        <div className="text-gray-900 font-semibold">Mot de passe</div>
                        <div className="text-gray-600 text-xs">Cliquez pour modifier</div>
                      </div>
                    </div>
                    <Key className="text-gray-600" size={20} />
                  </button>

                  {showPasswordForm && (
                    <div className="mt-4 bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl p-4 space-y-4 shadow-sm">
                      <div>
                        <label className="text-gray-600 text-xs mb-2 block">Mot de passe actuel</label>
                        <div className="relative">
                          <input type={showPasswords.current ? 'text' : 'password'} value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 pr-10 focus:border-yellow-400 focus:outline-none" />
                          <button onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                            {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-600 text-xs mb-2 block">Nouveau mot de passe</label>
                        <div className="relative">
                          <input type={showPasswords.new ? 'text' : 'password'} value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 pr-10 focus:border-yellow-400 focus:outline-none" />
                          <button onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                            {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-600 text-xs mb-2 block">Confirmer nouveau mot de passe</label>
                        <div className="relative">
                          <input type={showPasswords.confirm ? 'text' : 'password'} value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 pr-10 focus:border-yellow-400 focus:outline-none" />
                          <button onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                            {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <button onClick={handleChangePassword}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-md">
                        Modifier le mot de passe
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUPPORT */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Headphones className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-900 text-xl font-bold">Support</h3>
                  <p className="text-gray-600 text-sm">Besoin d'aide ? Contactez-nous</p>
                </div>
              </div>

              <div className="space-y-3">
                <a href="mailto:support@cashprofit.fr"
                  className="w-full bg-white/70 backdrop-blur-xl hover:bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4 transition-colors shadow-sm">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-semibold text-sm">Email</div>
                    <div className="text-gray-600 text-xs">support@cashprofit.fr</div>
                  </div>
                  <div className="text-gray-400 text-xs">Réponse sous 24h</div>
                </a>

                <a href="https://wa.me/47XXXXXXXXXXXX?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20CashProfit"
                  target="_blank" rel="noopener noreferrer"
                  className="w-full bg-white/70 backdrop-blur-xl hover:bg-green-50 border border-gray-200 hover:border-green-200 rounded-xl p-4 flex items-center gap-4 transition-colors shadow-sm">
                  <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-semibold text-sm">WhatsApp</div>
                    <div className="text-gray-600 text-xs">Chat en direct avec le support</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600 text-xs font-medium">En ligne</span>
                  </div>
                </a>
              </div>

              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-gray-600 text-xs text-center">
                  Notre équipe est disponible du lundi au samedi, de 9h à 18h (GMT)
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-6">
            
            {/* NIVEAU */}
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Award className="text-white" size={32} />
                <div>
                  <div className="text-white/70 text-xs">Niveau actuel</div>
                  <div className="text-white text-3xl font-bold">Niveau {user.level || 1}</div>
                </div>
              </div>
              <Link href="/user/reseau"
                className="block w-full bg-white text-yellow-600 py-3 rounded-xl font-semibold text-center hover:bg-gray-50 transition-colors shadow-md">
                Voir progression
              </Link>
            </div>

            {/* STATS */}
            {stats && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                <h3 className="text-gray-900 font-bold mb-4">Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Total investi</span>
                    <span className="text-gray-900 font-bold">{stats.totalInvested?.toLocaleString() || 0} F</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Investissements actifs</span>
                    <span className="text-gray-900 font-bold">{stats.activeInvestments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Affiliés</span>
                    <span className="text-gray-900 font-bold">{stats.totalReferrals || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* KYC */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-gray-600" size={20} />
                <h3 className="text-gray-900 font-bold">Vérification d'identité</h3>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Compte vérifié</span>
                </div>
                <div className="text-center text-green-600 text-xs mt-2">
                  Toutes les fonctionnalités sont accessibles
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}