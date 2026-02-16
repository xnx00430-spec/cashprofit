// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Statut et rôle
  status: {
    type: String,
    enum: ['active', 'blocked', 'pending', 'confirmed'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Système de parrainage
  sponsorCode: {
    type: String,
    unique: true,
    required: true
  },
  referralCode: {
    type: String,
    default: null
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referredByCode: {
    type: String,
    default: null
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // ==================== SYSTÈME DE NIVEAUX (1 à 20) ====================
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 20
  },
  
  // Montant du 1er investissement (fixe le target pour tous les niveaux)
  firstInvestmentAmount: {
    type: Number,
    default: 0
  },
  
  // Défi en cours
  currentLevelStartDate: {
    type: Date,
    default: null
  },
  currentLevelDeadline: {
    type: Date,
    default: null
  },
  currentLevelCagnotte: {
    type: Number,
    default: 0,
    min: 0
  },
  currentLevelTarget: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Statut des bénéfices
  benefitsBlocked: {
    type: Boolean,
    default: false
  },
  
  // ==================== FINANCES ====================
  totalInvested: {
    type: Number,
    default: 0,
    min: 0
  },
  activeInvestments: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Bénéfices personnels
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalBenefits: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Commissions affiliés
  totalCommissions: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Bonus parrainage
  bonusParrainage: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Retraits
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0
  },
  hasWithdrawn: {
    type: Boolean,
    default: false
  },
  
  // ==================== KYC ====================
  kyc: {
    status: {
      type: String,
      enum: ['null', 'pending', 'approved', 'rejected', 'need_more_info'],
      default: 'null'
    },
    currentSubmission: {
      personalInfo: {
        fullName: String,
        dateOfBirth: Date,
        idNumber: String,
        nationality: String,
        address: String
      },
      documents: {
        idFront: String,
        idBack: String,
        selfie: String,
        proofOfAddress: String
      },
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      adminMessage: String,
      autoApprovedAt: Date
    },
    history: [{
      status: String,
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      adminMessage: String,
      documents: Object
    }]
  },
  
  // Authentification
  lastLogin: {
    type: Date,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// ==================== INDEXES ====================
UserSchema.index({ email: 1 });
UserSchema.index({ sponsorCode: 1 });
UserSchema.index({ referredBy: 1 });
UserSchema.index({ status: 1, role: 1 });
UserSchema.index({ currentLevelDeadline: 1, benefitsBlocked: 1 });

// ==================== HOOKS ====================
// Hash password
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Initialiser le défi au premier investissement
UserSchema.pre('save', function() {
  if (this.totalInvested > 0 && !this.currentLevelStartDate) {
    // Premier investissement : fixer le target pour TOUS les niveaux
    this.firstInvestmentAmount = this.totalInvested;
    this.currentLevelStartDate = new Date();
    const weeks = this.level === 1 ? 3 : 2;
    this.currentLevelDeadline = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000);
    this.currentLevelTarget = this.firstInvestmentAmount * 5;
    this.currentLevelCagnotte = 0;
  }
});

// ==================== MÉTHODES ====================
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.generateSponsorCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists = true;
  while (exists) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    exists = await this.findOne({ sponsorCode: code });
  }
  return code;
};

// Taux bonus selon le niveau
// Niveau 1 = 0%, Niveau 2 = +5%, Niveau 3-20 = +10%
UserSchema.methods.getRateBonus = function() {
  if (this.level === 1) return 0;
  if (this.level === 2) return 5;
  return 10; // Niveau 3 à 20
};

// Vérifier si peut passer au niveau suivant
UserSchema.methods.canLevelUp = function() {
  if (this.level >= 20) return false;
  return this.currentLevelCagnotte >= this.currentLevelTarget;
};

// Passer au niveau suivant
UserSchema.methods.levelUp = function() {
  if (this.level >= 20) return;
  this.level += 1;
  this.currentLevelCagnotte = 0;
  this.currentLevelStartDate = new Date();
  this.currentLevelDeadline = new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000);
  // Target toujours basé sur le 1er investissement
  this.currentLevelTarget = (this.firstInvestmentAmount || this.totalInvested) * 5;
  this.benefitsBlocked = false;
};

// Deadline dépassée ?
UserSchema.methods.isDeadlinePassed = function() {
  if (!this.currentLevelDeadline) return false;
  return new Date() > this.currentLevelDeadline;
};

// Échouer le défi
UserSchema.methods.failChallenge = function() {
  this.benefitsBlocked = true;
  this.currentLevelDeadline = new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;