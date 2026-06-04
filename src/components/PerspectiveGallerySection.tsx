import React from 'react';
import { motion } from 'motion/react';
import { Home, Building2, Palmtree, Utensils, Construction, ChevronRight } from 'lucide-react';

interface PerspectiveItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  spaceType: string;
  status: string;
}

interface PerspectiveGallerySectionProps {
  galleryTitle?: string;
  gallerySubtitle?: string;
  perspectives?: PerspectiveItem[];
  onNavigate?: (url: string) => void;
}

const SPACE_LABELS: Record<string, { label: string, icon: any }> = {
  villa: { label: 'Biệt thự', icon: Home },
  townhouse: { label: 'Nhà phố', icon: Building2 },
  apartment: { label: 'Căn hộ', icon: Building2 }
};

export default function PerspectiveGallerySection({
  galleryTitle = "Pentair trong không gian sống hiện đại",
  gallerySubtitle = "Kiến tạo vẻ đẹp sang trọng, tinh tế chuẩn châu Âu cho các biệt thự, dinh thự cao cấp.",
  perspectives = [],
  onNavigate = () => {}
}: PerspectiveGallerySectionProps) {

  // Default hardcoded beautiful fallbacks if database is empty initially
  const displayedItems = perspectives && perspectives.length > 0 ? perspectives.slice(0, 4) : [
    {
      id: "per-1",
      title: "Phối cảnh hệ lọc biệt thự đảo Chateau Phú Mỹ Hưng",
      slug: "biet-thu-chateau-phu-my-hung",
      excerpt: "Bố trí tích hợp tại phòng kỹ thuật mái hầm Villa, đảm bảo tính thẩm mỹ cực cao và áp lực nước sinh hoạt dồi dào.",
      featuredImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
      spaceType: "villa",
      status: "published"
    },
    {
      id: "per-2",
      title: "Trạm lọc nước tổng biệt thự liền kề Vinhomes Riverside",
      slug: "biet-thu-vinhomes-riverside",
      excerpt: "Mô-đun siêu lọc màng UF Pentair hợp nhất gọn gàng tại kho sân sau, đảm bảo nước ăn uống chuẩn NSF quốc tế.",
      featuredImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80",
      spaceType: "villa",
      status: "published"
    },
    {
      id: "per-3",
      title: "Pentair lọc tổng Pentek cho Penthouse Grand Marina Saigon",
      slug: "penthouse-grand-marina-saigon",
      excerpt: "Nối trực tiếp tủ lọc tại ban công bếp, cấp nước giặt rửa tinh khiết bảo vệ vòi mạ thiếc, lavabo sứ nhập khẩu.",
      featuredImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
      spaceType: "apartment",
      status: "published"
    },
    {
      id: "per-4",
      title: "Hệ thống tủ lọc làm mềm nước nhà phố liền kề Thảo Điền",
      slug: "nha-pho-lien-ke-thao-dien",
      excerpt: "Thiết kế âm tường gọn gàng, xử lý toàn diện nước cứng bằng muối hoàn nguyên tinh khiết bảo vệ làn da mái tóc.",
      featuredImage: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=600&q=80",
      spaceType: "townhouse",
      status: "published"
    }
  ] as PerspectiveItem[];

  return (
    <section className="bg-slate-50 py-24 z-10 relative" id="perspective-gallery-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Generous section header details */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-[#0B2144] tracking-tight">
            {galleryTitle}
          </h2>
          <div className="w-12 h-[3px] bg-amber-500 mx-auto mt-2" />
          <p className="text-xs sm:text-sm text-gray-500 font-sans font-light max-w-xl mx-auto leading-relaxed">
            {gallerySubtitle}
          </p>
        </div>

        {/* Dynamic Bento/Grid style representation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedItems.map((item, idx) => {
            const spaceConfig = SPACE_LABELS[item.spaceType] || { label: 'Kiến trúc', icon: Home };
            const Icon = spaceConfig.icon;
            
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => onNavigate(`/phoi-canh/${item.slug}`)}
                className="group relative overflow-hidden bg-white rounded-3xl border border-gray-150 shadow-sm hover:shadow-xl transition-all duration-500 aspect-[4/5] cursor-pointer"
              >
                {/* Visual Image cover with brightness containment */}
                <img 
                  src={item.featuredImage} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-103 duration-700 transition-transform filter brightness-95" 
                  referrerPolicy="no-referrer"
                />
                
                {/* Advanced Visual Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-85 group-hover:opacity-90 transition-opacity duration-300" />
                
                {/* Categorization floating badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase text-gray-800 shadow-sm border border-gray-200/50 flex items-center gap-1 z-10 transition-transform group-hover:translate-y-0.5">
                  <Icon className="w-3 h-3 text-blue-600" />
                  <span>{spaceConfig.label}</span>
                </div>

                {/* Information captions and CTA Actions */}
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-2 select-none">
                  <span className="text-[9px] font-mono font-bold text-amber-400 tracking-widest uppercase block mb-1">
                    0{idx + 1} • Space Solution
                  </span>
                  
                  <h3 className="text-xs sm:text-sm font-black tracking-tight uppercase leading-snug text-white line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-[11px] text-slate-300 font-sans font-light leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 duration-300 transition-opacity">
                    {item.excerpt}
                  </p>
                  
                  <div className="pt-2 flex items-center gap-1 text-[10px] font-extrabold text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 duration-300 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <span>Xem phối cảnh chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Link to see all perspectives */}
        <div className="text-center mt-12">
          <button 
            onClick={() => onNavigate('/phoi-canh')}
            className="px-6 py-3 bg-white hover:bg-slate-100 text-[#0B2144] font-bold text-xs uppercase border border-gray-200 rounded-full transition-all cursor-pointer flex items-center gap-1.5 justify-center mx-auto shadow-sm"
          >
            Khám phá tất cả phối cảnh <ChevronRight className="w-4 h-4 text-blue-650" />
          </button>
        </div>

      </div>
    </section>
  );
}
