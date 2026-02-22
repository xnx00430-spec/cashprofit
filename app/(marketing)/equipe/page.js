// app/equipe/page.jsx (ou app/(public)/equipe/page.jsx selon ta structure)
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Linkedin, Mail, Shield, TrendingUp, Users, Code, BarChart3, Scale, Megaphone, HeadphonesIcon } from 'lucide-react';

const team = [
  {
    name: 'Marc Bergerond',
    role: 'CEO & Fondateur',
    photo: '/team/marc-bergerond.jpg',
    icon: TrendingUp,
    description: 'Vision stratégique, représentation de l\'entreprise et décisions majeures. La figure de confiance principale pour nos investisseurs.',
    color: 'from-yellow-400 to-amber-500',
  },
  {
    name: 'Chesmu Sanjay',
    role: 'Directeur des Investissements',
    photo: '/team/chesmu-sanjay.jpg',
    icon: BarChart3,
    description: 'Analyse des opportunités d\'investissement, gestion du portefeuille, stratégie de rendement et gestion du risque.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Iman Miller',
    role: 'Responsable Financier',
    photo: '/team/iman-miller.jpg',
    icon: Shield,
    description: 'Comptabilité et trésorerie, reporting financier, prévisions et conformité financière.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Claire Aripekka',
    role: 'Responsable Conformité & Juridique',
    photo: '/team/claire-aripekka.jpg',
    icon: Scale,
    description: 'Respect des réglementations, contrats et aspects juridiques, gestion des risques légaux.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    name: 'Angelo Fonseca',
    role: 'Responsable Relation Investisseurs',
    photo: '/team/angelo-fonseca.jpg',
    icon: HeadphonesIcon,
    description: 'Support clients, communication avec les investisseurs, fidélisation et suivi des comptes.',
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Gilles Borges',
    role: 'Responsable Marketing & Communication',
    photo: '/team/gilles-borges.jpg',
    icon: Megaphone,
    description: 'Image de marque, acquisition d\'utilisateurs, réseaux sociaux et contenus.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    name: 'Fall Mbengue',
    role: 'Responsable Technique',
    photo: '/team/fall-mbengue.jpg',
    icon: Code,
    description: 'Sécurité de la plateforme, développement et maintenance du site, innovation technologique.',
    color: 'from-cyan-500 to-blue-600',
  },
];

function TeamCard({ member, index }) {
  const [isVisible, setIsVisible] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const initials = member.name.split(' ').map(n => n[0]).join('');
  const Icon = member.icon;

  return (
    <div ref={ref}
      className={`group transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 100}ms` }}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-gray-200 hover:-translate-y-1">
        
        {/* Photo */}
        <div className="relative h-96 overflow-hidden bg-gray-100">
          {!imgError ? (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-700"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${member.color} flex items-center justify-center`}>
              <span className="text-white text-5xl font-black opacity-80">{initials}</span>
            </div>
          )}
          
          {/* Badge rôle */}
          <div className="absolute bottom-3 left-3">
            <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${member.color} text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider`}>
              <Icon size={12} />
              {member.role.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <h3 className="text-gray-900 text-lg font-bold mb-0.5">{member.name}</h3>
          <p className="text-yellow-600 text-sm font-medium mb-3">{member.role}</p>
          <p className="text-gray-500 text-sm leading-relaxed">{member.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function EquipePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      
      {/* Hero */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <Link href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
            <ArrowLeft size={16} /> Retour à l&apos;accueil
          </Link>

          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 text-xs font-bold px-4 py-2 rounded-full mb-6 tracking-wider uppercase border border-yellow-400/20">
              <Users size={14} />
              Notre équipe
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight max-w-2xl">
              Les experts derrière <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">CashProfit</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Une équipe internationale de professionnels dédiés à faire fructifier vos investissements en toute sécurité.
            </p>
          </div>
        </div>
      </div>

      {/* Grille équipe */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        
        {/* CEO en premier - mis en avant */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto">
            <TeamCard member={team[0]} index={0} />
          </div>
        </div>

        {/* Reste de l'équipe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.slice(1).map((member, index) => (
            <TeamCard key={member.name} member={member} index={index + 1} />
          ))}
        </div>
      </div>

      {/* Section valeurs */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">Nos valeurs</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Ce qui guide chacune de nos décisions au quotidien</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Sécurité', desc: 'La protection de vos fonds est notre priorité absolue. Chaque investissement est sécurisé et audité.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { icon: TrendingUp, title: 'Performance', desc: 'Nos experts travaillent chaque jour pour maximiser vos rendements tout en maîtrisant les risques.', color: 'text-yellow-500', bg: 'bg-yellow-50' },
              { icon: Users, title: 'Transparence', desc: 'Communication claire et honnête avec nos investisseurs. Vos gains sont visibles en temps réel.', color: 'text-blue-500', bg: 'bg-blue-50' },
            ].map((v, i) => (
              <div key={i} className="text-center">
                <div className={`w-14 h-14 ${v.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <v.icon className={v.color} size={24} />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-900 py-16">
        <div className="text-center max-w-xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Rejoignez-nous</h2>
          <p className="text-gray-400 mb-8">Faites confiance à notre équipe et commencez à investir dès aujourd&apos;hui</p>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Créer mon compte gratuitement
          </Link>
        </div>
      </div>
    </div>
  );
}