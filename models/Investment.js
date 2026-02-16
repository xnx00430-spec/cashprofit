// models/Investment.js
import mongoose from 'mongoose';

const InvestmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10000
  },
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true
  },
  baseRate: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    default: 1
  },
  type: {
    type: String,
    enum: ['regular', 'x5'],
    default: 'regular'
  },
  weeklyRate: {
    type: Number,
    required: true
  },
  maxWeeks: {
    type: Number,
    required: true,
    default: 52 // 1 an
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'withdrawn', 'cancelled'],
    default: 'active',
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  withdrawnAt: {
    type: Date
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  multiplier: {
    type: Number,
    default: 1
  },
  maturityDate: {
    type: Date
  },
  paymentDetails: {
    provider: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  notes: {
    type: String
  },
  // Dernier montant brut synchronisé en DB
  // Permet de ne créditer que la différence à chaque sync/retrait
  lastSyncedEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index composés
InvestmentSchema.index({ userId: 1, status: 1 });
InvestmentSchema.index({ userId: 1, createdAt: -1 });
InvestmentSchema.index({ status: 1, endDate: 1 });

// Calcul taux selon niveau
InvestmentSchema.methods.getCurrentRate = function(userLevel) {
  const levelBonus = userLevel === 1 ? 0 : userLevel === 2 ? 5 : 10;
  return this.baseRate + levelBonus;
};

// Calcul gains actuels (progressif, pas par semaines complètes)
InvestmentSchema.methods.calculateCurrentGains = function(userLevel = null) {
  const now = new Date();
  const msElapsed = now - this.startDate;
  const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
  const activeWeeks = Math.min(weeksElapsed, this.maxWeeks);
  
  const rate = userLevel ? this.getCurrentRate(userLevel) : this.weeklyRate;
  const weeklyGain = this.amount * (rate / 100);
  
  return weeklyGain * activeWeeks;
};

// Vérifier si actif
InvestmentSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  const now = new Date();
  const weeksElapsed = (now - this.startDate) / (7 * 24 * 60 * 60 * 1000);
  return weeksElapsed < this.maxWeeks;
};

// Gains totaux d'un utilisateur
InvestmentSchema.statics.calculateUserTotalGains = async function(userId) {
  const investments = await this.find({ userId, status: 'active' });
  let totalGains = 0;
  investments.forEach(inv => {
    totalGains += inv.calculateCurrentGains();
  });
  return totalGains;
};

// Hook pre-save
InvestmentSchema.pre('save', function() {
  if (this.isNew && !this.endDate) {
    this.endDate = new Date(this.startDate.getTime() + this.maxWeeks * 7 * 24 * 60 * 60 * 1000);
  }
});

const Investment = mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);

export default Investment;