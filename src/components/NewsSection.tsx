import React from 'react';
import { motion } from 'motion/react';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  createdAt: string;
  type: string;
}

interface NewsSectionProps {
  posts: Post[];
  onNavigate: (url: string) => void;
}

export default function NewsSection({ posts, onNavigate }: NewsSectionProps) {
  // Filter for posts that are of type 'post' and published
  const newsList = posts.filter(p => p.type === 'post').slice(0, 3);

  // Format date elegantly
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '27/05/2026';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '27/05/2026';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <section className="bg-white py-24 relative overflow-hidden" id="water-knowledge-news-section">
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-50 rounded-full filter blur-3xl pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-[#0C3471] tracking-widest uppercase block">
              Knowledge & Insights
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-black uppercase text-[#0B2144] tracking-tight">
              Kiến thức & tin tức
            </h2>
            <div className="w-12 h-[3px] bg-[#E6C073] mt-2" />
          </div>
          
          <div>
            <button 
              onClick={() => onNavigate('/tin-tuc')}
              className="group inline-flex items-center gap-2 text-xs font-bold font-mono tracking-widest uppercase text-[#0C3471] hover:text-[#164f9f] transition-colors cursor-pointer"
            >
              Xem tất cả tin bài
              <ArrowRight className="w-4 h-4 text-[#E6C073] group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 3-Column Paper Grid */}
        {newsList.length === 0 ? (
          <div className="text-center py-12 p-8 border border-dashed border-gray-100 rounded-2xl bg-slate-50">
            <p className="text-xs text-gray-400 font-sans">Đang đồng bộ hóa kho lưu trữ tin tức của Pentair...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsList.map((post, idx) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => onNavigate(`/tin-tuc/${post.slug}`)}
                className="flex flex-col cursor-pointer group"
              >
                {/* Image panel with zoom clip */}
                <div className="aspect-[16/10] bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-50 shadow-xs">
                  <img 
                    src={post.featuredImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 pointer-events-none" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Category Accent */}
                  <span className="absolute bottom-4 left-4 bg-[#0C3471]/90 backdrop-blur-md text-[#E6C073] text-[9px] font-mono tracking-wider font-extrabold px-3 py-1 rounded shadow-md uppercase">
                    Kiến thức nước
                  </span>
                </div>

                {/* Meta details */}
                <div className="py-6 space-y-3 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-450 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[#E6C073]" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#0B2144] group-hover:text-[#0C3471] transition-colors line-clamp-2 leading-snug font-sans uppercase">
                      {post.title}
                    </h3>
                    
                    <p className="text-xs text-gray-500 font-sans font-light leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Micro action info link */}
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-mono uppercase font-bold tracking-widest text-[#0C3471]/80 group-hover:text-[#0C3471] transition-colors mt-auto">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#E6C073]" />
                      Đọc tiếp bài viết
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
