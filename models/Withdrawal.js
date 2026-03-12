// models/Withdrawal.js
import mongoose from 'mongoose';

const WithdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1000
  },
  type: {
    type: String,
    enum: ['gains', 'commissions', 'bonus'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'bank_transfer', 'wave', 'orange_money', 'mtn_money', 'moov_money', 'crypto_usdt'],
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },

  // ==================== CRYPTO FIELDS ====================
  cryptoNetwork: {
    type: String,
    enum: ['TRC20', 'BEP20', 'ERC20', null],
    default: null
  },
  cryptoAddress: {
    type: String,
    default: null
  },
  // Montant USDT estimé au moment de la demande
  estimatedUSDT: {
    type: Number,
    default: null
  },
  // Hash de la transaction crypto (rempli par l'admin après envoi)
  txHash: {
    type: String,
    default: null
  },

  // ==================== TRAITEMENT ADMIN ====================
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  transactionId: {
    type: String
  },
  transactionRef: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Index composés
WithdrawalSchema.index({ userId: 1, status: 1 });
WithdrawalSchema.index({ userId: 1, createdAt: -1 });
WithdrawalSchema.index({ status: 1, createdAt: -1 });

// Méthode pour approuver le retrait
WithdrawalSchema.methods.approve = async function(adminId) {
  this.status = 'approved';
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  return await this.save();
};

// Méthode pour rejeter le retrait
WithdrawalSchema.methods.reject = async function(adminId, reason) {
  this.status = 'rejected';
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.rejectedBy = adminId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  
  // Rembourser le montant + corriger totalWithdrawn
  const User = mongoose.model('User');
  const user = await User.findById(this.userId);
  if (user) {
    if (this.type === 'gains') {
      user.balance = (user.balance || 0) + this.amount;
    } else if (this.type === 'commissions') {
      user.totalCommissions = (user.totalCommissions || 0) + this.amount;
    } else if (this.type === 'bonus') {
      user.bonusParrainage = (user.bonusParrainage || 0) + this.amount;
    }
    // Décrémenter totalWithdrawn car le retrait est annulé
    user.totalWithdrawn = Math.max((user.totalWithdrawn || 0) - this.amount, 0);
    await user.save();
  }
  
  return await this.save();
};

// Méthode pour marquer comme complété
WithdrawalSchema.methods.complete = async function(adminId, transactionRef) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = adminId;
  this.transactionRef = transactionRef;
  this.transactionId = transactionRef;
  
  return await this.save();
};

// Méthode statique pour les retraits en attente
WithdrawalSchema.statics.getPending = async function(limit = 50) {
  return await this.find({ status: 'pending' })
    .populate('userId', 'name email phone')
    .sort({ createdAt: 1 })
    .limit(limit);
};

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawalSchema);

export default Withdrawal;