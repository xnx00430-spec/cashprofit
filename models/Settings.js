import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  // Configuration des niveaux
  levels: {
    type: Map,
    of: {
      rate: { type: Number, required: true },
      duration: { type: Number, required: true },
      requireReferrals: { type: Number, required: true }
    },
    default: () => new Map([
      ['1', { rate: 10, duration: 4, requireReferrals: 5 }],
      ['2', { rate: 15, duration: 2, requireReferrals: 15 }],
      ['3', { rate: 20, duration: 2, requireReferrals: 30 }],
      ['4', { rate: 25, duration: 2, requireReferrals: 50 }],
      ['5', { rate: 30, duration: 0, requireReferrals: 0 }]
    ])
  },

  // Configuration des commissions
  commissions: {
    rates: {
      type: [Number],
      default: [10, 5, 2.5, 2, 1.5, 1, 0.75, 0.5, 0.25, 0.1]
    },
    maxDepth: {
      type: Number,
      default: 10
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },

  // Configuration des investissements
  investments: {
    minAmount: {
      type: Number,
      default: 10000
    },
    maxAmount: {
      type: Number,
      default: 10000000
    },
    allowMultiple: {
      type: Boolean,
      default: true
    }
  },

  // Configuration des retraits
  withdrawals: {
    minAmount: {
      type: Number,
      default: 1000
    },
    feePercentage: {
      type: Number,
      default: 0
    },
    processingTime: {
      type: String,
      default: '24-48 heures'
    },
    requireKYC: {
      type: Boolean,
      default: true
    }
  },

  // Paramètres système
  system: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'Le système est en maintenance. Veuillez réessayer plus tard.'
    },
    registrationEnabled: {
      type: Boolean,
      default: true
    },
    investmentEnabled: {
      type: Boolean,
      default: true
    },
    withdrawalEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Historique des modifications
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Méthode pour obtenir les taux de commission
SettingsSchema.methods.getCommissionRate = function(level) {
  if (level < 1 || level > this.commissions.maxDepth) {
    return 0;
  }
  return this.commissions.rates[level - 1] || 0;
};

// Méthode pour obtenir la config d'un niveau
SettingsSchema.methods.getLevelConfig = function(level) {
  return this.levels.get(String(level)) || null;
};

// Méthode statique pour récupérer les settings (singleton)
SettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default Settings;