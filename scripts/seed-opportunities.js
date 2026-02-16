// scripts/seed-opportunities.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Connexion MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

// Schéma Opportunity (copie du modèle)
const OpportunitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, default: 'Marché Financier' },
  baseRate: { type: Number, required: true, min: 0, max: 100 },
  duration: { type: Number, required: true, min: 1 },
  minInvestment: { type: Number, default: 10000 },
  maxInvestment: { type: Number, default: 10000000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  riskLevel: { type: String, default: '0%' },
  guaranteeMessage: { type: String, default: 'Investissement 100% sécurisé avec fonds de réserve garantis' },
  image: { type: String, default: null },
  totalInvested: { type: Number, default: 0 },
  activeInvestors: { type: Number, default: 0 },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const Opportunity = mongoose.models.Opportunity || mongoose.model('Opportunity', OpportunitySchema);

// Données des 3 opportunités
const opportunities = [
  {
    name: 'Marché Financier - Digital Trade',
    slug: 'marche-financier-digital-trade',
    description: 'Investissez dans le trading digital sur les marchés financiers mondiaux. Nos experts analysent et tradent pour vous avec des stratégies éprouvées. Bénéfices hebdomadaires retirables.',
    category: 'Marché Financier',
    baseRate: 8,
    duration: 7,
    minInvestment: 10000,
    maxInvestment: 10000000,
    status: 'active',
    riskLevel: '0%',
    guaranteeMessage: '✅ Risque 0% garanti - Nos experts avec historique prouvé + Fonds de réserve pour couvrir toute perte. Votre pourcentage est TOUJOURS garanti même en cas de baisse du marché.',
    activeInvestors: 1247,
    totalInvested: 45600000,
    order: 1
  },
  {
    name: 'Petrol - Or Noir Premium',
    slug: 'petrol-trading-international',
    description: 'Trading sur le marché pétrolier international. Profitez des fluctuations des cours du pétrole avec nos stratégies de couverture avancées. Bénéfices hebdomadaires retirables.',
    category: 'Marché Financier',
    baseRate: 10,
    duration: 7,
    minInvestment: 10000,
    maxInvestment: 10000000,
    status: 'active',
    riskLevel: '0%',
    guaranteeMessage: '✅ Risque 0% garanti - Nos experts avec historique prouvé + Fonds de réserve pour couvrir toute perte. Votre pourcentage est TOUJOURS garanti même en cas de baisse du marché.',
    activeInvestors: 892,
    totalInvested: 32400000,
    order: 2
  },
  {
    name: 'Mine de Diamant et Pierre Rare',
    slug: 'mine-diamant-pierre-rare',
    description: 'Investissement dans l\'extraction de diamants et métaux rares. Participez aux profits d\'une industrie à forte valeur ajoutée avec nos partenaires miniers certifiés. Bénéfices hebdomadaires retirables.',
    category: 'Marché Financier',
    baseRate: 9,
    duration: 7,
    minInvestment: 10000,
    maxInvestment: 10000000,
    status: 'active',
    riskLevel: '0%',
    guaranteeMessage: '✅ Risque 0% garanti - Nos experts avec historique prouvé + Fonds de réserve pour couvrir toute perte. Votre pourcentage est TOUJOURS garanti même en cas de baisse du marché.',
    activeInvestors: 1056,
    totalInvested: 38900000,
    order: 3
  }
];

// Fonction principale
async function seed() {
  try {
    await connectDB();
    
    console.log('🌱 Début du seed des opportunités...');
    
    // Supprimer toutes les opportunités existantes
    await Opportunity.deleteMany({});
    console.log('🗑️  Opportunités existantes supprimées');
    
    // Créer les 3 nouvelles opportunités
    const created = await Opportunity.insertMany(opportunities);
    console.log(`✅ ${created.length} opportunités créées avec succès !`);
    
    // Afficher les détails
    created.forEach(opp => {
      console.log(`
📊 ${opp.name}
   - Taux de base: ${opp.baseRate}%
   - Durée: ${opp.duration} jours
   - Slug: ${opp.slug}
      `);
    });
    
    console.log('🎉 Seed terminé !');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

// Exécuter
seed();