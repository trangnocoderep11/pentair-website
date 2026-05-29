import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, Building2, Utensils, Check, ArrowUpRight, 
  ChevronRight, Box, Layers, Filter, Compass, Grid, ListCollapse
} from 'lucide-react';
import { Post } from '../types';

interface SpacePerspectiveGalleryProps {
  perspectives: any[];
  posts: Post[];
  onNavigate: (url: string) => void;
  activeSpaceFilter?: string;
}

const SPACE_LABELS: Record<string, { label: string, icon: any }> = {
  villa: { label: 'Biệt Thự Cao Cấp', icon: Home },
  townhouse: { label: 'Nhà Phố Liền Kề', icon: Building2 },
  apartment: { label: 'Chung Cư / Penthouse', icon: Building2 }
};

export default function SpacePerspectiveGallery({
  perspectives = [],
  posts = [],
  onNavigate,
  activeSpaceFilter = 'all'
}: SpacePerspectiveGalleryProps) {
  
  // State for pagination limit to keep page performant and scroll-responsive
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 12;

  // Format currency helper
  const formatCurrency = (value: any) => {
    if (!value) return "Liên hệ";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Extract all single images into a flattened premium catalog
  const allGalleryItems = React.useMemo(() => {
    const items: any[] = [];

    perspectives.forEach((p) => {
      // 1. Featured covers
      if (p.featuredImage) {
        items.push({
          id: `${p.id}-cover`,
          url: p.featuredImage,
          title: p.title,
          spaceType: p.spaceType || 'villa',
          excerpt: p.excerpt || "Tổng quan giải pháp kỹ thuật lọc nước tối thượng.",
          conceptName: "Không gian kiến trúc tổng thể",
          type: "exterior",
          slug: p.slug,
          parentTitle: p.title,
          relatedProductIds: p.relatedProductIds || []
        });
      }

      // Default fallback images matches the theme context
      const defaultRusticPhotos = [
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1542013936-8848e574047a?auto=format&fit=crop&w=600&q=80"
      ];
      const defaultWasabiPhotos = [
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=600&q=80"
      ];

      const pRustic = p.gallery && p.gallery.length > 0 ? p.gallery : defaultRusticPhotos;
      const pWasabi = p.productGallery && p.productGallery.length > 0 ? p.productGallery : defaultWasabiPhotos;

      // 2. Rustic Concept Drawings
      pRustic.forEach((url, index) => {
        items.push({
          id: `${p.id}-rustic-${index}`,
          url,
          title: p.title,
          spaceType: p.spaceType || 'villa',
          excerpt: `Phối cảnh 3D góc vân gỗ óc chó Walnut trầm tối tịnh ấm tích hợp lọc tổng Pentair.`,
          conceptName: "Rustic Dark Wood Concept",
          type: "rustic",
          slug: p.slug,
          parentTitle: p.title,
          relatedProductIds: p.relatedProductIds || []
        });
      });

      // 3. Wasabi Concept Drawings
      pWasabi.forEach((url, index) => {
        items.push({
          id: `${p.id}-wasabi-${index}`,
          url,
          title: p.title,
          spaceType: p.spaceType || 'villa',
          excerpt: `Mẫu thiết kế tủ bếp gỗ sồi kết hợp tone xanh Mint trang nhã đón ánh sáng thiên nhiên.`,
          conceptName: "Wasabi Sage Green Concept",
          type: "wasabi",
          slug: p.slug,
          parentTitle: p.title,
          relatedProductIds: p.relatedProductIds || []
        });
      });
    });

    return items;
  }, [perspectives]);

  // Apply filters in sequence: Architecture/Space filters
  const filteredItems = React.useMemo(() => {
    return allGalleryItems.filter(item => {
      // Filter by spaceType (villa, townhouse, apartment)
      return activeSpaceFilter === 'all' || item.spaceType === activeSpaceFilter;
    });
  }, [allGalleryItems, activeSpaceFilter]);

  // Handle pagination slices
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItemsSlice = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeSpaceFilter]);

  return (
    <div className="space-y-12 font-sans" id="space-perspective-luxury-gallery border-t border-gray-100 pt-6">
      
      {/* LUXURIOUS EUROPEAN GRID GALLERY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentItemsSlice.map((item, idx) => {
          // Find the connected products
          const relatedProds = (item.relatedProductIds || []).map((pId: string) => {
            return posts.find(p => p.id === pId && p.type === 'product');
          }).filter(Boolean);

          const spaceInfo = SPACE_LABELS[item.spaceType] || { label: 'Kiến Trúc', icon: Home };
          const SpaceIcon = spaceInfo.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: Math.min(idx * 0.08, 0.4) }}
              className="bg-white rounded-[2rem] border border-gray-150 overflow-hidden shadow-sm hover:shadow-2xl hover:border-blue-300 transition-all duration-500 group flex flex-col justify-between"
            >
              
              {/* IMAGE TRAY COMPONENT WITH HIGH QUALITY ZOOM LAYOUT */}
              <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
                <img 
                  src={item.url} 
                  alt={item.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter brightness-[0.98]"
                />

                {/* Left Floating Category Badges */}
                <div className="absolute top-4 left-4 z-15 flex flex-col gap-1.5 pointer-events-none">
                  <span className="bg-[#0C3471]/95 text-white text-[8px] font-black tracking-widest px-2.5 py-1 rounded-lg uppercase flex items-center gap-1 backdrop-blur select-none">
                    <SpaceIcon className="w-2.5 h-2.5" />
                    {spaceInfo.label}
                  </span>
                  <span className="bg-amber-500/95 text-black text-[8.5px] font-extrabold tracking-wide px-2 py-0.5 rounded uppercase backdrop-blur select-none">
                    {item.conceptName}
                  </span>
                </div>

                {/* Premium interactive overlay displayed beautifully when hovering */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                  <span className="text-[9px] font-mono font-bold text-amber-300 tracking-widest uppercase mb-1">
                    Pentair Modern Solution
                  </span>
                  <h4 className="text-white text-xs font-black uppercase tracking-tight line-clamp-1">
                    {item.parentTitle}
                  </h4>
                  <p className="text-gray-300 text-[10px] font-sans font-light leading-relaxed mt-1 line-clamp-2">
                    {item.excerpt}
                  </p>
                  
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[8px] font-mono text-gray-400">MODEL CODE: {item.slug?.toUpperCase()}</span>
                    
                    <button
                      onClick={() => onNavigate(`/phoi-canh/${item.slug}`)}
                      className="text-[9px] font-extrabold uppercase text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <span>Xem tư vấn</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION & PRODUCT VALUE BENCH WITH NO POPUPS */}
              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                
                {/* Space and design info */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black text-slate-900 group-hover:text-blue-700 uppercase tracking-tight transition-colors line-clamp-1">
                    {item.parentTitle}
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-sans font-light line-clamp-2">
                    {item.excerpt}
                  </p>
                </div>

                {/* Inline Recommended Pentair Systems shelf - directly visible, luxury alignment */}
                {relatedProds.length > 0 && (
                  <div className="pt-3.5 border-t border-gray-100 space-y-2">
                    <div className="flex items-center gap-1">
                      <span className="p-0.5 bg-blue-50 rounded-md">
                        <Utensils className="w-3 h-3 text-[#0C3471]" />
                      </span>
                      <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-more">
                        Hệ lọc tích hợp khuyên dùng:
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {relatedProds.slice(0, 2).map((prod: any) => {
                        const priceHide = prod.meta?.hide_price === true || prod.meta?.hide_price === 'true';
                        return (
                          <div
                            key={prod.id}
                            onClick={() => onNavigate(`/san-pham/${prod.slug}`)}
                            className="bg-slate-50 border border-gray-150 rounded-xl p-2 cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all flex items-center gap-2 group/prod"
                          >
                            <img 
                              src={prod.featuredImage} 
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 object-contain bg-white p-1 rounded-lg border border-gray-100 flex-shrink-0 group-hover/prod:scale-105 transition-transform"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[9.5px] font-bold text-gray-800 truncate leading-none group-hover/prod:text-blue-700 uppercase">
                                {prod.title}
                              </p>
                              <span className="text-[8.5px] font-semibold text-blue-800 font-mono">
                                {priceHide ? 'Liên hệ' : formatCurrency(prod.meta?.sale_price || prod.meta?.regular_price)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* MULTI-PAGE PAGINATION FOR LUXURIOUS VISUAL EXPOSURE */}
      {totalPages > 1 && (
        <div className="pt-8 border-t border-gray-150 flex items-center justify-between select-none">
          <p className="text-xs text-gray-500 font-sans font-light">
            Đang hiển thị <strong className="text-slate-900 font-medium">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</strong> trên tổng số <strong className="text-slate-900 font-medium">{filteredItems.length}</strong> hình ảnh phối cảnh chất lượng cao.
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                currentPage === 1
                  ? 'border-gray-200 text-gray-300 pointer-events-none'
                  : 'border-gray-300 text-gray-700 hover:bg-slate-50'
              }`}
            >
              Trước
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  currentPage === i + 1
                    ? 'bg-[#0C3471] border border-[#0C3471] text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-300 pointer-events-none'
                  : 'border-gray-300 text-gray-700 hover:bg-slate-50'
              }`}
            >
              Tiếp
            </button>
          </div>
        </div>
      )}

      {/* Fallback empty message details */}
      {filteredItems.length === 0 && (
        <div className="py-16 text-center max-w-sm mx-auto space-y-3 bg-white border border-gray-150 rounded-[2rem] p-6">
          <Box className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="text-xs font-bold text-gray-800 uppercase">Không tìm thấy hình phối cảnh phù hợp tuyển tập</h4>
          <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
            Thay đổi phân loại không gian ở trên để tiếp tục chiêm ngưỡng các thiết kế sang trọng từ Pentair Mỹ.
          </p>
        </div>
      )}

    </div>
  );
}
