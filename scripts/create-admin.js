// Script pour créer un compte admin
// Exécuter avec: node scripts/create-admin.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI non défini dans .env.local');
  process.exit(1);
}

// Schema User simplifié
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  phone: String,
  address: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['pending', 'confirmed', 'blocked'], default: 'confirmed' },
  sponsorCode: { type: String, unique: true },
  level: { type: Number, default: 1 },
  balance: { type: Number, default: 0 },
  totalInvested: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  totalCommissions: { type: Number, default: 0 },
  kyc: {
    status: { type: String, default: 'approved' }
  },
  twoFactorEnabled: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Données admin
    const adminData = {
      name: 'Super Admin',
      email: 'admin@Rinvest.com',
      password: 'ARadmin123', 
      phone: '+233 07 00 00 00 00',
      address: 'nigeria',
      role: 'admin',
      status: 'confirmed',
      sponsorCode: 'ADMIN001',
      
      kyc: {
        status: 'approved'
      },
      emailVerified: true
    };

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  Un admin existe déjà avec cet email');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      
      // Demander si on veut réinitialiser le mot de passe
      console.log('\n💡 Pour réinitialiser le mot de passe, supprimez d\'abord cet admin depuis MongoDB Compass ou Atlas');
      process.exit(0);
    }

    // Hash du mot de passe
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Créer l'admin
    const admin = await User.create(adminData);

    console.log('\n✅ Admin créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Mot de passe: admin123');
    console.log('👤 Nom:', admin.name);
    console.log('🎖️  Role:', admin.role);
    console.log('📱 Téléphone:', admin.phone);
    console.log('🆔 ID:', admin._id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 IMPORTANT: Changez le mot de passe après la première connexion !');
    console.log('🌐 Connexion: http://localhost:3000/auth/login\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.code === 11000) {
      console.log('⚠️  Cet email ou code existe déjà dans la base de données');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Exécuter
createAdmin();