// app/api/admin/credit/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Investment from '@/models/Investment';
import Opportunity from '@/models/Opportunity';
import { verifyAuth } from '@/lib/auth';
import { createInvestmentFromPayment } from '@/app/api/payments/webhook/route';

export async function POST(request) {
  try {
    const payload = await verifyAuth();
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    // Vérifier que c'est un admin
    const admin = await User.findById(payload.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 });
    }

    const { action, userId, amount, type, level, investmentData } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'ID utilisateur requis' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    let result = {};

    switch (action) {
      // ==================== CRÉDITER UN COMPTE ====================
      case 'credit': {
        if (!amount || amount <= 0) {
          return NextResponse.json({ success: false, message: 'Montant invalide' }, { status: 400 });
        }

        switch (type) {
          case 'benefices':
            user.balance = (user.balance || 0) + amount;
            result.message = `+${amount.toLocaleString()} F ajoutés aux bénéfices`;
            break;
          case 'commissions':
            user.totalCommissions = (user.totalCommissions || 0) + amount;
            result.message = `+${amount.toLocaleString()} F ajoutés aux commissions`;
            break;
          case 'bonus':
            user.bonusParrainage = (user.bonusParrainage || 0) + amount;
            result.message = `+${amount.toLocaleString()} F ajoutés au bonus`;
            break;
          default:
            return NextResponse.json({ success: false, message: 'Type invalide (benefices, commissions, bonus)' }, { status: 400 });
        }

        await user.save();
        break;
      }

      // ==================== CHANGER LE NIVEAU ====================
      case 'setLevel': {
        if (!level || level < 1 || level > 20) {
          return NextResponse.json({ success: false, message: 'Niveau invalide (1-20)' }, { status: 400 });
        }

        const oldLevel = user.level;
        user.level = level;
        user.benefitsBlocked = false;
        
        // Reset le défi pour le nouveau niveau
        user.currentLevelStartDate = new Date();
        user.currentLevelDeadline = new Date(Date.now() + (level === 1 ? 3 : 2) * 7 * 24 * 60 * 60 * 1000);
        user.currentLevelTarget = (user.firstInvestmentAmount || user.totalInvested || 0) * 5;
        user.currentLevelCagnotte = 0;

        await user.save();
        result.message = `Niveau changé de ${oldLevel} → ${level}`;
        break;
      }

      // ==================== CRÉER UN INVESTISSEMENT ====================
      case 'createInvestment': {
        if (!investmentData) {
          return NextResponse.json({ success: false, message: 'Données investissement requises' }, { status: 400 });
        }

        const { opportunityId, investAmount, startDate, weeklyRate } = investmentData;

        if (!investAmount || investAmount <= 0) {
          return NextResponse.json({ success: false, message: 'Montant investissement invalide' }, { status: 400 });
        }

        // Chercher l'opportunité
        let opportunity = null;
        if (opportunityId) {
          opportunity = await Opportunity.findById(opportunityId);
        }
        if (!opportunity) {
          opportunity = await Opportunity.findOne({ status: 'active' });
        }

        if (!opportunity) {
          return NextResponse.json({ success: false, message: 'Aucune opportunité active' }, { status: 400 });
        }

        // Si un taux custom ou une date custom est fourni, création manuelle
        if (weeklyRate || startDate) {
          const baseRate = opportunity.baseRate || 10;
          const finalRate = weeklyRate ? parseFloat(weeklyRate) : (baseRate + user.getRateBonus());
          const maxWeeks = 52;
          const start = startDate ? new Date(startDate) : new Date();
          const endDate = new Date(start.getTime() + maxWeeks * 7 * 24 * 60 * 60 * 1000);
          const isFirstInvestment = user.totalInvested === 0;

          const investment = await Investment.create({
            userId: user._id,
            opportunityId: opportunity._id,
            amount: investAmount,
            baseRate: baseRate,
            weeklyRate: finalRate,
            maxWeeks,
            level: user.level,
            type: 'regular',
            startDate: start,
            endDate,
            status: 'active',
            paymentDetails: {
              provider: 'admin_credit',
              transactionId: `admin_${Date.now()}_${user._id}`,
              paidAt: new Date()
            }
          });

          // Stats user + cagnotte
          user.totalInvested = (user.totalInvested || 0) + investAmount;
          user.activeInvestments = (user.activeInvestments || 0) + 1;

          if (isFirstInvestment) {
            user.firstInvestmentAmount = investAmount;
            user.currentLevelStartDate = new Date();
            const weeks = user.level === 1 ? 3 : 2;
            user.currentLevelDeadline = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000);
            user.currentLevelTarget = investAmount * 5;
            user.currentLevelCagnotte = 0;
          } else {
            user.currentLevelCagnotte = (user.currentLevelCagnotte || 0) + investAmount;
          }

          // Level up auto
          if (user.canLevelUp()) {
            const oldLevel = user.level;
            user.levelUp();
            console.log(`🎉 Admin credit: ${user.name} leveled up: ${oldLevel} → ${user.level}`);
          }

          await user.save();

          // Stats opportunité
          await Opportunity.findByIdAndUpdate(opportunity._id, {
            $inc: { totalInvested: investAmount, activeInvestors: 1 }
          });

          // Cagnotte du parrain
          if (user.referredBy) {
            try {
              const sponsor = await User.findById(user.referredBy);
              if (sponsor) {
                if (isFirstInvestment) {
                  sponsor.bonusParrainage = (sponsor.bonusParrainage || 0) + 10000;
                }
                sponsor.currentLevelCagnotte = (sponsor.currentLevelCagnotte || 0) + investAmount;
                if (sponsor.canLevelUp()) {
                  sponsor.levelUp();
                }
                await sponsor.save();
              }
            } catch (e) { console.error('Referral error:', e); }
          }

          result.message = `Investissement de ${investAmount.toLocaleString()} F créé (début: ${start.toLocaleDateString('fr-FR')}, taux: ${finalRate}%/sem)`;
          result.investmentId = investment._id;
        } else {
          // Utiliser la logique commune (cagnotte + parrain + level up + notifications)
          const transactionId = `admin_${Date.now()}_${user._id}`;
          
          const investResult = await createInvestmentFromPayment({
            transactionId,
            userId: user._id,
            opportunityId: opportunity._id,
            amount: investAmount,
            provider: 'admin_credit'
          });

          if (!investResult.success && !investResult.alreadyExists) {
            return NextResponse.json({ 
              success: false, 
              message: investResult.error || 'Erreur création investissement' 
            }, { status: 500 });
          }

          // Recharger le user après les modifications
          const updatedUser = await User.findById(userId);
          
          return NextResponse.json({
            success: true,
            message: `Investissement de ${investAmount.toLocaleString()} F créé (taux: ${investResult.rate}%/sem)`,
            investmentId: investResult.investmentId,
            user: {
              id: updatedUser._id,
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              level: updatedUser.level,
              balance: updatedUser.balance,
              totalCommissions: updatedUser.totalCommissions,
              bonusParrainage: updatedUser.bonusParrainage,
              totalInvested: updatedUser.totalInvested,
              activeInvestments: updatedUser.activeInvestments
            }
          });
        }
        break;
      }

      default:
        return NextResponse.json({ success: false, message: 'Action invalide' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        level: user.level,
        balance: user.balance,
        totalCommissions: user.totalCommissions,
        bonusParrainage: user.bonusParrainage,
        totalInvested: user.totalInvested,
        activeInvestments: user.activeInvestments
      }
    });

  } catch (error) {
    console.error('Admin credit error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error.message },
      { status: 500 }
    );
  }
}