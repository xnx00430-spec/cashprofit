// app/(platform)/user/profil/kyc/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Upload, CheckCircle, AlertCircle, 
  User, Calendar, MapPin, CreditCard, Camera,
  ArrowLeft, Loader2, X, Clock
} from 'lucide-react';

// Composant Toast/Modal
function Toast({ show, type, title, message, onClose }) {
  if (!show) return null;

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  const icons = {
    success: <CheckCircle className="text-green-600 flex-shrink-0" size={22} />,
    error: <X className="text-red-600 flex-shrink-0" size={22} />,
    warning: <AlertCircle className="text-yellow-600 flex-shrink-0" size={22} />,
    info: <AlertCircle className="text-blue-600 flex-shrink-0" size={22} />
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className={`${colors[type]} border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in`}>
        <div className="flex items-start gap-3">
          {icons[type]}
          <div className="flex-1">
            <div className="font-bold text-base mb-1">{title}</div>
            <div className="text-sm opacity-90">{message}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-white/80 hover:bg-white text-gray-900 font-semibold py-2.5 rounded-xl transition-colors border border-gray-200"
        >
          OK
        </button>
      </div>
    </div>
  );
}

// Composant Décompte après soumission KYC
function KYCCountdown({ onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(180); // 3 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((180 - secondsLeft) / 180) * 100;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
        
        {/* Icône animée */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle 
              cx="50" cy="50" r="45" fill="none" stroke="#eab308" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock className="text-yellow-500" size={28} />
          </div>
        </div>

        <h2 className="text-gray-900 text-xl font-bold mb-2">Validation en cours...</h2>
        <p className="text-gray-600 text-sm mb-6">
          Vos documents sont en cours de vérification automatique
        </p>

        {/* Timer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <div className="text-yellow-600 text-4xl font-bold font-mono">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-yellow-600/70 text-xs mt-1">Temps restant estimé</div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-yellow-400 transition-all duration-1000 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-gray-500 text-xs">
          Vous serez redirigé automatiquement vers le portefeuille
        </div>
      </div>
    </div>
  );
}

export default function KYCPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ show: false, type: 'info', title: '', message: '' });
  
  const showToast = (type, title, message) => {
    setToast({ show: true, type, title, message });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };
  
  // États formulaire
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    idNumber: '',
    nationality: 'CI',
    address: ''
  });
  
  // États fichiers
  const [files, setFiles] = useState({
    idCardFront: null,
    idCardBack: null,
    selfie: null,
    proofOfAddress: null
  });
  
  // Preview URLs
  const [previews, setPreviews] = useState({
    idCardFront: null,
    idCardBack: null,
    selfie: null,
    proofOfAddress: null
  });

  const countries = [
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱' },
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' }
  ];

  useEffect(() => {
    setMounted(true);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        setFormData(prev => ({
          ...prev,
          fullName: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.name || '',
          address: data.user.address || ''
        }));
        
        if (data.user.kyc?.currentSubmission?.personalInfo) {
          const info = data.user.kyc.currentSubmission.personalInfo;
          setFormData({
            fullName: info.fullName || '',
            birthDate: info.birthDate ? info.birthDate.split('T')[0] : '',
            idNumber: info.idNumber || '',
            nationality: info.nationality || 'CI',
            address: info.address || ''
          });
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Fichier trop volumineux', 'Le fichier ne doit pas dépasser 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Format invalide', 'Le fichier doit être une image (JPG, PNG)');
      return;
    }

    setFiles(prev => ({ ...prev, [field]: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (field) => {
    setFiles(prev => ({ ...prev, [field]: null }));
    setPreviews(prev => ({ ...prev, [field]: null }));
  };

  const handleCountdownComplete = useCallback(() => {
    router.push('/user/portefeuille');
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.birthDate || !formData.idNumber || !formData.address) {
      showToast('error', 'Champs manquants', 'Tous les champs marqués * sont requis');
      return;
    }

    if (!files.idCardFront || !files.idCardBack || !files.selfie) {
      showToast('error', 'Documents manquants', 'Les 3 documents obligatoires sont requis : CNI Recto, CNI Verso, Selfie');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      Object.keys(files).forEach(key => {
        if (files[key]) {
          submitData.append(key, files[key]);
        }
      });

      const res = await fetch('/api/user/kyc/submit', {
        method: 'POST',
        body: submitData
      });

      const data = await res.json();

      if (data.success) {
        // Afficher le décompte 3 minutes
        setShowCountdown(true);
      } else {
        showToast('error', 'Erreur', data.message || 'Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('error', 'Erreur réseau', 'Impossible de contacter le serveur. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (user?.kyc?.status === 'approved') {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-lg">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-gray-900 text-2xl font-bold mb-2">Compte déjà vérifié</h2>
            <p className="text-gray-600 mb-6">Votre compte est déjà vérifié, aucune action requise.</p>
            <button onClick={() => router.push('/user/profil')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl transition-colors">
              Retour au profil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Toast */}
        <Toast {...toast} onClose={hideToast} />

        {/* Décompte 3 min après soumission */}
        {showCountdown && <KYCCountdown onComplete={handleCountdownComplete} />}
        
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/user/profil')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft size={20} />
            <span>Retour</span>
          </button>
          
          <h1 className="text-gray-900 text-3xl font-bold mb-2">Vérification KYC</h1>
          <p className="text-gray-600 text-sm">
            Soumettez vos documents pour votre premier retrait • Validation automatique en 3 minutes
          </p>
        </div>

        {/* Message admin */}
        {user?.kyc?.currentSubmission?.adminMessage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <div className="text-yellow-600 font-semibold mb-1">Message de l&apos;administrateur :</div>
                <div className="text-yellow-700 text-sm">{user.kyc.currentSubmission.adminMessage}</div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
          
          {/* Informations personnelles */}
          <div className="mb-8">
            <h2 className="text-gray-900 text-xl font-bold mb-4 flex items-center gap-2">
              <User size={20} />
              Informations personnelles
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm mb-2 block">Nom complet *</label>
                <input type="text" value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Jean Dupont"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none"
                  required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Date de naissance *</label>
                  <input type="date" value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none"
                    required />
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">Nationalité *</label>
                  <select value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none"
                    required>
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>{country.flag} {country.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-600 text-sm mb-2 block">Numéro CNI / Passeport *</label>
                <input type="text" value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  placeholder="CI123456789"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none"
                  required />
              </div>

              <div>
                <label className="text-gray-600 text-sm mb-2 block">Adresse complète *</label>
                <textarea value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Cocody, Abidjan, Côte d'Ivoire" rows={3}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:border-yellow-400 focus:outline-none resize-none"
                  required />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="mb-8">
            <h2 className="text-gray-900 text-xl font-bold mb-4 flex items-center gap-2">
              <FileText size={20} />
              Documents justificatifs
            </h2>

            <div className="space-y-4">
              <FileUploadBox label="Carte d'identité (Recto) *" field="idCardFront"
                file={files.idCardFront} preview={previews.idCardFront}
                onChange={handleFileChange} onRemove={removeFile} required />

              <FileUploadBox label="Carte d'identité (Verso) *" field="idCardBack"
                file={files.idCardBack} preview={previews.idCardBack}
                onChange={handleFileChange} onRemove={removeFile} required />

              <FileUploadBox label="Selfie avec CNI *"
                description="Photo de vous tenant votre CNI à côté de votre visage"
                field="selfie" file={files.selfie} preview={previews.selfie}
                onChange={handleFileChange} onRemove={removeFile} required />

              <FileUploadBox label="Justificatif de domicile (optionnel)"
                description="Facture d'eau, électricité, ou attestation de résidence"
                field="proofOfAddress" file={files.proofOfAddress} preview={previews.proofOfAddress}
                onChange={handleFileChange} onRemove={removeFile} />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div className="text-blue-700 text-sm">
                <div className="font-semibold mb-1">✨ Validation automatique en 3 minutes</div>
                <ul className="text-blue-600 space-y-1">
                  <li>• Photos claires et lisibles</li>
                  <li>• Documents non expirés</li>
                  <li>• Format JPG ou PNG (max 5MB par fichier)</li>
                  <li>• Après validation, vous pourrez retirer vos fonds</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4">
            <button type="button" onClick={() => router.push('/user/profil')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-4 rounded-xl font-semibold transition-colors"
              disabled={submitting}>
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md">
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</>
              ) : (
                <><Upload size={20} /> Soumettre mes documents</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FileUploadBox({ label, description, field, file, preview, onChange, onRemove, required }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-gray-900 font-semibold text-sm">{label}</div>
          {description && <div className="text-gray-600 text-xs mt-1">{description}</div>}
        </div>
      </div>

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
          <button type="button" onClick={() => onRemove(field)}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors shadow-md">
            <X size={16} />
          </button>
          <div className="mt-2 text-green-600 text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{file.name}</span>
          </div>
        </div>
      ) : (
        <label className="block cursor-pointer">
          <input type="file" accept="image/*" onChange={(e) => onChange(field, e)} className="hidden" />
          <div className="border-2 border-dashed border-gray-300 hover:border-yellow-400 bg-white rounded-lg p-8 text-center transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-600 text-sm">Cliquez pour sélectionner un fichier</div>
            <div className="text-gray-500 text-xs mt-1">JPG, PNG (max 5MB)</div>
          </div>
        </label>
      )}
    </div>
  );
}