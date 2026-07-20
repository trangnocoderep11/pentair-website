import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowUpRight, CheckCircle } from 'lucide-react';

interface ProductMeta {
  price?: string;
  specs?: { name: string; value: string }[];
  features?: string[];
}

interface Product {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  meta?: ProductMeta;
}

interface ExploreMoreSectionProps {
  products: Product[];
  onNavigate: (url: string) => void;
}

export default function ExploreMoreSection({ products, onNavigate }: ExploreMoreSectionProps) {
  // Grab the remaining products that are NOT Maxi and NOT Midi (like Foleo Pro Max and WaterTrust Pro Series 2.0)
  const remaining = products.filter(p => 
    p.slug === 'foleo-pro-max' || p.slug === 'watertrust-pro-2-0'
  );

  return (
    <section className="bg-slate-900 text-white py-24 relative overflow-hidden" id="explore-more-pentair">
      {/* Decorative gradient overlay for texture depth */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E6C073]/40 to-transparent" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0C3471]/40 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="max-w-5xl mx-auto text-center mb-16 space-y-4">
          <span className="text-[10px] font-mono font-black text-[#E6C073] tracking-widest uppercase bg-[#E6C073]/10 border border-[#E6C073]/20 px-3 py-1 rounded inline-block">
            Specialized Water Solutions
          </span>
          <h2 className="text-3xl sm:text-4xl font-sans font-black uppercase tracking-tight leading-tight">
            Khám phá thêm giải pháp Pentair
          </h2>
          <div className="w-12 h-1 bg-[#E6C073] mx-auto mt-2" />
          <p className="text-sm md:text-base text-slate-200 font-sans font-normal max-w-2xl mx-auto leading-relaxed">
            Dải sản phẩm chuyên biệt đáp ứng đa dạng yêu cầu nghiêm ngặt từ lâu đài châu Âu cổ điển đến dự án nghỉ dưỡng siêu đô thị đẳng cấp.
          </p>
        </div>

        {/* 2-Column Bento Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {remaining.map((prod, idx) => (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ scale: 1.01, translateY: -4 }}
              onClick={() => onNavigate(`/san-pham/${prod.slug}`)}
              className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-[#E6C073]/30 p-8 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="space-y-6">
                {/* Product Layout Image */}
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-930/80 relative">
                  <img 
                    src={prod.featuredImage} 
                    alt={prod.title} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 pointer-events-none mix-blend-screen opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
                  
                  {prod.slug === 'foleo-pro-max' && (
                    <span className="absolute top-4 left-4 bg-amber-500/10 border border-amber-500/30 text-[#E6C073] text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-md font-bold">
                      Luxury Belgian Edition
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-[#E6C073] tracking-widest uppercase block">
                    {prod.meta?.price || 'Liên hệ'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold uppercase text-white group-hover:text-[#E6C073] transition-colors leading-tight">
                    {prod.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-sans font-light leading-relaxed line-clamp-2">
                    {prod.excerpt}
                  </p>
                </div>

                {/* Key specs highlight */}
                <ul className="space-y-2 pt-2 text-xs font-sans text-slate-400 font-light border-t border-white/5">
                  {(prod.meta?.specs || []).slice(0, 3).map((spec, sIdx) => (
                    <li key={sIdx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E6C073]" />
                      <span className="font-semibold text-white/80">{spec.name}:</span>
                      <span>{spec.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer action button */}
              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono uppercase font-bold tracking-widest text-[#E6C073] group-hover:text-white transition-colors">
                <span>Khám phá sản phẩm</span>
                <ArrowUpRight className="w-4 h-4 text-[#E6C073]" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Products Banner Callout */}
        <div className="text-center mt-16">
          <button 
            onClick={() => onNavigate('/san-pham')}
            className="px-10 py-4 bg-[#E6C073] hover:bg-[#ffe1a6] text-[#030B17] font-black uppercase text-xs tracking-widest rounded transition-all cursor-pointer inline-flex items-center gap-2 shadow-xl hover:shadow-2xl"
          >
            Xem trọn bộ giải pháp Pentair Hoa Kỳ
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
