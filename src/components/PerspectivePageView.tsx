import React from 'react';
import { 
  Home, Building2, Palmtree, Utensils, Construction, CheckCircle2, 
  ChevronRight, Calendar, ArrowLeft, Send, Sparkles, Filter, 
  MapPin, Phone, ShieldCheck, Mail, Users, RefreshCw,
  ChevronLeft, X, Maximize2, Image as ImageIcon, Layers,
  LayoutGrid, Sliders, Play, Pause
} from 'lucide-react';
import { Post } from '../types';
import Breadcrumb from './Breadcrumb';
import SpacePerspectiveGallery from './SpacePerspectiveGallery';

interface PerspectivePageViewProps {
  currentPath: string;
  onNavigate: (url: string) => void;
  posts: Post[];
  perspectives: any[];
  onFormSubmitSuccess: () => void;
  brandSettings: any;
}

const defaultRusticPhotos = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1542013936-8848e574047a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80"
];

const defaultWasabiPhotos = [
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&w=600&q=80"
];

const SPACE_TYPES = [
  { value: 'all', label: 'Tất cả không gian', icon: Filter },
  { value: 'villa', label: 'Biệt thự', icon: Home },
  { value: 'townhouse', label: 'Nhà phố', icon: Building2 },
  { value: 'apartment', label: 'Căn hộ chung cư', icon: Building2 }
];

