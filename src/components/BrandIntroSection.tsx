import React from 'react';
import { motion } from 'motion/react';
import { Globe, CheckCircle2, Users } from 'lucide-react';

interface BrandIntroSectionProps {
  introTitle: string;
  introBody: string;
  onNavigate: (url: string) => void;
  homepageSettings?: any;
}

export default function BrandIntroSection({ introTitle, introBody, onNavigate, homepageSettings = {} }: BrandIntroSectionProps) {
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
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-black text-[#0B2144] tracking-tight leading-tight uppercase">
                {homepageSettings.introTitle || introTitle}
              </h2>
              <div className="w-16 h-1 bg-[#E6C073] mt-2" />
            </div>

            <p className="text-sm md:text-base text-gray-500 leading-relaxed font-sans font-light whitespace-pre-line">
              {homepageSettings.introBody || introBody}
            </p>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#0c3471]/5 flex items-center justify-center text-[#0C3471]">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#0B2144] uppercase tracking-wider leading-snug">{homepageSettings.introFeature1Title || 'Được tin dùng tại hơn 150 quốc gia'}</h4>
                <p className="text-xs text-gray-500 font-sans leading-relaxed">{homepageSettings.introFeature1Desc || 'Giải pháp nước hiện diện rộng khắp tại các thị trường phát triển trên toàn thế giới.'}</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#0c3471]/5 flex items-center justify-center text-[#0C3471]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#0B2144] uppercase tracking-wider leading-snug">{homepageSettings.introFeature2Title || 'Chất lượng đã được kiểm chứng'}</h4>
                <p className="text-xs text-gray-500 font-sans leading-relaxed">{homepageSettings.introFeature2Desc || 'Các giải pháp được phát triển theo tiêu chuẩn quốc tế nhằm đảm bảo hiệu quả vận hành lâu dài.'}</p>
              </div>

              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#0c3471]/5 flex items-center justify-center text-[#0C3471]">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#0B2144] uppercase tracking-wider leading-snug">{homepageSettings.introFeature3Title || 'Được hàng triệu Khách hàng tin dùng'}</h4>
                <p className="text-xs text-gray-500 font-sans leading-relaxed">{homepageSettings.introFeature3Desc || 'Pentair đã được hàng triệu khách hàng trên thế giới đánh giá cao về chất lượng và hiệu suất.'}</p>
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
            
            <div className="relative group">
              <img 
                src={homepageSettings.introImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"} 
                className="w-full h-auto object-contain rounded-2xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-700 pointer-events-none"
                alt="Pentair Kitchen Integration"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
