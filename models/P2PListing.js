// models/P2PListing.js
import mongoose from 'mongoose';

const P2PListingSchema = new mongoose.Schema({
  // Vendeur
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Investissement à vendre
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: true,
    index: true
  },
  // Prix et montants
  sellingPrice: {
    type: Number,
    required: true // Prix fixé par le vendeur
  },
  originalAmount: {
    type: Number,
    required: true // Montant initial investi
  },
  currentGains: {
    type: Number,
    default: 0 // Gains accumulés
  },
  // Split automatique 60/40
  sellerReceives: {
    type: Number,
    required: true // 60% du prix de vente
  },
  platformFee: {
    type: Number,
    required: true // 40% du prix de vente
  },
  // Statut
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled'],
    default: 'active',
    index: true
  },
  // Acheteur (si vendu)
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  soldAt: {
    type: Date,
    default: null
  },
  // Infos opportunité
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  },
  opportunityTitle: String,
  level: Number,
  weeklyRate: Number
}, {
  timestamps: true
});

// Index composés
P2PListingSchema.index({ status: 1, createdAt: -1 });
P2PListingSchema.index({ sellerId: 1, status: 1 });

// Méthode pour calculer le split automatique
P2PListingSchema.statics.calculateSplit = function(sellingPrice) {
  const sellerReceives = sellingPrice * 0.6;
  const platformFee = sellingPrice * 0.4;
  return { sellerReceives, platformFee };
};

// Méthode pour marquer comme vendu
P2PListingSchema.methods.markAsSold = async function(buyerId) {
  this.status = 'sold';
  this.buyerId = buyerId;
  this.soldAt = new Date();
  return await this.save();
};

export default mongoose.models.P2PListing || mongoose.model('P2PListing', P2PListingSchema);