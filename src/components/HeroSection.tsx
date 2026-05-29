import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Phone } from 'lucide-react';

interface HeroSectionProps {
  bannerTitle: string;
  bannerSubTitle: string;
  onNavigate: (url: string) => void;
}

export default function HeroSection({ bannerTitle, bannerSubTitle, onNavigate }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#07162E] text-white py-24 md:py-36 min-h-[600px] flex items-center">
      {/* Background Graphic Layer representing premium water purification */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none scale-105 filter blur-[1px]" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80')" }} 
      />
      
      {/* Gradient Overlay representing depth and technology */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07162E] via-[#0C3471]/95 to-transparent z-10" />
      
      {/* Dynamic water-wave abstraction */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 opacity-15">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px]">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,3.87,57.06,14.73,81.39,26.54,142.49,56.23,212.72,67,281.39,56.44Z" fill="#ffffff" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E6C073] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#E6C073] font-mono leading-none">
                Pentair USA Standard • Luxury Concept
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-light tracking-tight text-white leading-none uppercase">
              {bannerTitle.split(' - ')[0]}
              <span className="block font-bold text-[#E6C073] mt-2 tracking-normal font-sans text-3xl sm:text-4xl lg:text-5xl">
                {bannerTitle.split(' - ')[1] || bannerTitle}
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-300 font-sans font-light leading-relaxed max-w-2xl border-l-2 border-[#E6C073]/40 pl-4">
              {bannerSubTitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <motion.button 
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/san-pham')} 
                className="px-8 py-4 bg-[#0C3471] hover:bg-[#164f9f] text-white font-bold text-xs uppercase tracking-widest rounded shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center gap-2 border border-white/10"
                id="btn-hero-explore"
              >
                Khám phá giải pháp
                <ArrowRight className="w-4 h-4 text-[#E6C073]" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02, bg: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/lien-he')} 
                className="px-8 py-4 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded bg-white/5 backdrop-blur-xs transition-all cursor-pointer flex items-center gap-2"
                id="btn-hero-contact"
              >
                Nhận tư vấn khảo sát
              </motion.button>
            </div>
          </motion.div>

          {/* Luxury Column showcasing elite product tower */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-4 hidden lg:block"
          >
            <div className="p-1 bg-gradient-to-tr from-white/10 via-white/5 to-transparent rounded-2xl">
              <div className="p-6 bg-[#07162E]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
                <span className="absolute top-4 right-4 text-[9px] font-mono text-[#E6C073] bg-[#E6C073]/10 border border-[#E6C073]/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  USA Certified 
                </span>
                
                <div className="aspect-[4/5] rounded-xl overflow-hidden shadow-inner bg-slate-930 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none" 
                    alt="Pentair Tower" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07162E] via-transparent to-transparent opacity-60" />
                </div>

                <div className="mt-4 space-y-1">
                  <h3 className="text-xs font-mono text-[#E6C073] tracking-widest uppercase">Elite Showcase</h3>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-white">Pentair Smart Water System</h4>
                  <p className="text-[11px] text-slate-400 font-sans font-light leading-relaxed">
                    Kiệt tác nâng tầm giá trị sống dòng biệt thự đơn lập, lâu đài vĩnh cửu.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
