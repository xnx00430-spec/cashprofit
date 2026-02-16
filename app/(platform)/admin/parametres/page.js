"use client";

import React, { useState } from 'react';
import { Save, Percent, DollarSign, Users, Settings as SettingsIcon } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    // Taux de rendement
    level1Rate: 10,
    level2Rate: 15,
    level3Rate: 20,
    
    // Montants
    minInvestment: 10000,
    maxInvestment: 5000000,
    
    // Commissions réseau
    level1Commission: 10,
    level2Commission: 10,
    level3Commission: 5,
    
    // Système
    registrationOpen: true,
    withdrawalsEnabled: true,
    maintenanceMode: false
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleToggle = (field) => {
    setSettings({ ...settings, [field]: !settings[field] });
  };

  const handleSave = () => {
    console.log('Sauvegarde des paramètres:', settings);
    // API call ici
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Paramètres</h1>
          <p className="text-white/60">Configuration de la plateforme</p>
        </div>

        {/* Alert sauvegarde */}
        {saved && (
          <div className="mb-6 bg-green-500/20 border border-green-500/40 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Save className="w-4 h-4 text-white" />
            </div>
            <div className="text-green-400 font-semibold">Paramètres sauvegardés avec succès !</div>
          </div>
        )}

        <div className="space-y-6">
          {/* Taux de Rendement */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Taux de Rendement Hebdomadaire</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4">
                <label className="text-white/60 text-sm mb-2 block">Niveau 1</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.level1Rate}
                    onChange={(e) => handleChange('level1Rate', parseFloat(e.target.value))}
                    className="flex-1 px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-yellow-400 font-bold text-xl">%</span>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4">
                <label className="text-white/60 text-sm mb-2 block">Niveau 2</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.level2Rate}
                    onChange={(e) => handleChange('level2Rate', parseFloat(e.target.value))}
                    className="flex-1 px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-yellow-400 font-bold text-xl">%</span>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4">
                <label className="text-white/60 text-sm mb-2 block">Niveau 3</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.level3Rate}
                    onChange={(e) => handleChange('level3Rate', parseFloat(e.target.value))}
                    className="flex-1 px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-yellow-400 font-bold text-xl">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Montants Investissement */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Montants d'Investissement</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4">
                <label className="text-white/60 text-sm mb-2 block">Montant Minimum</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.minInvestment}
                    onChange={(e) => handleChange('minInvestment', parseInt(e.target.value))}
                    className="flex-1 px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="0"
                    step="1000"
                  />
                  <span className="text-yellow-400 font-bold">FCFA</span>
                </div>
                <div className="text-white/40 text-xs mt-2">Actuellement: {formatNumber(settings.minInvestment)} FCFA</div>
              </div>

              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4">
                <label className="text-white/60 text-sm mb-2 block">Montant Maximum</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.maxInvestment}
                    onChange={(e) => handleChange('maxInvestment', parseInt(e.target.value))}
                    className="flex-1 px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="0"
                    step="10000"
                  />
                  <span className="text-yellow-400 font-bold">FCFA</span>
                </div>
                <div className="text-white/40 text-xs mt-2">Actuellement: {formatNumber(settings.maxInvestment)} FCFA</div>
              </div>
            </div>
          </div>

          {/* Commissions Réseau */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Commissions Réseau</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4">
                <label className="text-white/60 text-sm mb-2 block">Filleuls Directs (Niveau 1)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.level1Commission}
                    onChange={(e) => handleChange('level1Commission', parseFloat(e.target.value))}
                    className="flex-1 px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-yellow-400 font-bold text-xl">%</span>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4">
                <label className="text-white/60 text-sm mb-2 block">Niveau 2</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.level2Commission}
                    onChange={(e) => handleChange('level2Commission', parseFloat(e.target.value))}
                    className="flex-1 px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-yellow-400 font-bold text-xl">%</span>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4">
                <label className="text-white/60 text-sm mb-2 block">Niveau 3</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.level3Commission}
                    onChange={(e) => handleChange('level3Commission', parseFloat(e.target.value))}
                    className="flex-1 px-4 py-3 bg-black/60 border border-yellow-400/30 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-yellow-400 font-bold text-xl">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Options Système */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Options Système</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold mb-1">Inscriptions ouvertes</div>
                  <div className="text-white/60 text-sm">Autoriser les nouveaux utilisateurs à s'inscrire</div>
                </div>
                <button
                  onClick={() => handleToggle('registrationOpen')}
                  className={`w-14 h-8 rounded-full transition-all ${
                    settings.registrationOpen ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.registrationOpen ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold mb-1">Retraits activés</div>
                  <div className="text-white/60 text-sm">Autoriser les utilisateurs à retirer leurs gains</div>
                </div>
                <button
                  onClick={() => handleToggle('withdrawalsEnabled')}
                  className={`w-14 h-8 rounded-full transition-all ${
                    settings.withdrawalsEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.withdrawalsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="bg-black/40 border border-yellow-400/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold mb-1">Mode maintenance</div>
                  <div className="text-white/60 text-sm">Désactiver temporairement la plateforme</div>
                </div>
                <button
                  onClick={() => handleToggle('maintenanceMode')}
                  className={`w-14 h-8 rounded-full transition-all ${
                    settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Bouton Sauvegarder */}
          <button
            onClick={handleSave}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Sauvegarder les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}