export default function PerspectivePageView({
  currentPath,
  onNavigate,
  posts,
  perspectives,
  onFormSubmitSuccess,
  brandSettings
}: PerspectivePageViewProps) {
  
  const isDetail = currentPath.startsWith('/phoi-canh/');
  const activeSlug = isDetail ? currentPath.replace('/phoi-canh/', '') : null;
  const activePerspective = activeSlug ? perspectives.find(p => p.slug === activeSlug) : null;
  
  const productFilters = React.useMemo(() => {
    const prods = posts.filter(p => p.type === 'product' && (p.status === 'publish' || p.status === 'published' || p.status === 'active'));
    return [
      { value: 'all', label: 'Tất cả sản phẩm', icon: Filter },
      ...prods.map(p => {
        let cleanName = p.title;
        cleanName = cleanName.replace(/Hệ thống lọc tổng /i, '');
        cleanName = cleanName.replace(/Hệ thống lọc nước /i, '');
        return {
          value: p.id,
          label: cleanName,
          icon: Layers
        };
      })
    ];
  }, [posts]);

  const [activeProductFilter, setActiveProductFilter] = React.useState('all');

  // Album/Gallery State variables for detailed perspective view
  const [viewMode, setViewMode] = React.useState<'gallery' | 'grid'>('gallery');
  const [isAutoplay, setIsAutoplay] = React.useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [albumFilter, setAlbumFilter] = React.useState<'all' | 'drawings' | 'products'>('all');

  // List-view Lightbox state
  const [listLightboxOpen, setListLightboxOpen] = React.useState(false);
  const [listLightboxIndex, setListLightboxIndex] = React.useState(0);
  const [listLightboxImages, setListLightboxImages] = React.useState<any[]>([]);
  const [listLightboxActiveP, setListLightboxActiveP] = React.useState<any>(null);

  // Lead fields for local quote request inside detail
  const [leadForm, setLeadForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const formatCurrency = (value: any) => {
    if (!value) return "Liên hệ";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Album lists for details view computed at the top level
  const albumList = React.useMemo(() => {
    if (!activePerspective) return [];
    const rusticList = (activePerspective.gallery && activePerspective.gallery.length > 0)
      ? [...activePerspective.gallery, ...defaultRusticPhotos.slice(activePerspective.gallery.length)].slice(0, 10)
      : defaultRusticPhotos;

    const wasabiList = (activePerspective.productGallery && activePerspective.productGallery.length > 0)
      ? [...activePerspective.productGallery, ...defaultWasabiPhotos.slice(activePerspective.productGallery.length)].slice(0, 10)
      : defaultWasabiPhotos;

    return [
      ...rusticList.map((url, i) => ({
        url,
        type: 'drawings',
        title: `Rustic - Dark Brown Concept #${i + 1}`,
        desc: "Sự kết hợp hoàn hảo giữa thiết bị vòi lọc nước Pentair và chất gỗ óc chó gam tối trầm tĩnh phong nhã."
      })),
      ...wasabiList.map((url, i) => ({
        url,
        type: 'products',
        title: `Wasabi - Green Concept #${i + 1}`,
        desc: "Tone xanh sage ngọc nhạt và tủ bếp tự nhiên sồi ấm áp thanh thản của phong cách Wasabi."
      }))
    ];
  }, [activePerspective]);

  const filteredAlbumList = React.useMemo(() => {
    return albumFilter === 'all'
      ? albumList
      : albumList.filter(x => x.type === albumFilter);
  }, [albumList, albumFilter]);

  // Autoplay effect
  React.useEffect(() => {
    let tid: any = null;
    if (isAutoplay && isDetail && filteredAlbumList.length > 0) {
      tid = setInterval(() => {
        setActivePhotoIndex((prev) => (prev + 1) % filteredAlbumList.length);
      }, 4000);
    }
    return () => {
      if (tid) clearInterval(tid);
    };
  }, [isAutoplay, isDetail, filteredAlbumList.length]);

  // Keyboard navigation for lightbox modals (Arrow keys & Escape)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen && albumList.length > 0) {
        if (e.key === 'ArrowLeft') {
          setLightboxIndex((prev) => (prev - 1 + albumList.length) % albumList.length);
        } else if (e.key === 'ArrowRight') {
          setLightboxIndex((prev) => (prev + 1) % albumList.length);
        } else if (e.key === 'Escape') {
          setIsLightboxOpen(false);
        }
      }

      if (listLightboxOpen && listLightboxImages.length > 0) {
        if (e.key === 'ArrowLeft') {
          setListLightboxIndex((prev) => (prev - 1 + listLightboxImages.length) % listLightboxImages.length);
        } else if (e.key === 'ArrowRight') {
          setListLightboxIndex((prev) => (prev + 1) % listLightboxImages.length);
        } else if (e.key === 'Escape') {
          setListLightboxOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, listLightboxOpen, albumList, listLightboxImages]);

  const handleSubquote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone || !leadForm.email) {
      setError('Vui lòng hoàn thành Họ tên, Số điện thoại và Email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        message: leadForm.message,
        productInterest: activePerspective ? `Tư vấn thiết kế: ${activePerspective.title}` : 'Phối cảnh không gian cao cấp',
        sourceUrl: window.location.href,
        formName: activePerspective ? `Yêu cầu báo giá & thiết kế riêng phối cảnh: ${activePerspective.title}` : 'Yêu cầu tư vấn tuyển tập phối cảnh 3D'
      };

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gửi thất bại.');

      setSuccess(true);
      setLeadForm({ name: '', phone: '', email: '', message: '' });
      onFormSubmitSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi liên hệ.');
    } finally {
      setLoading(false);
    }
  };

  // RENDER DETAILED PERSPECTIVE PAGE
  if (isDetail) {
    if (!activePerspective) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-black text-gray-950 uppercase font-sans">Không tìm thấy phối cảnh</h2>
          <p className="text-gray-600 text-sm">Vui lòng quay lại hoặc chọn không gian khác.</p>
          <button 
            onClick={() => onNavigate('/phoi-canh')}
            className="px-6 py-2.5 bg-blue-700 text-white font-semibold text-xs rounded-lg uppercase tracking-wider hover:bg-blue-800 transition-all font-sans cursor-pointer"
          >
            Quay lại danh mục
          </button>
        </div>
      );
    }

    const currentPhoto = filteredAlbumList[activePhotoIndex] || filteredAlbumList[0] || albumList[0];

    // Safe filter click handler
    const handleCategoryFilter = (filterType: 'all' | 'drawings' | 'products') => {
      setAlbumFilter(filterType);
      setActivePhotoIndex(0); // Reset index to avoid out-of-bounds error
    };

    // Resolve related products from posts database safely
    const relatedProducts = (activePerspective.relatedProductIds || []).map((pId: string) => {
      return posts.find(p => p.id === pId && p.type === 'product');
    }).filter(Boolean);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn" id={`perspective-detail-${activePerspective.id}`}>
        <Breadcrumb 
          items={[
            { label: 'Phối cảnh không gian', url: '/phoi-canh' },
            { label: activePerspective.title }
          ]} 
          onNavigate={onNavigate} 
        />

        <div className="mt-4 mb-6">
          <button 
            onClick={() => onNavigate('/phoi-canh')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-700 transition-all uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại phối cảnh tổng thể
          </button>
        </div>

        {/* Hero header with integrated interactive Concept Album Board Grid consistent with mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8 animate-slideUp">
            
            {/* Perspective Title & Excerpt header */}
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm font-sans tracking-widest inline-block select-none">
                {SPACE_TYPES.find(s => s.value === activePerspective.spaceType)?.label || activePerspective.spaceType}
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight uppercase">
                {activePerspective.title}
              </h1>
              <p className="text-gray-600 text-sm font-sans font-light border-l-4 border-blue-600 pl-4 py-2 bg-blue-50/40 rounded-r-2xl leading-relaxed">
                {activePerspective.excerpt || "Bảo chứng chuẩn không gian sống hiện đại thượng lưu bằng trạm lọc nước Pentair đặt vị trí thẩm mỹ cao."}
              </p>
            </div>

            {/* FULLY VISIBLE EDITORIAL CONCEPT SHOWCASE (NO TOGGLES, NO TRIGGERS REQUIRED) */}
            <div className="space-y-16 animate-slideUp font-sans">
              
              {/* CONCEPT 1: Rustic – Dark Brown Concept */}
              <div className="space-y-8">
                <div className="border-b border-gray-150 pb-4">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg font-sans">
                    Luxury Option A
                  </span>
                  <h2 className="text-lg md:text-2xl font-black text-[#1B4E7A] uppercase tracking-tight mt-2.5 flex items-center gap-2">
                    <span>Rustic – Dark Brown Concept</span>
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  </h2>
                  <p className="text-gray-500 text-xs md:text-sm mt-1 leading-relaxed font-light">
                    Sự kết hợp hoàn hảo giữa trạm lọc nước Pentair USA và chất liệu gỗ óc chó Walnut gam trầm tối tối thượng. Phối cảnh render 3D phác hoạ không gian máy tinh tế, hòa hợp lý tưởng với hầm rượu biệt thự hoặc gian bếp chính thượng lưu.
                  </p>
                </div>

                {/* Highly structured, fully dynamic, gorgeous grid showcasing ALL Rustic images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {rusticConceptList.map((url, i) => (
                    <div 
                      key={i}
                      onClick={() => {
                        setLightboxIndex(i);
                        setIsLightboxOpen(true);
                      }}
                      className="bg-white border border-gray-150 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-500 cursor-zoom-in group"
                    >
                      <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
                        <img 
                          src={url} 
                          alt={`Rustic concept render ${i+1}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.96]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-xl text-[9px] font-mono font-black text-amber-400 tracking-wider">
                          RUSTIC CONCEPT #{i+1}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Click to expand ⤢
                        </div>
                      </div>
                      <div className="p-6 space-y-2 bg-slate-50/50 border-t border-gray-100">
                        <h4 className="text-xs font-extrabold text-[#1B4E7A] uppercase">Rustic Concept - Phân cảnh #{i+1}</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-light font-sans">
                          {i === 0 
                            ? "Góc nhìn phối cảnh đại diện thể hiện vị trí trạm lọc trung tâm của Pentair đặt ăn khớp trong tủ gỗ Walnut sang trọng." 
                            : i === 1 
                            ? "Cận cảnh bộ điều khiển Fleck mạ chrome cao cấp phối hợp xuất sắc cùng thiết kế bồn rửa phong cách cổ điển." 
                            : i === 2 
                            ? "Mô tả mặt bằng bóc tách kĩ thuật lắp đặt lõi lọc tháo lắp thông minh của Pentair trong không gian hẹp tủ dưới." 
                            : "Vỏ tủ gỗ trầm chống ẩm tinh tế bọc kín các linh kiện phức tạp, tôn vinh phong thái ngăn nắp tinh tế của ngôi nhà."
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONCEPT 2: Wasabi – Green Concept */}
              <div className="space-y-8">
                <div className="border-b border-gray-150 pb-4">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg font-sans">
                    Luxury Option B
                  </span>
                  <h2 className="text-lg md:text-2xl font-black text-[#136B60] uppercase tracking-tight mt-2.5 flex items-center gap-2">
                    <span>Wasabi – Green Concept</span>
                    <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
                  </h2>
                  <p className="text-gray-500 text-xs md:text-sm mt-1 leading-relaxed font-light">
                    Sự kết tinh từ gam màu Sage Green ngọc nhạt thanh khiết kề bên các diện gỗ sồi ấm áp. Phong cách Wasabi thanh thản đem thiên nhiên tràn ngập sức sống vào căn hộ hiện đại hoặc nhà liền kề tối giản trẻ trung.
                  </p>
                </div>

                {/* Highly structured, fully dynamic, gorgeous grid showcasing ALL Wasabi images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {wasabiConceptList.map((url, i) => (
                    <div 
                      key={i}
                      onClick={() => {
                        setLightboxIndex(rusticConceptList.length + i);
                        setIsLightboxOpen(true);
                      }}
                      className="bg-white border border-gray-150 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-500 cursor-zoom-in group"
                    >
                      <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
                        <img 
                          src={url} 
                          alt={`Wasabi concept render ${i+1}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.96]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-xl text-[9px] font-mono font-black text-emerald-400 tracking-wider">
                          WASABI CONCEPT #{i+1}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Click to expand ⤢
                        </div>
                      </div>
                      <div className="p-6 space-y-2 bg-slate-50/50 border-t border-gray-100">
                        <h4 className="text-xs font-extrabold text-[#136B60] uppercase">Wasabi Concept - Phân cảnh #{i+1}</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-light font-sans">
                          {i === 0 
                            ? "Góc chụp chính đón nắng tự nhiên tôn lên nẹp tủ sồi nhạt tự nhiên kết bọc hài hòa cùng vòi Pentair hiện đại." 
                            : i === 1 
                            ? "Góc nhìn từ tủ đảo bếp xanh nhạt phối kính cường lực thanh thản, làm sáng bừng thiết kế bếp mở gia đình." 
                            : i === 2 
                            ? "Bản mô tả chi tiết đấu nối các lõi sợi lọc Everpure USA cao cấp vận hành tự động, thao tác cực gọn nhẹ." 
                            : "Phong cách bố trí gọn gàng tối ưu hóa từng cm vuông diện tích căn hộ cao cấp, vừa thẩm mỹ vừa tiện học."
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Helper Micro-copy explaining interaction */}
              <div className="pt-2 text-center text-xs font-sans text-gray-400 border-t border-gray-100 flex items-center justify-center gap-1.5 select-none">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Bấm vào hình ảnh bất kỳ để mở rộng góc nhìn toàn cảnh siêu sắc nét chất lượng cao 4K</span>
              </div>
            </div>

            {/* Narrative detail rich content */}
            <div className="prose prose-blue max-w-none text-gray-650 font-sans text-xs md:text-sm leading-relaxed space-y-4 border-t border-gray-100 pt-6 font-light">
              <div dangerouslySetInnerHTML={{ __html: activePerspective.content || '<p>Chi tiết thiết kế thi công phối cảnh hệ lọc này đang được cập nhật chuyên sâu...</p>' }} />
            </div>

            {/* Dynamic Immersive Fullscreen Lightbox Modal Overlay code */}
            {isLightboxOpen && (
              <div 
                className="fixed inset-0 bg-black/95 z-55 flex flex-col justify-between p-4 md:p-8 select-none animate-fadeIn font-sans"
                id="lightbox-popup-overlay"
              >
                {/* 1. Header of modal space */}
                <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 block font-bold leading-none">PENTAIR IMAGE ALBUM</span>
                    <h4 className="text-xs font-black uppercase text-white tracking-tight line-clamp-1">{activePerspective.title}</h4>
                  </div>
                  <button 
                    onClick={() => setIsLightboxOpen(false)}
                    className="p-2.5 bg-white/10 hover:bg-red-600/90 rounded-full transition-all cursor-pointer text-white"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* 2. Focused big image view in the middle */}
                <div className="relative flex-grow flex items-center justify-center py-6 px-10">
                  <button 
                    onClick={() => setLightboxIndex((prev) => (prev - 1 + albumList.length) % albumList.length)}
                    className="absolute left-2 md:left-6 p-4 bg-white/5 hover:bg-blue-600 text-white rounded-full transition-all cursor-pointer z-10"
                    title="Hình trước"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="max-w-4xl max-h-[65vh] flex flex-col items-center justify-center space-y-4">
                    <img 
                      src={albumList[lightboxIndex]?.url} 
                      alt={albumList[lightboxIndex]?.title} 
                      className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-white uppercase tracking-wide">
                        {albumList[lightboxIndex]?.title}
                      </p>
                      <p className="text-xs text-gray-400 font-sans tracking-wide max-w-xl font-light">
                        {albumList[lightboxIndex]?.desc}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setLightboxIndex((prev) => (prev + 1) % albumList.length)}
                    className="absolute right-2 md:right-6 p-4 bg-white/5 hover:bg-blue-600 text-white rounded-full transition-all cursor-pointer z-10"
                    title="Hình tiếp theo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* 3. Bottom tray with thumbnails strip and counter */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div className="text-center text-xs text-gray-400 font-mono flex items-center justify-center gap-2">
                    <span className="px-2 py-0.5 bg-white/10 rounded">Ảnh {lightboxIndex + 1} / {albumList.length}</span>
                    <span className="text-blue-400">({albumList[lightboxIndex]?.type === 'drawings' ? 'Rustic – Dark Brown Concept' : 'Wasabi – Green Concept'})</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-2xl mx-auto py-2 px-4 scrollbar-thin">
                    {albumList.map((photo, i) => (
                      <button 
                        key={i}
                        onClick={() => setLightboxIndex(i)}
                        className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          lightboxIndex === i ? 'border-blue-500 scale-105 ring-4 ring-blue-500/10' : 'border-transparent opacity-40 hover:opacity-100 font-light'
                        }`}
                      >
                        <img src={photo.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Related products recommendation Section */}
            <div>
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider mb-5 pb-2 border-b border-gray-150">
                Hệ thống thiết bị lắp đặt tích hợp
              </h3>
              
              {relatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {relatedProducts.map((p: any) => {
                    const priceType = p.meta?.hide_price === true || p.meta?.hide_price === 'true';
                    const listPrice = p.meta?.regular_price;
                    const promoPrice = p.meta?.sale_price;
                    const hasPromo = promoPrice && promoPrice !== "" && Number(promoPrice) < Number(listPrice);

                    return (
                      <div 
                        key={p.id}
                        className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div className="p-4 flex gap-4">
                          <img 
                            src={p.featuredImage || 'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=400&q=80'} 
                            alt={p.title} 
                            className="w-20 h-20 object-cover rounded-xl border border-gray-100 flex-shrink-0 group-hover:scale-105 transition-all duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Pentair Genuine</span>
                            <h4 className="text-xs font-bold text-gray-950 uppercase leading-snug line-clamp-2">
                              {p.title}
                            </h4>
                            <div className="text-[11px] font-sans">
                              {priceType ? (
                                <span className="text-orange-600 font-semibold font-mono uppercase">Liên hệ</span>
                              ) : (
                                <div className="flex flex-col">
                                  {hasPromo ? (
                                    <>
                                      <span className="text-blue-700 font-black font-mono">
                                        {formatCurrency(promoPrice)}
                                      </span>
                                      <span className="text-gray-400 line-through text-[10px] font-mono leading-none">
                                        {formatCurrency(listPrice)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-700 font-bold font-mono">
                                      {formatCurrency(listPrice)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-sans">Mã SP: {p.slug?.toUpperCase()}</span>
                          <button 
                            onClick={() => onNavigate(`/san-pham/${p.slug}`)}
                            className="text-[10px] font-bold text-blue-700 hover:text-blue-900 transition-all flex items-center gap-0.5"
                          >
                            Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 text-center rounded-xl text-xs text-gray-500 border border-dashed border-gray-200">
                  Phối cảnh sử dụng các mô-đun kết nối cao cấp của Pentair USA. Liên hệ tư vấn trực tiếp để thiết kế tủ lọc.
                </div>
              )}
            </div>

          </div>

          {/* Right sidebar form details */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl text-white shadow-lg space-y-6 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
              
              <div className="space-y-2 text-center border-b border-white/10 pb-4">
                <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 block font-bold">Quotation blueprint</span>
                <h3 className="text-sm font-black uppercase text-white">Yêu cầu báo giá thiết kế</h3>
                <p className="text-[11px] text-blue-200 font-sans">Pentair đồng hành thiết kế & bóc tách bản vẽ kỹ thuật miễn phí</p>
              </div>

              {success ? (
                <div className="bg-blue-900/40 p-5 rounded-2xl border border-blue-500/30 text-center space-y-3 animate-slideUp">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white uppercase">Gửi thành công</h4>
                  <p className="text-[11px] text-blue-200 leading-relaxed font-sans">
                    Bản khai yêu cầu liên hệ đã được lưu trữ và lập tức bộ lọc dữ liệu sẽ chuyển tiếp thông báo tức thời đến Admin kỹ thuật tủ.
                  </p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="mt-2 text-[10px] font-bold text-blue-400 underline uppercase"
                  >
                    Gửi phản hồi khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubquote} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-[11px] text-red-300">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wide block">Họ tên của bạn *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nguyễn Văn A"
                      value={leadForm.name}
                      onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wide block">Số điện thoại *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="0901 234 567"
                      value={leadForm.phone}
                      onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wide block">Địa chỉ Email *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="vip@gamil.com"
                      value={leadForm.email}
                      onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wide block">Yêu cầu cụ thể (Tuỳ chọn)</label>
                    <textarea 
                      placeholder="Mô tả sơ bộ vị trí hộp kĩ thuật hoặc biệt thự thô..."
                      rows={3}
                      value={leadForm.message}
                      onChange={e => setLeadForm({...leadForm, message: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-all font-sans"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} 
                    Thiết kế phối cảnh hoàn hảo
                  </button>
                </form>
              )}

              <div className="text-[10px] text-gray-400 font-sans leading-relaxed flex items-start gap-1.5 border-t border-white/10 pt-4">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Cam kết bảo mật thông tin hồ sơ thiết kế và đáp ứng bóc tách van điều khiển Pentair chính xác nhất.
                </span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b pb-2">Liên hệ khảo sát trực tiếp</h4>
              <ul className="text-xs text-gray-600 font-sans space-y-3">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{brandSettings.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Hotline: <strong className="text-blue-700">{brandSettings.phone}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Email: {brandSettings.email}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // RENDER PERSPECTIVE CATALOGUE LIST

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn" id="perspectives-list-view">
      <Breadcrumb items={[{ label: 'Phối cảnh không gian sống hiện đại' }]} onNavigate={onNavigate} />

      {/* Intro section and layout design */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mt-4 mb-10">
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 uppercase">
          Hệ thống lọc tổng Pentair trong không gian sống đẳng cấp
        </h1>
      </div>

      {/* FILTER TABS BUTTONS BAR */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10 pb-2 border-b border-gray-100">
        {productFilters.map(prod => {
          const Icon = prod.icon;
          const isActive = activeProductFilter === prod.value;
          return (
            <button
              key={prod.value}
              onClick={() => setActiveProductFilter(prod.value)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-300 cursor-pointer ${
                isActive 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10 scale-102' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{prod.label}</span>
            </button>
          );
        })}
      </div>

      {/* EUROPEAN LUXURY PORTFOLIO & SPACE PERSPECTIVE GALLERY */}
      <div className="mt-4">
        <SpacePerspectiveGallery 
          perspectives={perspectives} 
          posts={posts} 
          onNavigate={onNavigate} 
          activeProductFilter={activeProductFilter}
          onOpenLightbox={(items, index) => {
            setListLightboxImages(items);
            setListLightboxIndex(index);
            setListLightboxActiveP({ title: items[index]?.parentTitle, slug: items[index]?.slug });
            setListLightboxOpen(true);
          }}
        />
      </div>

      {/* RENDER LIST VIEW IMMERSIVE LIGHTBOX OVERLAY UPON INTERACTION */}
      {listLightboxOpen && listLightboxActiveP && listLightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-55 flex flex-col justify-between p-4 md:p-8 select-none animate-fadeIn font-sans"
          id="list-view-lightbox-overlay"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 block font-bold leading-none">PENTAIR DIRECT BLUEPRINT VIEW</span>
              <h4 className="text-xs font-black uppercase text-white tracking-tight line-clamp-1">{listLightboxActiveP.title}</h4>
            </div>
            <button 
              onClick={() => setListLightboxOpen(false)}
              className="p-2.5 bg-white/10 hover:bg-red-600/90 rounded-full transition-all cursor-pointer text-white"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Focused Big Image Showcase */}
          <div className="relative flex-grow flex items-center justify-center py-6 px-10">
            <button 
              onClick={() => setListLightboxIndex((prev) => (prev - 1 + listLightboxImages.length) % listLightboxImages.length)}
              className="absolute left-2 md:left-6 p-4 bg-white/5 hover:bg-blue-600 text-white rounded-full transition-all cursor-pointer z-10"
              title="Hình trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="max-w-4xl max-h-[65vh] flex flex-col items-center justify-center space-y-4">
              <img 
                src={listLightboxImages[listLightboxIndex]?.url} 
                alt={listLightboxImages[listLightboxIndex]?.title} 
                className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none"
                referrerPolicy="no-referrer"
              />
              <div className="text-center space-y-1">
                <p className="text-md font-extrabold text-white uppercase tracking-wider">
                  {listLightboxImages[listLightboxIndex]?.title}
                </p>
                <p className="text-xs text-gray-400 font-sans tracking-wide max-w-xl font-light">
                  {listLightboxImages[listLightboxIndex]?.desc}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setListLightboxIndex((prev) => (prev + 1) % listLightboxImages.length)}
              className="absolute right-2 md:right-6 p-4 bg-white/5 hover:bg-blue-600 text-white rounded-full transition-all cursor-pointer z-10"
              title="Hình tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dynamic bottom thumbnail tray and metrics counter */}
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div className="text-center text-xs text-gray-400 font-mono flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 bg-white/10 rounded-lg text-white">Ảnh {listLightboxIndex + 1} / {listLightboxImages.length}</span>
              <span className="text-blue-400">({listLightboxActiveP.slug})</span>
            </div>

            <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-2xl mx-auto py-2 px-4 scrollbar-thin">
              {listLightboxImages.map((photo, i) => (
                <button 
                  key={i}
                  onClick={() => setListLightboxIndex(i)}
                  className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                    listLightboxIndex === i ? 'border-blue-500 scale-105 ring-4 ring-blue-500/10' : 'border-transparent opacity-40 hover:opacity-100 font-light'
                  }`}
                >
                  <img src={photo.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
