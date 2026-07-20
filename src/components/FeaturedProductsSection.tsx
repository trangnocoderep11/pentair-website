import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, ShieldCheck, ArrowRight } from 'lucide-react';

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

interface FeaturedProductsSectionProps {
  products: Product[];
  onNavigate: (url: string) => void;
}

export default function FeaturedProductsSection({ products, onNavigate }: FeaturedProductsSectionProps) {
  // Highlight only Maxi and Midi as requested by sitemap guidelines
  const featured = products.filter(p => 
    p.slug === 'softena-cs-maxi' || p.slug === 'softena-cs-midi'
  );

  return (
    <section className="bg-slate-50 py-24 hover:bg-slate-50/80 transition-colors" id="featured-products-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Title Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-[#0C3471] tracking-widest uppercase block">
              Exclusive Softena Series
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-black uppercase text-[#0B2144] tracking-tight">
              Sản phẩm nổi bật
            </h2>
            <div className="w-12 h-[3px] bg-[#E6C073] mt-2" />
          </div>
          
          <div className="max-w-xl">
            <p className="text-sm sm:text-base text-gray-600 font-sans font-normal leading-relaxed">
              Giải pháp lọc và làm mềm nước toàn diện nhập khẩu chính ngạch từ Pentair Hoa Kỳ. Trải nghiệm cảm giác làn nước dịu nhẹ bảo vệ hạ tầng sinh hoạt và sắc đẹp tuổi xuân.
            </p>
          </div>
        </div>

        {/* 2-Column Side-by-Side Luxury Layout */}
        {featured.length === 0 ? (
          <div className="text-center py-12 p-8 border border-dashed border-gray-200 rounded-2xl bg-white">
            <p className="text-sm text-gray-400 font-sans">Đang tải cấu hình sản phẩm nổi bật từ hệ thống...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {featured.map((prod, idx) => (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -8 }}
                onClick={() => onNavigate(`/san-pham/${prod.slug}`)}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-[#0C3471]/20 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
              >
                {/* Visual Media Wrapper with Elegant Zoom and Gold Ribbon */}
                <div className="h-72 sm:h-96 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
                  <img 
                    src={prod.featuredImage} 
                    alt={prod.title} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 pointer-events-none mix-blend-multiply" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Luxury Price Accent */}
                  <span className="absolute top-6 right-6 bg-[#0C3471] text-[#E6C073] text-[10px] font-mono font-black tracking-wider px-3.5 py-1.5 rounded-full shadow-lg border border-white/10 uppercase">
                    {prod.meta?.price || 'Liên hệ'}
                  </span>

                  {/* Curated Brand Ribbon */}
                  <span className="absolute top-6 left-6 inline-flex items-center gap-1 bg-white/90 backdrop-blur-md border border-gray-100 px-3 py-1 rounded-full text-[9px] text-[#0C3471] uppercase tracking-widest font-bold shadow-md">
                    <Sparkles className="w-3 h-3 text-[#E6C073] fill-[#E6C073]" />
                    Pentair Flagship
                  </span>
                </div>

                {/* Card Content block */}
                <div className="p-8 md:p-10 flex-grow flex flex-col justify-between space-y-8">
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono font-black text-[#0C3471] uppercase tracking-widest block">
                      Hệ Thống Lọc Nước Đầu Nguồn
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0B2144] group-hover:text-[#0C3471] transition-colors leading-tight uppercase font-sans">
                      {prod.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 font-sans font-light leading-relaxed line-clamp-3">
                      {prod.excerpt}
                    </p>
                  </div>

                  {/* Highlights Spec Bullets with Grid line style */}
                  <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-100">
                    {(prod.meta?.specs || []).slice(0, 4).map((spec, sIdx) => (
                      <div key={sIdx} className="space-y-1">
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block leading-none">
                          {spec.name}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 font-sans leading-snug">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Navigation Banner */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-[#0c3471] text-xs font-bold font-mono tracking-wider uppercase group-hover:text-[#164f9f] transition-colors">
                      <Eye className="w-4 h-4 text-[#E6C073]" />
                      Thông số chi tiết
                    </div>
                    
                    <div className="w-10 h-10 rounded-full border border-gray-100 group-hover:border-[#0C3471]/30 group-hover:bg-[#0C3471] text-gray-400 group-hover:text-white flex items-center justify-center transition-all bg-white shadow-xs">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
