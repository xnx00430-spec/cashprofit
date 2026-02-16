import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Liste des KYC en attente de vérification (ADMIN ONLY)
export async function GET(request) {
  try {
    const payload = await verifyAuth();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    await connectDB();

    // Récupérer les KYC
    const users = await User.find({ 'kyc.status': status })
      .select('name email phone kyc createdAt')
      .sort({ 'kyc.submittedAt': 1 }) // Plus anciens en premier
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({ 'kyc.status': status });

    return NextResponse.json({
      success: true,
      verifications: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        kyc: {
          status: u.kyc.status,
          fullName: u.kyc.fullName,
          dateOfBirth: u.kyc.dateOfBirth,
          nationality: u.kyc.nationality,
          idNumber: u.kyc.idNumber,
          submittedAt: u.kyc.submittedAt,
          verifiedAt: u.kyc.verifiedAt,
          rejectedAt: u.kyc.rejectedAt,
          rejectionReason: u.kyc.rejectionReason
        },
        waitingDays: Math.floor((new Date() - new Date(u.kyc.submittedAt)) / (24 * 60 * 60 * 1000))
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin get verifications error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}