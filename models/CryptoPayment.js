// models/CryptoPayment.js
import mongoose from 'mongoose';

const CryptoPaymentSchema = new mongoose.Schema({
  // Utilisateur qui paie
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Wallet utilisé pour le paiement
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CryptoWallet',
    required: true
  },
  
  // Infos du wallet au moment du paiement (snapshot)
  walletSnapshot: {
    network: String,
    address: String,
    label: String
  },
  
  // Montant en FCFA que l'utilisateur veut investir
  amountFCFA: {
    type: Number,
    required: true,
    min: 1000
  },
  
  // Montant en USDT envoyé (déclaré par l'utilisateur)
  amountUSDT: {
    type: Number,
    default: 0
  },
  
  // Opportunité choisie
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    default: null
  },
  opportunityName: {
    type: String,
    default: ''
  },
  
  // Capture d'écran (preuve de paiement) - URL Cloudinary
  proofImage: {
    type: String,
    required: true
  },
  
  // Hash de transaction (optionnel, l'utilisateur peut le fournir)
  txHash: {
    type: String,
    default: ''
  },
  
  // Statut du paiement
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Admin qui a traité
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  
  // Message de l'admin (en cas de rejet par exemple)
  adminMessage: {
    type: String,
    default: ''
  },
  
  // Investissement créé après validation
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    default: null
  }
}, {
  timestamps: true
});

CryptoPaymentSchema.index({ status: 1, createdAt: -1 });
CryptoPaymentSchema.index({ userId: 1, status: 1 });

const CryptoPayment = mongoose.models.CryptoPayment || mongoose.model('CryptoPayment', CryptoPaymentSchema);

export default CryptoPayment;