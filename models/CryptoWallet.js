// models/CryptoWallet.js
import mongoose from 'mongoose';

const CryptoWalletSchema = new mongoose.Schema({
  // Réseau USDT
  network: {
    type: String,
    required: true,
    enum: ['TRC20', 'BEP20', 'ERC20', 'SOL', 'POLYGON', 'ARBITRUM', 'OPTIMISM'],
  },
  
  // Adresse du wallet
  address: {
    type: String,
    required: true,
    trim: true
  },
  
  // Nom d'affichage (ex: "USDT - Tron (TRC20)")
  label: {
    type: String,
    required: true
  },
  
  // Actif ou non (l'admin peut désactiver sans supprimer)
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Admin qui a ajouté
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notes internes (visibles seulement par l'admin)
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

CryptoWalletSchema.index({ isActive: 1, network: 1 });

const CryptoWallet = mongoose.models.CryptoWallet || mongoose.model('CryptoWallet', CryptoWalletSchema);

export default CryptoWallet;