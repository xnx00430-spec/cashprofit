// app/blog/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Clock, Calendar, User } from 'lucide-react';
import { getAllPosts } from '@/lib/blog-data';

function BlogCard({ post, index }) {
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

  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div ref={ref}
      className={`group transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 150}ms` }}>
      <Link href={`/blog/${post.slug}`}>
        <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-gray-200 hover:-translate-y-1">
          
          {/* Image */}
          <div className="relative h-52 overflow-hidden bg-gray-100">
            {!imgError ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <span className="text-yellow-400 text-4xl font-black">CP</span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${post.categoryColor}`}>
                {post.category}
              </span>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6">
            <div className="flex items-center gap-4 text-gray-400 text-xs mb-3">
              <span className="flex items-center gap-1"><Calendar size={12} /> {formattedDate}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
            </div>

            <h2 className="text-gray-900 text-xl font-bold mb-2 group-hover:text-yellow-600 transition-colors leading-tight">
              {post.title}
            </h2>

            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
              {post.excerpt}
            </p>

            {/* Auteur */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden relative">
                <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" onError={(e) => e.target.style.display = 'none'} />
              </div>
              <div>
                <p className="text-gray-900 text-xs font-semibold">{post.author.name}</p>
                <p className="text-gray-400 text-[10px]">{post.author.role}</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

export default function BlogPage() {
  const [isVisible, setIsVisible] = useState(false);
  const posts = getAllPosts();

  useEffect(() => { setIsVisible(true); }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      
      {/* Hero */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
            <ArrowLeft size={16} /> Retour à l&apos;accueil
          </Link>
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Le blog <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">CashProfit</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Conseils, stratégies et actualités pour maximiser vos investissements et revenus passifs.
            </p>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post, index) => (
            <BlogCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Prêt à commencer ?</h2>
          <p className="text-gray-500 mb-6 text-sm">Mettez en pratique ce que vous avez appris et commencez à investir dès maintenant</p>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Créer mon compte gratuitement
          </Link>
        </div>
      </div>
    </div>
  );
}