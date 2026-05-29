import React from 'react';
import { motion } from 'motion/react';
import { Award, ShieldCheck, Heart } from 'lucide-react';

interface BrandIntroSectionProps {
  introTitle: string;
  introBody: string;
  onNavigate: (url: string) => void;
}

export default function BrandIntroSection({ introTitle, introBody, onNavigate }: BrandIntroSectionProps) {
  return (
    <section className="bg-white py-20 md:py-28 overflow-hidden relative">
      {/* Visual background accents */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-[#0c3471]/3 rounded-full filter blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Brand heritage information */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#0C3471] tracking-widest uppercase block">
                Heritage & Innovation
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-black text-[#0B2144] tracking-tight leading-tight uppercase">
                {introTitle}
              </h2>
              <div className="w-16 h-1 bg-[#E6C073] mt-2" />
            </div>

            <p className="text-sm md:text-base text-gray-500 leading-relaxed font-sans font-light">
              {introBody}
            </p>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#0c3471]/5 flex items-center justify-center text-[#0C3471]">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-[#0B2144] uppercase tracking-wider">Mỹ Quốc</h4>
                <p className="text-[10px] text-gray-400 font-sans leading-relaxed">Sáng lập từ năm 1966 tại Minnesota Hoa Kỳ.</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#0c3471]/5 flex items-center justify-center text-[#0C3471]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-[#0B2144] uppercase tracking-wider">Tiêu chuẩn vàng</h4>
                <p className="text-[10px] text-gray-400 font-sans leading-relaxed">Bộ lọc tối siêu, kiểm định chặt bởi NSF & WQA.</p>
              </div>

              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#0c3471]/5 flex items-center justify-center text-[#0C3471]">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-[#0B2144] uppercase tracking-wider">Chăm sóc sâu</h4>
                <p className="text-[10px] text-gray-400 font-sans leading-relaxed">Tái tạo cấu trúc bảo bọc trọn làn da rạng ngời.</p>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => onNavigate('/ve-pentair')}
                className="group inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#0C3471] hover:text-[#164f9f] transition-colors cursor-pointer"
              >
                Hành trình Pentair 
                <span className="block w-6 h-[1px] bg-[#E6C073] group-hover:w-10 transition-all" />
              </button>
            </div>
          </motion.div>

          {/* Artistic Frame featuring elegant layout design */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative lg:pl-10"
          >
            {/* Visual champagne-border overlay framing */}
            <div className="absolute top-4 left-14 w-full h-full border border-[#E6C073]/30 rounded-2xl -z-10 pointer-events-none hidden sm:block" />
            
            <div className="rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square bg-slate-100 shadow-2xl relative group">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" 
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 pointer-events-none"
                alt="Pentair Kitchen Integration"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2144]/40 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white space-y-1">
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#E6C073] uppercase">Villa Penthouse Integration</span>
                <p className="text-xs font-sans font-light">Tích hợp giải pháp nước tinh khiết chảy qua các không gian bếp hạng sang bậc nhất châu Âu.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
