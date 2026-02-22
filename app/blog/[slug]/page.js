// app/blog/[slug]/page.jsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, Share2 } from 'lucide-react';
import { getPostBySlug, getAllPosts } from '@/lib/blog-data';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Article non trouvé' };
  return {
    title: `${post.title} | CashProfit Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Convertir le markdown basique en HTML
  const contentHtml = post.content
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-gray-900 mt-10 mb-4">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-12 mb-4">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
    .replace(/\n\n/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')
    .replace(/^/, '<p class="text-gray-600 leading-relaxed mb-4">')
    .replace(/$/, '</p>');

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero article */}
      <div className="bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
            <ArrowLeft size={16} /> Tous les articles
          </Link>

          <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-6 ${post.categoryColor}`}>
            {post.category}
          </span>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-gray-400 text-lg mb-8 max-w-2xl">{post.excerpt}</p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden relative">
                <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{post.author.name}</p>
                <p className="text-gray-500 text-xs">{post.author.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {formattedDate}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime} de lecture</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <article 
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: contentHtml }} 
        />

        {/* Séparateur */}
        <div className="border-t border-gray-200 mt-16 pt-10">
          
          {/* CTA */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Prêt à passer à l&apos;action ?</h3>
            <p className="text-gray-500 text-sm mb-6">Créez votre compte et commencez à investir dès aujourd&apos;hui</p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Commencer maintenant
            </Link>
          </div>

          {/* Retour blog */}
          <div className="text-center mt-8">
            <Link href="/blog" className="text-gray-400 hover:text-gray-900 text-sm font-medium transition-colors inline-flex items-center gap-2">
              <ArrowLeft size={14} /> Voir tous les articles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}