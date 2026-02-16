import mongoose from 'mongoose';

const CommissionSchema = new mongoose.Schema({
  // Utilisateur qui reçoit la commission
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Utilisateur dont provient la commission (le filleul)
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Investissement source
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment'
  },
  // Montant de la commission
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Pourcentage appliqué (10%, 5%, 2.5%, etc.)
  percentage: {
    type: Number,
    required: true
  },
  // Niveau de profondeur (1-10)
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  // Type de commission
  type: {
    type: String,
    enum: ['investment_gain', 'weekly_earning', 'bonus'],
    default: 'weekly_earning'
  },
  // Statut
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'paid',
    index: true
  },
  // Description
  description: {
    type: String
  },
  // Semaine de calcul
  weekNumber: {
    type: Number
  },
  // Date de paiement
  paidAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composés pour performance
CommissionSchema.index({ userId: 1, status: 1 });
CommissionSchema.index({ userId: 1, createdAt: -1 });
CommissionSchema.index({ fromUserId: 1, createdAt: -1 });
CommissionSchema.index({ userId: 1, level: 1 });

// Méthode statique pour calculer les commissions d'un utilisateur
CommissionSchema.statics.calculateUserCommissions = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: 'paid',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || { total: 0, count: 0 };
};

// Méthode statique pour créer une commission
CommissionSchema.statics.createCommission = async function(data) {
  const commission = await this.create({
    userId: data.userId,
    fromUserId: data.fromUserId,
    investmentId: data.investmentId,
    amount: data.amount,
    percentage: data.percentage,
    level: data.level,
    type: data.type || 'weekly_earning',
    description: data.description || `Commission niveau ${data.level} (${data.percentage}%)`,
    weekNumber: data.weekNumber
  });

  // Mettre à jour le total des commissions de l'utilisateur
  await mongoose.model('User').findByIdAndUpdate(
    data.userId,
    { $inc: { totalCommissions: data.amount, totalEarnings: data.amount } }
  );

  return commission;
};

const Commission = mongoose.models.Commission || mongoose.model('Commission', CommissionSchema);

export default Commission;