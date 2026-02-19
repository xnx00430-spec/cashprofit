// app/(platform)/user/profil/kyc/page.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, CheckCircle, AlertCircle, 
  ArrowLeft, Loader2, X, Clock, Camera, ChevronDown
} from 'lucide-react';

// ==================== COUNTDOWN 10s ====================
function KYCCountdown({ onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(timer); onComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onComplete]);

  const progress = ((10 - secondsLeft) / 10) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#111827" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-900 text-lg font-bold font-mono">{secondsLeft}s</span>
          </div>
        </div>
        <h2 className="text-gray-900 text-lg font-bold mb-1">Vérification en cours</h2>
        <p className="text-gray-500 text-sm mb-5">Validation de vos documents</p>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-gray-900 transition-all duration-1000 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

// ==================== CAMERA ====================
function CameraCapture({ onCapture, onClose, title }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facing, setFacing] = useState('environment');

  const start = useCallback(async (mode) => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setError(null);
    } catch { setError(true); }
  }, []);

  useEffect(() => { start(facing); return () => { if (stream) stream.getTracks().forEach(t => t.stop()); }; }, []);

  const flip = () => { const m = facing === 'environment' ? 'user' : 'environment'; setFacing(m); start(m); };

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (blob) {
        onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }), URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.85);
    if (stream) stream.getTracks().forEach(t => t.stop());
  };

  const close = () => { if (stream) stream.getTracks().forEach(t => t.stop()); onClose(); };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between bg-black">
        <button onClick={close} className="text-white"><X size={22} /></button>
        <span className="text-white text-sm font-medium">{title}</span>
        <button onClick={flip} className="text-white text-xs border border-white/30 px-3 py-1 rounded-full">Retourner</button>
      </div>
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {error ? (
          <div className="text-center text-white px-6">
            <p className="mb-3 text-sm">Accès caméra refusé</p>
            <button onClick={() => start(facing)} className="text-sm underline">Réessayer</button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"
            style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
        )}
        <canvas ref={canvasRef} className="hidden" />
        {/* Guide */}
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="border border-white/25 rounded-xl aspect-[3/2]" />
        </div>
      </div>
      {!error && (
        <div className="bg-black py-6 flex justify-center">
          <button onClick={capture}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform">
            <div className="w-12 h-12 bg-white rounded-full" />
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== DOCUMENT UPLOAD ====================
function DocUpload({ label, sublabel, field, file, preview, onFileChange, onCameraCapture, onRemove }) {
  const [showCam, setShowCam] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {showCam && (
        <CameraCapture title={label}
          onCapture={(f, url) => { onCameraCapture(field, f, url); setShowCam(false); }}
          onClose={() => setShowCam(false)} />
      )}

      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-gray-900 text-sm font-medium">{label}</div>
        {sublabel && <div className="text-gray-500 text-xs">{sublabel}</div>}
      </div>

      {preview ? (
        <div className="relative p-3">
          <img src={preview} alt="" className="w-full h-44 object-cover rounded-lg" />
          <button type="button" onClick={() => onRemove(field)}
            className="absolute top-5 right-5 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setShowCam(true)}
            className="flex items-center justify-center gap-2 py-4 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Camera size={16} /> Prendre une photo
          </button>
          <label className="flex items-center justify-center gap-2 py-4 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload size={16} /> Importer
            <input type="file" accept="image/*" onChange={(e) => onFileChange(field, e)} className="hidden" />
          </label>
        </div>
      )}
    </div>
  );
}

// ==================== PAGE ====================
export default function KYCPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [error, setError] = useState(null);

  const [docType, setDocType] = useState('cni');
  const [formData, setFormData] = useState({ fullName: '', birthDate: '', idNumber: '', nationality: 'CI', address: '' });
  const [files, setFiles] = useState({ front: null, back: null, selfie: null });
  const [previews, setPreviews] = useState({ front: null, back: null, selfie: null });

  const docConfig = {
    cni: { label: "Carte d'identité nationale", hasBack: true, numLabel: 'Numéro de la CNI', numPlaceholder: 'Ex: CI-0123456789' },
    passport: { label: 'Passeport', hasBack: false, numLabel: 'Numéro du passeport', numPlaceholder: 'Ex: P1234567' },
    permis: { label: 'Permis de conduire', hasBack: true, numLabel: 'Numéro du permis', numPlaceholder: 'Ex: PC-0123456' }
  };

  const cfg = docConfig[docType];

  const countries = [
    { code: 'CI', name: "Côte d'Ivoire" }, { code: 'SN', name: 'Sénégal' }, { code: 'BF', name: 'Burkina Faso' },
    { code: 'ML', name: 'Mali' }, { code: 'BJ', name: 'Bénin' }, { code: 'TG', name: 'Togo' },
    { code: 'GH', name: 'Ghana' }, { code: 'NG', name: 'Nigeria' }, { code: 'CM', name: 'Cameroun' },
    { code: 'CG', name: 'Congo' }, { code: 'CD', name: 'RD Congo' }, { code: 'GA', name: 'Gabon' },
    { code: 'KE', name: 'Kenya' }, { code: 'RW', name: 'Rwanda' }, { code: 'TZ', name: 'Tanzanie' },
    { code: 'UG', name: 'Ouganda' }
  ];

  useEffect(() => { setMounted(true); fetchUser(); }, []);

  useEffect(() => {
    setFiles({ front: null, back: null, selfie: null });
    setPreviews({ front: null, back: null, selfie: null });
  }, [docType]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setFormData(prev => ({
          ...prev,
          fullName: data.user.name || `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
          address: data.user.address || ''
        }));
        if (data.user.kyc?.currentSubmission?.personalInfo) {
          const info = data.user.kyc.currentSubmission.personalInfo;
          setFormData({
            fullName: info.fullName || '', birthDate: info.birthDate ? info.birthDate.split('T')[0] : '',
            idNumber: info.idNumber || '', nationality: info.nationality || 'CI', address: info.address || ''
          });
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const onFileChange = (field, e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Fichier trop volumineux (max 5 Mo)'); return; }
    if (!f.type.startsWith('image/')) { setError('Format invalide, image requise'); return; }
    setFiles(prev => ({ ...prev, [field]: f }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviews(prev => ({ ...prev, [field]: reader.result }));
    reader.readAsDataURL(f);
    setError(null);
  };

  const onCameraCapture = (field, file, url) => {
    setFiles(prev => ({ ...prev, [field]: file }));
    setPreviews(prev => ({ ...prev, [field]: url }));
    setError(null);
  };

  const removeFile = (field) => {
    setFiles(prev => ({ ...prev, [field]: null }));
    setPreviews(prev => ({ ...prev, [field]: null }));
  };

  const handleCountdownComplete = useCallback(() => router.push('/user/portefeuille'), [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName || !formData.birthDate || !formData.idNumber || !formData.address) {
      setError('Veuillez remplir tous les champs obligatoires'); return;
    }
    if (!files.front) { setError('Veuillez ajouter la photo recto du document'); return; }
    if (cfg.hasBack && !files.back) { setError('Veuillez ajouter la photo verso du document'); return; }
    if (!files.selfie) { setError('Veuillez ajouter votre selfie avec le document'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', formData.fullName);
      fd.append('birthDate', formData.birthDate);
      fd.append('idNumber', formData.idNumber);
      fd.append('nationality', formData.nationality);
      fd.append('address', formData.address);
      fd.append('docType', docType);
      fd.append('idCardFront', files.front);
      if (files.back) fd.append('idCardBack', files.back);
      fd.append('selfie', files.selfie);

      const res = await fetch('/api/user/kyc/submit', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { setShowCountdown(true); }
      else { setError(data.message || 'Erreur lors de la soumission'); }
    } catch { setError('Erreur réseau. Réessayez.'); }
    finally { setSubmitting(false); }
  };

  if (!mounted || loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>;
  }

  if (user?.kyc?.status === 'approved') {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <h2 className="text-gray-900 text-xl font-bold mb-2">Identité vérifiée</h2>
          <p className="text-gray-500 text-sm mb-6">Votre compte est vérifié. Aucune action requise.</p>
          <button onClick={() => router.push('/user/profil')}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showCountdown && <KYCCountdown onComplete={handleCountdownComplete} />}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => router.push('/user/profil')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-3 transition-colors">
            <ArrowLeft size={16} /> Retour
          </button>
          <h1 className="text-gray-900 text-xl font-bold">Vérification d&apos;identité</h1>
          <p className="text-gray-500 text-sm mt-1">Requis pour effectuer des retraits</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ====== TYPE DE DOCUMENT ====== */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Type de document</label>
            <div className="relative">
              <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 pr-10 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none">
                <option value="cni">Carte d&apos;identité nationale</option>
                <option value="passport">Passeport</option>
                <option value="permis">Permis de conduire</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ====== INFORMATIONS ====== */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">Nom complet</label>
              <input type="text" value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Tel qu'il apparaît sur le document"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
                required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Date de naissance</label>
                <input type="date" value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
                  required />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Nationalité</label>
                <div className="relative">
                  <select value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full appearance-none bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 pr-10 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
                    required>
                    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">{cfg.numLabel}</label>
              <input type="text" value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder={cfg.numPlaceholder}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
                required />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">Adresse</label>
              <input type="text" value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ville, pays"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
                required />
            </div>
          </div>

          {/* ====== DOCUMENTS ====== */}
          <div className="space-y-3">
            <div className="text-gray-700 text-sm font-medium">Documents</div>

            <DocUpload label={`${cfg.label} — Recto`} field="front"
              file={files.front} preview={previews.front}
              onFileChange={onFileChange} onCameraCapture={onCameraCapture} onRemove={removeFile} />

            {cfg.hasBack && (
              <DocUpload label={`${cfg.label} — Verso`} field="back"
                file={files.back} preview={previews.back}
                onFileChange={onFileChange} onCameraCapture={onCameraCapture} onRemove={removeFile} />
            )}

            <DocUpload label="Selfie avec le document"
              sublabel="Tenez le document à côté de votre visage"
              field="selfie"
              file={files.selfie} preview={previews.selfie}
              onFileChange={onFileChange} onCameraCapture={onCameraCapture} onRemove={removeFile} />
          </div>

          {/* ====== SUBMIT ====== */}
          <button type="submit" disabled={submitting}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Vérification...</>
            ) : (
              'Soumettre la vérification'
            )}
          </button>

          <p className="text-gray-400 text-xs text-center">
            Vos données sont chiffrées et sécurisées. Validation en quelques minutes.
          </p>
        </form>
      </div>
    </div>
  );
}