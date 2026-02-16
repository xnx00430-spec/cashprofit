// models/Opportunity.js
import mongoose from 'mongoose';

const OpportunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Marché Financier'
  },
  
  // Taux de base (avant bonus niveau)
  baseRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // Durée en jours
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Montants
  minInvestment: {
    type: Number,
    default: 10000
  },
  maxInvestment: {
    type: Number,
    default: 10000000
  },
  
  // Statut
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Message de réassurance
  riskLevel: {
    type: String,
    default: '0%'
  },
  guaranteeMessage: {
    type: String,
    default: 'Investissement 100% sécurisé avec fonds de réserve garantis'
  },
  
  // Image
  image: {
    type: String,
    default: null
  },
  
  // Stats
  totalInvested: {
    type: Number,
    default: 0
  },
  activeInvestors: {
    type: Number,
    default: 0
  },
  
  // Ordre d'affichage
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index
OpportunitySchema.index({ status: 1, order: 1 });
OpportunitySchema.index({ slug: 1 });

// Méthode pour calculer le taux final avec bonus niveau
OpportunitySchema.methods.getFinalRate = function(userLevel) {
  let bonus = 0;
  if (userLevel === 2) bonus = 5;
  else if (userLevel >= 3) bonus = 10;
  
  return this.baseRate + bonus;
};

const Opportunity = mongoose.models.Opportunity || mongoose.model('Opportunity', OpportunitySchema);

export default Opportunity;