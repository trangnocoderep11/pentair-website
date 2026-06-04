/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Award, Shield, Zap, Sparkles, AlertCircle, RefreshCw, CheckCircle2, 
  ChevronRight, Calendar, User, Search, MapPin, Phone, HelpCircle, ArrowRight,
  ShoppingBag, CreditCard, Plus, Minus
} from 'lucide-react';
import { Post, Term } from '../types';
import Breadcrumb from './Breadcrumb';

// Import newly created luxury modular homepage sections
import HeroSection from './HeroSection';
import BrandIntroSection from './BrandIntroSection';
import WhyChoosePentairSection from './WhyChoosePentairSection';
import FeaturedProductsSection from './FeaturedProductsSection';
import ProductVideoSection from './ProductVideoSection';
import PerspectiveGallerySection from './PerspectiveGallerySection';
import ExploreMoreSection from './ExploreMoreSection';
import NewsSection from './NewsSection';
import ContactCTASection from './ContactCTASection';
import PerspectivePageView from './PerspectivePageView';

interface PublicPagesProps {
  currentPath: string;
  onNavigate: (url: string) => void;
  brandSettings: {
    siteName: string;
    tagline: string;
    email: string;
    phone: string;
    address: string;
    facebook: string;
    youtube: string;
  };
  showrooms: { name: string; address: string; phone: string }[];
  posts: Post[];
  terms: Term[];
  currentUser?: any;
  onFormSubmitSuccess: () => void;
  videos: any[];
  onAddToCart?: (product: Post, quantity?: number, autoOpen?: boolean) => void;
  headerSettings?: any;
  homepageSettings?: any;
}

export default function PublicPages({
  currentPath,
  onNavigate,
  brandSettings,
  showrooms,
  posts,
  terms,
  currentUser,
  onFormSubmitSuccess,
  videos,
  perspectives,
  onAddToCart = () => {},
  headerSettings = {},
  homepageSettings = {}
}: PublicPagesProps) {
  const isAdminOrEditor = currentUser?.role === 'administrator' || currentUser?.role === 'editor';

  const publicVideos = (videos || []).filter(v => {
    const status = v.status || 'published';
    if (status === 'publish' || status === 'published') return true;
    if (status === 'draft' && isAdminOrEditor) return true;
    return false;
  });

  const publicPerspectives = (perspectives || []).filter(p => {
    const status = p.status || 'published';
    if (status === 'publish' || status === 'published') return true;
    if (status === 'draft' && isAdminOrEditor) return true;
    return false;
  });
  
  const formatCurrency = (val: any) => {
    if (!val) return "Liên hệ";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const renderRichContent = (text: string) => {
    if (!text) return null;

    // Check if the content is HTML (new editor output)
    const isHtml = (str: string) => {
      const trimmed = str.trim();
      return (trimmed.startsWith('<') && trimmed.endsWith('>')) || /<[a-z][\s\S]*>/i.test(trimmed);
    };

    if (isHtml(text)) {
      return (
        <div 
          className="rich-text-content" 
          dangerouslySetInnerHTML={{ __html: text }} 
        />
      );
    }

    // Split content by lines to process paragraphs, headers, list items, and images
    const lines = text.split('\n');
    const renderedElements: React.ReactNode[] = [];
    let currentListItems: string[] = [];

    const flushList = (key: number) => {
      if (currentListItems.length > 0) {
        renderedElements.push(
          <ul key={`ul-${key}`} className="list-disc pl-6 my-4 space-y-1.5 text-gray-750 leading-relaxed font-sans text-xs md:text-sm">
            {currentListItems.map((item, idx) => (
              <li key={idx} className="marker:text-blue-600">
                {parseLineInlineFormatting(item)}
              </li>
            ))}
          </ul>
        );
        currentListItems = [];
      }
    };

    const parseLineInlineFormatting = (lineStr: string) => {
      // Basic bold parsing: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      let parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(lineStr)) !== null) {
        if (match.index > lastIndex) {
          parts.push(lineStr.substring(lastIndex, match.index));
        }
        parts.push(<strong className="font-extrabold text-slate-900" key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < lineStr.length) {
        parts.push(lineStr.substring(lastIndex));
      }
      return parts.length > 0 ? parts : lineStr;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Markdown Image: ![alt](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/) || trimmed.match(/<img.*?src=["'](.*?)["'].*?>/);
      if (imgMatch) {
        flushList(index);
        const url = imgMatch[2] || (imgMatch[1]?.includes('src=') ? imgMatch[1].match(/src=["'](.*?)["']/)?.[1] : imgMatch[1]);
        const alt = imgMatch[1] || 'Hình ảnh liên kết Pentair';
        renderedElements.push(
          <div key={index} className="my-6 rounded-2xl overflow-hidden border border-gray-155 shadow-md bg-white flex flex-col items-center">
            <img 
              src={url} 
              alt={alt} 
              className="w-full max-h-[500px] object-cover filter brightness-[0.98]" 
              referrerPolicy="no-referrer"
            />
            {alt && alt !== 'hình ảnh' && alt !== 'Hình ảnh liên kết Pentair' && (
              <div className="w-full p-3.5 bg-slate-50 border-t border-gray-100 text-center text-xs font-medium text-gray-500 font-sans italic">
                ↳ {alt}
              </div>
            )}
          </div>
        );
        return;
      }

      // Markdown H2: ## Heading OR HTML <h2>Heading</h2>
      const h2Match = trimmed.match(/^##\s+(.*)$/) || trimmed.match(/^<h2>(.*?)<\/h2>$/i);
      if (h2Match) {
         flushList(index);
         renderedElements.push(
           <h2 key={index} className="text-[26px] font-black text-[#0C3471] uppercase tracking-tight mt-6 mb-3 border-b pb-2 flex items-center gap-2">
             <span className="w-1.5 h-4 bg-blue-600 rounded shrink-0"></span>
             <span>{h2Match[1]}</span>
           </h2>
         );
         return;
      }

      // Markdown H3: ### Heading OR HTML <h3>Heading</h3>
      const h3Match = trimmed.match(/^###\s+(.*)$/) || trimmed.match(/^<h3>(.*?)<\/h3>$/i);
      if (h3Match) {
         flushList(index);
         renderedElements.push(
           <h3 key={index} className="text-[24px] font-extrabold text-slate-800 tracking-tight mt-5 mb-2 flex items-center gap-1.5">
             <span className="w-1 h-3.5 bg-sky-500 rounded-sm shrink-0"></span>
             <span>{h3Match[1]}</span>
           </h3>
         );
         return;
      }

      // Bullet List Item: - Item OR * Item OR <li>Item</li>
      const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/) || trimmed.match(/^<li>(.*?)<\/li>$/i);
      if (bulletMatch) {
        currentListItems.push(bulletMatch[1]);
        return;
      }

      // Ordinary line
      if (trimmed === '') {
        flushList(index);
        renderedElements.push(<div key={index} className="h-2" />);
      } else {
        flushList(index);
        renderedElements.push(
          <p key={index} className="text-gray-650 leading-relaxed font-sans mb-3 text-xs md:text-sm font-light">
            {parseLineInlineFormatting(line)}
          </p>
        );
      }
    });

    // Flush any remaining list items at the end
    flushList(lines.length);

    return <div className="space-y-1">{renderedElements}</div>;
  };

  // Local submission state
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    productInterest: 'Pentair Maxi',
    message: ''
  });
  const [formLoading, setFormLoading] = React.useState(false);
  const [formSuccess, setFormSuccess] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  
  // Search & Filters for blog
  const [blogSearch, setBlogSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Detail product quantity selection state
  const [detailQty, setDetailQty] = React.useState(1);

  React.useEffect(() => {
    setDetailQty(1);
  }, [currentPath]);

  // Showrooms search & filter states
  const [showroomSearch, setShowroomSearch] = React.useState('');
  const [activeRegion, setActiveRegion] = React.useState<'Tất cả' | 'Miền Bắc' | 'Miền Trung - Tây Nguyên' | 'Miền Nam'>('Tất cả');
  const [selectedCity, setSelectedCity] = React.useState<string>('Tất cả');

  // Helper functions for region and city categorization
  const getShowroomRegion = (address: string) => {
    const addr = address.toLowerCase();
    if (addr.includes("hà nội") || addr.includes("hải phòng") || addr.includes("quảng ninh") || addr.includes("hạ long") || addr.includes("miền bắc")) {
      return "Miền Bắc";
    }
    if (addr.includes("đà nẵng") || addr.includes("khánh hòa") || addr.includes("nha trang") || addr.includes("gia lai") || addr.includes("quy nhơn") || addr.includes("đắk lắk") || addr.includes("buôn ma thuột") || addr.includes("miền trung") || addr.includes("tây nguyên")) {
      return "Miền Trung - Tây Nguyên";
    }
    return "Miền Nam";
  };

  const getShowroomCity = (address: string) => {
    const addr = address.toLowerCase();
    if (addr.includes("hồ chí minh") || addr.includes("hcm") || addr.includes("sài gòn")) return "TP. Hồ Chí Minh";
    if (addr.includes("hà nội") || addr.includes("hn")) return "TP. Hà Nội";
    if (addr.includes("đà nẵng")) return "TP. Đà Nẵng";
    if (addr.includes("cần thơ")) return "TP. Cần Thơ";
    if (addr.includes("hải phòng")) return "TP. Hải Phòng";
    if (addr.includes("quảng ninh") || addr.includes("hạ long")) return "Tỉnh Quảng Ninh";
    if (addr.includes("khánh hòa") || addr.includes("nha trang")) return "Tỉnh Khánh Hòa";
    if (addr.includes("gia lai") || addr.includes("quy nhơn")) return "Tỉnh Gia Lai";
    if (addr.includes("đắk lắk") || addr.includes("buôn ma thuột")) return "Tỉnh Đắk Lắk";
    if (addr.includes("đồng nai") || addr.includes("biên hòa")) return "Tỉnh Đồng Nai";
    if (addr.includes("bình dương") || addr.includes("thủ dầu một")) return "Tỉnh Bình Dương";
    if (addr.includes("vũng tàu") || addr.includes("bà rịa")) return "Tỉnh Bà Rịa - Vũng Tàu";
    return "Tỉnh/Thành khác";
  };

  // Filter showrooms based on search query, region, and city
  const filteredShowroomsList = React.useMemo(() => {
    return showrooms.filter(show => {
      const region = getShowroomRegion(show.address || '');
      const city = getShowroomCity(show.address || '');
      
      const matchSearch = 
        (show.name || '').toLowerCase().includes(showroomSearch.toLowerCase()) ||
        (show.address || '').toLowerCase().includes(showroomSearch.toLowerCase()) ||
        (show.phone || '').includes(showroomSearch);
        
      const matchRegion = activeRegion === 'Tất cả' || region === activeRegion;
      const matchCity = selectedCity === 'Tất cả' || city === selectedCity;
      
      return matchSearch && matchRegion && matchCity;
    });
  }, [showrooms, showroomSearch, activeRegion, selectedCity]);

  // Get dynamic city options based on current region filter
  const cityOptions = React.useMemo(() => {
    const cities = showrooms
      .filter(show => activeRegion === 'Tất cả' || getShowroomRegion(show.address || '') === activeRegion)
      .map(show => getShowroomCity(show.address || ''));
    return ['Tất cả', ...Array.from(new Set(cities))];
  }, [showrooms, activeRegion]);

  // Count helper for regions
  const regionCounts = React.useMemo(() => {
    const counts = {
      'Tất cả': showrooms.length,
      'Miền Bắc': 0,
      'Miền Trung - Tây Nguyên': 0,
      'Miền Nam': 0
    };
    showrooms.forEach(show => {
      const reg = getShowroomRegion(show.address || '');
      if (reg in counts) {
        counts[reg as keyof typeof counts]++;
      }
    });
    return counts;
  }, [showrooms]);

  // Luxury water softening diagnostics states
  const [showSoftenerAdvisor, setShowSoftenerAdvisor] = React.useState(false);
  const [selectedRegion, setSelectedRegion] = React.useState('hn');
  const [customHardness, setCustomHardness] = React.useState(180);

  // Luxury water softening carousel slider states and refs
  const [softenerIndex, setSoftenerIndex] = React.useState(0);
  const [isSoftenerPaused, setIsSoftenerPaused] = React.useState(false);
  const softenerResumeTimerRef = React.useRef<any>(null);

  const defaultSoftenerSlides = [
    {
      id: "slide-1",
      url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
      caption: "Vòi nước mạ chrome sáng bóng tinh tạ, không bám cặn trắng."
    },
    {
      id: "slide-2",
      url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
      caption: "Rau củ quả và thực phẩm được rửa tinh sạch bằng nước mềm lành tính."
    },
    {
      id: "slide-3",
      url: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=1200&q=80",
      caption: "Ba mẹ đang tắm cho bé, bé vui cười sảng khoái với nguồn nước mềm mại và an toàn."
    },
    {
      id: "slide-4",
      url: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1200&q=80",
      caption: "Người phụ nữ đang gội đầu sảng khoái dưới làn nước mềm mại, nuôi dưỡng suối tóc suôn mượt."
    }
  ];

  // Build softenerSlides from CMS options (softener_slides) if available, otherwise use defaults
  const cmsSlides: any[] = (homepageSettings as any)?.softener_slides || [];
  const softenerSlides = (cmsSlides.length > 0 ? cmsSlides.map((s: any, i: number) => ({
    id: `cms-slide-${i}`,
    url: s.image || '',
    caption: s.subtitle || s.title || ''
  })) : defaultSoftenerSlides).filter((s: any) => s.url);

  React.useEffect(() => {
    let intervalId: any;
    if (!isSoftenerPaused) {
      intervalId = setInterval(() => {
        setSoftenerIndex((prev) => (prev + 1) % softenerSlides.length);
      }, 4000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSoftenerPaused, softenerSlides.length]);

  const handleSoftenerClick = () => {
    setIsSoftenerPaused(true);
    if (softenerResumeTimerRef.current) {
      clearTimeout(softenerResumeTimerRef.current);
    }
    softenerResumeTimerRef.current = setTimeout(() => {
      setIsSoftenerPaused(false);
    }, 10000); // Auto resume after 10 seconds of no click
  };

  const nextSoftenerSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSoftenerIndex((prev) => (prev + 1) % softenerSlides.length);
    handleSoftenerClick();
  };

  const prevSoftenerSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSoftenerIndex((prev) => (prev - 1 + softenerSlides.length) % softenerSlides.length);
    handleSoftenerClick();
  };

  React.useEffect(() => {
    return () => {
      if (softenerResumeTimerRef.current) clearTimeout(softenerResumeTimerRef.current);
    };
  }, []);

  // Parse path to route
  // e.g. /ve-pentair, /san-pham, /san-pham/pentair-maxi, /tin-tuc, /tin-tuc/slug, /lien-he
  const isAbout = currentPath === '/ve-pentair';
  const isProducts = currentPath === '/san-pham';
  const isProductDetail = currentPath.startsWith('/san-pham/');
  const isNews = currentPath === '/tin-tuc';
  const isNewsDetail = currentPath.startsWith('/tin-tuc/');
  const isContact = currentPath === '/lien-he';
  const isPerspective = currentPath === '/phoi-canh';
  const isPerspectiveDetail = currentPath.startsWith('/phoi-canh/');
  const isHome = currentPath === '/' || (!isAbout && !isProducts && !isProductDetail && !isNews && !isNewsDetail && !isContact && !isPerspective && !isPerspectiveDetail);

  // Extract slug from path if detail
  const detailSlug = isProductDetail 
    ? currentPath.replace('/san-pham/', '') 
    : isNewsDetail 
      ? currentPath.replace('/tin-tuc/', '') 
      : '';

  // Get active product or blog detail
  const activeDetailPost = posts.find(p => p.slug === detailSlug);

  // Handle lead formulation POST
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setFormError('Vui lòng nhập đầy đủ các trường thông tin đánh dấu (*).');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sourceUrl: window.location.href,
          formName: isProductDetail 
            ? `Form tư vấn từ Trang Sản phẩm (${activeDetailPost?.title || 'Không rõ'})` 
            : isNewsDetail 
              ? `Form liên hệ từ Trang Tin tức (${activeDetailPost?.title || 'Không rõ'})` 
              : `Biểu mẫu đăng ký tư vấn từ trang Liên Hệ`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi gửi thông tin.');
      }
      setFormSuccess(true);
      setFormData({ name: '', email: '', phone: '', productInterest: 'Pentair Maxi', message: '' });
      onFormSubmitSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setFormLoading(false);
    }
  };

  // ----------------------------------------------------
  // RENDER DETAILED PAGES
  // ----------------------------------------------------

  // 1. PRODUCT DETAIL PAGE
  if (isProductDetail) {
    const product = activeDetailPost || posts.find(p => p.type === 'product');
    if (!product) {
      return (
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy sản phẩm này</h2>
          <p className="text-gray-500 mt-2">Nội dung sản phẩm chưa được tạo hoặc đang lưu nháp trong CMS.</p>
          <button onClick={() => onNavigate('/san-pham')} className="mt-6 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-pentair rounded-lg hover:bg-pentair-light transition-all cursor-pointer">
            Quay lại kho sản phẩm
          </button>
        </div>
      );
    }

    const { price = "Liên hệ", specs = [], features = [], scenes = [], cloneSource = "" } = product.meta || {};

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn" id="product-detail-view">
        <Breadcrumb 
          items={[
            { label: 'Sản phẩm', url: '/san-pham' },
            { label: product.title }
          ]} 
          onNavigate={onNavigate}
        />

        {product.status === 'draft' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center space-x-3 text-xs animate-pulse">
            <span className="flex-shrink-0 bg-amber-500 text-white rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
              Bản nháp
            </span>
            <p><strong>Lưu ý CMS:</strong> Công chúng không thể xem được sản phẩm này. Chỉ quản trị viên hoặc biên tập viên đăng nhập mới có thể truy cập.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
          {/* Left Column: Visuals */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md">
              <img 
                src={product.featuredImage} 
                alt={product.title} 
                className="w-full aspect-square object-cover hover:scale-[1.02] transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Quick specifications */}
            {((specs && specs.length > 0) || true) && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black text-pentair uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Thông Số Kỹ Thuật</h3>
                <div className="divide-y divide-gray-50">
                  {specs && specs.map((sp: { name: string; value: string }, i: number) => (
                    <div key={`dyn-${i}`} className="py-2.5 flex justify-between gap-4 text-xs font-sans">
                      <span className="text-gray-500 font-medium">{sp.name}</span>
                      <span className="text-gray-900 font-bold text-right">{sp.value}</span>
                    </div>
                  ))}
                  {[
                    { name: "Thương hiệu", value: "Pentair (Hoa Kỳ)" },
                    { name: "Tiêu chuẩn kiểm định", value: "NSF/ANSI 44 & 53, WQA Gold Seal" },
                    { name: "Chế độ bảo hành", value: "5 năm chính hãng (Bảo hành kép)" },
                    { name: "Hỗ trợ lắp đặt", value: "Khảo sát nguồn nước & lắp ráp trọn gói" },
                    { name: "Dịch vụ sau bán hàng", value: "Bảo trì định kỳ, linh kiện chính hãng" }
                  ].filter(addSpec => 
                    !specs?.some((sp: { name: string }) => sp.name.toLowerCase() === addSpec.name.toLowerCase())
                  ).map((sp, i) => (
                    <div key={`add-${i}`} className="py-2.5 flex justify-between gap-4 text-xs font-sans">
                      <span className="text-gray-500 font-medium">{sp.name}</span>
                      <span className="text-gray-900 font-bold text-right">{sp.value}</span>
                    </div>
                  ))}
                </div>
                {cloneSource && (
                  <p className="text-[10px] text-gray-400 mt-4 italic">
                    * {cloneSource}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Key Details & Booking form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/40 backdrop-blur p-6 rounded-2xl border border-blue-50">
              <span className="text-[11px] font-bold text-pentair uppercase bg-blue-100/60 px-2.5 py-1 rounded inline-block mb-3 tracking-widest">
                Pentair USA Certified
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-pentair leading-snug">{product.title}</h2>
              <div className="mt-4 flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                {product.meta?.hide_price === true || product.meta?.hide_price === 'true' ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500 font-medium font-sans">Giá bán lẻ:</span>
                    <span className="text-sm font-bold text-orange-600 font-sans uppercase">Liên hệ để nhận báo giá</span>
                  </div>
                ) : (
                  <>
                    {product.meta?.sale_price && product.meta?.sale_price !== "" && Number(product.meta?.sale_price) < Number(product.meta?.regular_price) ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-gray-500 font-medium font-sans">Giá khuyến mãi:</span>
                          <span className="text-2xl font-black text-rose-600 font-mono">
                            {formatCurrency(product.meta?.sale_price)}
                          </span>
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded font-sans">
                            Tiết kiệm {formatCurrency(Number(product.meta?.regular_price) - Number(product.meta?.sale_price))}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-gray-400 font-medium font-sans">Giá niêm yết:</span>
                          <span className="text-sm font-semibold text-gray-400 line-through font-mono">
                            {formatCurrency(product.meta?.regular_price)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-gray-500 font-medium font-sans">Giá hãng niêm yết:</span>
                        <span className="text-2xl font-black text-rose-600 font-mono">
                          {product.meta?.regular_price ? formatCurrency(product.meta?.regular_price) : "Liên hệ"}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>


              {/* Premium Cart/Buy actions */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-xl bg-slate-50 overflow-hidden h-11 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                    className="px-3 h-full hover:bg-gray-150 transition-colors text-gray-500 font-bold hover:text-gray-800 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-mono font-bold text-gray-800">{detailQty}</span>
                  <button 
                    type="button"
                    onClick={() => setDetailQty(detailQty + 1)}
                    className="px-3 h-full hover:bg-gray-150 transition-colors text-gray-500 font-bold hover:text-gray-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-grow w-full grid grid-cols-2 gap-3.5">
                  <button 
                    type="button"
                    onClick={() => onAddToCart(product, detailQty, false)}
                    className="h-11 bg-blue-50 hover:bg-blue-100 text-pentair border border-blue-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-pentair" />
                    Thêm giỏ hàng
                  </button>
                  <button 
                    type="button"
                    onClick={() => onAddToCart(product, detailQty, true)}
                    className="h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus:ring-2 focus:ring-rose-250"
                  >
                    <CreditCard className="w-4 h-4" />
                    Mua Ngay
                  </button>
                </div>
              </div>
            </div>

            {/* Custom product attributes */}
            {product.meta?.attributes && product.meta.attributes.length > 0 && (
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-gray-100/80 shadow-xs">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Thuộc tính nổi bật</h3>
                <div className="grid grid-cols-2 gap-3.5">
                  {product.meta.attributes.map((attr: { name: string; value: string }, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">{attr.name}</span>
                      <span className="text-xs text-gray-800 font-extrabold mt-1 block leading-snug">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Consulting Registration */}
            <div className="bg-gradient-to-br from-pentair to-pentair-dark text-white p-6 rounded-2xl shadow-xl shadow-blue-900/10">
              <h4 className="text-base font-bold uppercase">ĐĂNG KÝ TƯ VẤN SẢN PHẨM</h4>
              <p className="text-xs text-blue-200 mt-1 leading-relaxed">Để lại thông tin liên hệ để nhận tư vấn chi tiết về cấu hình hệ thống lọc nước và giải pháp tối ưu từ chuyên gia Pentair.</p>
              
              <form onSubmit={handleSubmitLead} className="mt-4 space-y-3">
                <input 
                  type="text" 
                  placeholder="Họ và tên của bạn *" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="tel" 
                    placeholder="Số điện thoại *" 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg text-gray-800 bg-white placeholder-gray-400 focus:outline-none"
                  />
                  <input 
                    type="email" 
                    placeholder="Địa chỉ Email *" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg text-gray-800 bg-white placeholder-gray-400 focus:outline-none"
                  />
                </div>
                
                <input type="hidden" value={product.title} />

                {formSuccess && (
                  <div className="p-2.5 bg-emerald-600/80 rounded text-xs flex gap-1.5 items-center">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                    <span>Gửi tư vấn thành công! Chúng tôi liên hệ ngay.</span>
                  </div>
                )}
                {formError && (
                  <div className="p-2.5 bg-red-600/80 rounded text-xs text-white">
                    {formError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="w-full py-2.5 bg-white text-pentair font-bold text-xs uppercase rounded-lg hover:bg-blue-50 tracking-wider shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  id="btn-product-lead-submit"
                >
                  {formLoading ? 'Đang gửi...' : 'Đăng Ký Tư Vấn Ngay'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Full-width product description section */}
        {(product.content || product.excerpt) && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
            <h3 className="text-base md:text-lg font-black text-pentair uppercase tracking-wide mb-5 pb-3 border-b border-gray-100">
              Mô tả sản phẩm
            </h3>
            <div className="prose prose-blue max-w-none prose-sm md:prose-base text-gray-700 leading-relaxed">
              {renderRichContent(product.content || product.excerpt)}
            </div>
          </div>
        )}

        {/* Feature Highlights section */}
        {features && features.length > 0 && (
          <div className="mt-16 bg-blue-50/40 p-8 rounded-3xl border border-blue-50">
            <h3 className="text-lg font-bold text-pentair uppercase tracking-wide mb-6">Đặc điểm nổi bật vượt bậc</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feat: string, idx: number) => (
                <div key={idx} className="flex gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100/80 text-pentair flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 uppercase">Ưu điểm #{idx+1}</h5>
                    <p className="text-xs text-gray-600 leading-relaxed mt-1.5">{feat}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. NEWS/BLOG DETAIL PAGE
  if (isNewsDetail) {
    const post = activeDetailPost;
    if (!post) {
      return (
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy bài viết này</h2>
          <button onClick={() => onNavigate('/tin-tuc')} className="mt-6 px-6 py-2 bg-pentair text-white rounded">Quay lại tin tức</button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn" id="news-detail-view">
        <Breadcrumb 
          items={[
            { label: 'Tin tức', url: '/tin-tuc' },
            { label: post.title }
          ]} 
          onNavigate={onNavigate}
        />

        <article className="mt-6 space-y-6">
          <span className="text-[11px] font-bold text-pentair px-2 py-0.5 bg-blue-50 border border-blue-100 rounded inline-block">
            {post.terms?.[0]?.name || 'Tin tức nguồn nước'}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-pentair leading-tight">{post.title}</h1>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 border-y py-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Tác giả: Pentair Official Editor
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-100 max-h-[400px] bg-gray-50">
            <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-blue max-w-none prose-sm text-gray-750 p-6 bg-slate-50/10 rounded-2xl border border-gray-100">
            {renderRichContent(post.content)}
          </div>
        </article>

        {/* Suggest other reads */}
        <div className="mt-12 border-t pt-8">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Có thể bạn quan tâm</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.filter(p => p.type === 'post' && p.id !== post.id).slice(0, 2).map((other, idx) => (
              <div 
                key={idx}
                onClick={() => onNavigate(`/tin-tuc/${other.slug}`)}
                className="bg-white p-4 rounded-xl border border-gray-100 hover:border-pentair transition-all cursor-pointer flex gap-3 h-full items-center shadow-sm"
              >
                <img src={other.featuredImage} className="w-16 h-16 object-cover rounded-lg bg-gray-100 shrink-0" referrerPolicy="no-referrer" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-pentair">{other.title}</h5>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{other.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. ABOUT US PAGE
  if (isAbout) {
    const aboutPage = posts.find(p => p.slug === 've-pentair');
    const { history = '', vision = '', awards = [], certificates = [] } = aboutPage?.meta || {};

    // Timeline milestones - lịch sử hình thành Pentair chính xác theo thực tế
    const milestones = [
      {
        year: "1966",
        label: "KHỞI ĐẦU TỪ TẦM NHÌN CỦA 5 NHÀ SÁNG LẬP",
        desc: "Pentair được thành lập tại Minnesota, Hoa Kỳ, với định hướng ban đầu là sản xuất bóng bay nghiên cứu tầng cao. Tên thương hiệu thể hiện rõ nguồn gốc: \"penta\" là năm nhà sáng lập, \"air\" là lĩnh vực sản phẩm đầu tiên.",
        icon: "🏛",
        isCurrent: false
      },
      {
        year: "1968 – 1970s",
        label: "VƯỢT QUA THỬ THÁCH, MỞ RỘNG SANG NGÀNH GIẤY",
        desc: "Sau những khó khăn ban đầu, Pentair chuyển hướng bằng việc mua lại các nhà máy giấy như Peavey Paper Mills, đặt nền móng cho giai đoạn tăng trưởng ổn định trong nhiều thập kỷ.",
        icon: "📄",
        isCurrent: false
      },
      {
        year: "1980s",
        label: "ĐA DẠNG HÓA SẢN XUẤT CÔNG NGHIỆP",
        desc: "Pentair mở rộng sang công cụ điện, thiết bị công nghiệp và các lĩnh vực sản xuất kỹ thuật, từng bước xây dựng năng lực quản trị và sản xuất quy mô lớn.",
        icon: "⚙️",
        isCurrent: false
      },
      {
        year: "1995",
        label: "BƯỚC NGOẶT VÀO CÔNG NGHỆ NƯỚC",
        desc: "Pentair mua lại Fleck Controls, thương hiệu van điều khiển nổi tiếng cho hệ thống xử lý nước, đánh dấu bước tiến quan trọng vào lĩnh vực công nghệ nước.",
        icon: "💧",
        isCurrent: false
      },
      {
        year: "1999 – 2004",
        label: "TĂNG TỐC TRỞ THÀNH TẬP ĐOÀN NƯỚC TOÀN CẦU",
        desc: "Pentair tiếp tục mở rộng danh mục nước và hồ bơi, mua lại Essef năm 1999, Everpure năm 2004 và WICOR Industries năm 2004, đồng thời rút khỏi mảng công cụ điện để tập trung hơn vào giải pháp nước.",
        icon: "🌐",
        isCurrent: false
      },
      {
        year: "2012 – 2018",
        label: "TÁI CẤU TRÚC VÀ TẬP TRUNG VÀO NƯỚC",
        desc: "Pentair hợp nhất với mảng Flow Control của Tyco năm 2012. Đến năm 2018, công ty tách mảng điện thành nVent, giúp Pentair tập trung rõ hơn vào các giải pháp nước cho dân dụng, thương mại, công nghiệp và hạ tầng.",
        icon: "🔄",
        isCurrent: false
      },
      {
        year: "Hiện Nay",
        label: "THƯƠNG HIỆU CÔNG NGHỆ NƯỚC TOÀN CẦU",
        desc: "Pentair là tập đoàn công nghệ nước toàn cầu, giao dịch trên sàn NYSE với mã PNR, phục vụ khách hàng tại hơn 150 quốc gia, cung cấp giải pháp cho lọc nước, xử lý nước, hồ bơi, lưu chất và các ứng dụng bền vững.",
        icon: "🏆",
        isCurrent: true
      }
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn" id="about-view">
        <Breadcrumb items={[{ label: 'Giới thiệu về chúng tôi' }]} onNavigate={onNavigate} />

        {/* Banner header visual */}
        <div className="relative rounded-3xl overflow-hidden min-h-[250px] md:min-h-[350px] bg-pentair flex items-center px-8 md:px-16 text-white mb-12 shadow-xl shadow-blue-950/15">
          <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${aboutPage?.featuredImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-pentair via-pentair-dark/80 to-transparent z-10" />
          
          <div className="relative z-20 max-w-xl space-y-3">
            <span className="text-[10px] font-bold tracking-widest bg-blue-500 text-white px-2.5 py-1 rounded inline-block uppercase animate-pulse">
              Pentair USA - Heritage of trust
            </span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Giới Thiệu Pentair</h1>
            <p className="text-sm md:text-base text-blue-100 leading-relaxed font-sans font-light">
              {aboutPage?.excerpt || "Kiến tạo di sản bảo vệ sức khoẻ gia đình qua nhiều thế hệ bằng chất lượng nước tinh khiết tuyệt đối chuẩn Mỹ."}
            </p>
          </div>
        </div>

        {/* SECTION 1: TIMELINE LỊCH SỬ HÌNH THÀNH PENTAIR */}
        <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/40 rounded-3xl border border-blue-100/60 shadow-sm overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-60 h-60 rounded-full bg-blue-300/8 blur-[60px] pointer-events-none" />

          <div className="relative z-10 p-6 md:p-10 lg:p-14">
            {/* Section header */}
            <div className="max-w-3xl mb-10 md:mb-14">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase font-extrabold tracking-[0.18em] text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
                Hành Trình Phát Triển
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                LỊCH SỬ HÌNH THÀNH THƯƠNG HIỆU PENTAIR
              </h2>
              <div className="flex items-center gap-3 mt-3 mb-5">
                <div className="h-[3px] w-12 bg-blue-600 rounded-full" />
                <div className="h-[3px] w-4 bg-blue-300 rounded-full" />
                <div className="h-[3px] w-2 bg-blue-100 rounded-full" />
              </div>
              <p className="text-sm md:text-[15px] text-gray-600 leading-relaxed font-sans max-w-2xl">
                Ra đời năm 1966 tại vùng St. Paul, Minnesota, Hoa Kỳ, Pentair được sáng lập bởi 5 nhà sáng lập với ý tưởng ban đầu là sản xuất bóng bay nghiên cứu tầng cao. Tên gọi Pentair kết hợp "penta" – tượng trưng cho 5 nhà sáng lập – và "air" – gắn với sản phẩm đầu tiên của công ty. Từ một doanh nghiệp nhỏ, Pentair từng bước đa dạng hóa, phát triển qua nhiều lĩnh vực trước khi trở thành tập đoàn công nghệ nước toàn cầu, hiện phục vụ khách hàng tại hơn 150 quốc gia.
              </p>
            </div>

            {/* Timeline vertical layout */}
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[22px] md:left-[26px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-200 via-blue-300 to-emerald-300 rounded-full" />

              <div className="space-y-8 md:space-y-10">
                {milestones.map((m, idx) => (
                  <div key={idx} className="relative flex gap-5 md:gap-8 group">
                    {/* Icon circle */}
                    <div className={`relative z-10 flex-shrink-0 w-11 h-11 md:w-13 md:h-13 rounded-full flex items-center justify-center text-lg shadow-md border-[3px] transition-all duration-300 group-hover:scale-110 ${
                      m.isCurrent
                        ? 'bg-emerald-600 border-emerald-200 shadow-emerald-200/60'
                        : 'bg-white border-blue-200 shadow-blue-100/80 group-hover:border-blue-400 group-hover:shadow-blue-200'
                    }`}
                      style={{ width: '48px', height: '48px', minWidth: '48px' }}
                    >
                      <span className="text-xl leading-none select-none">{m.icon}</span>
                    </div>

                    {/* Content card */}
                    <div className={`flex-grow pb-2 transition-all duration-300 ${
                      m.isCurrent ? 'bg-emerald-50/60 border-emerald-200/60' : 'bg-white/70 border-gray-100 group-hover:border-blue-100 group-hover:bg-blue-50/30'
                    } rounded-2xl border px-5 py-4 md:px-6 md:py-5 shadow-xs backdrop-blur-sm`}>
                      {/* Year badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-block text-xs font-mono font-black tracking-wider px-3 py-1 rounded-full ${
                          m.isCurrent
                            ? 'text-white bg-emerald-600 shadow-sm'
                            : 'text-blue-700 bg-blue-100/80 border border-blue-200'
                        }`}>
                          {m.year}
                        </span>
                        {m.isCurrent && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            Hiện Tại
                          </span>
                        )}
                      </div>
                      {/* Milestone title */}
                      <h3 className={`text-sm md:text-base font-bold uppercase tracking-tight leading-snug mb-2 transition-colors ${
                        m.isCurrent ? 'text-emerald-800' : 'text-slate-800 group-hover:text-blue-700'
                      }`}>
                        {m.label}
                      </h3>
                      {/* Description */}
                      <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-sans">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: TẦM NHÌN & SỨ MỆNH RIÊNG BIỆT */}
        <section className="my-16 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#004b87] bg-blue-50 px-3 py-1 rounded-full">
              Khát Vọng Phát Triển
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
              Tầm Nhìn & Sứ Mệnh
            </h2>
            <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
            {/* Tầm nhìn */}
            <div className="bg-gradient-to-b from-slate-900 to-blue-950 text-white p-8 md:p-10 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Shield className="w-36 h-36" />
              </div>

              <div className="space-y-6">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-block">
                  Tầm Nhìn Công Nghệ / Vision
                </span>
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                    Trở thành thương hiệu hàng đầu thế giới về các giải pháp xử lý nước
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
                    {vision.split('\n')[0] || "Trở thành thương hiệu hàng đầu thế giới về các giải pháp xử lý nước, mang đến cuộc sống tốt đẹp hơn cho khách hàng thông qua công nghệ nước thông minh và đáng tin cậy."}
                  </p>
                </div>
              </div>


            </div>

            {/* Sứ mệnh */}
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Award className="w-36 h-36" />
              </div>

              <div className="space-y-6">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                  Sứ Mệnh Bảo Vệ / Mission
                </span>
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    Giúp mọi người có nguồn nước sạch, an toàn và chất lượng hơn
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-sans">
                    {vision.split('\n')[1] || "Giúp mọi người có nguồn nước sạch, an toàn và chất lượng hơn để phục vụ cuộc sống hằng ngày, đồng thời sử dụng tài nguyên nước một cách bền vững cho thế hệ tương lai."}
                  </p>
                </div>
              </div>


            </div>
          </div>
        </section>

        {/* SECTION LUXURY WATER SOFTENING - PENTAIR HIGH-END SOFTENING PLATFORM */}
        <section className="my-20 bg-[#070b14] text-white rounded-[32px] overflow-hidden border border-slate-800/80 shadow-2xl relative">
          {/* Subtle floating glow dots representing premium water purity */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
            {/* LEFT SIDE: CINEMATIC VISUAL CAROUSEL */}
            <div 
              className="lg:col-span-6 relative overflow-hidden min-h-[440px] lg:min-h-full flex flex-col justify-end group select-none cursor-pointer"
              onClick={handleSoftenerClick}
            >
              {/* Carousel Track */}
              <div 
                className="absolute inset-0 flex transition-transform duration-[800ms] ease-out-expo"
                style={{ 
                  width: `${softenerSlides.length * 100}%`,
                  transform: `translateX(-${softenerIndex * (100 / softenerSlides.length)}%)` 
                }}
              >
                {softenerSlides.map((slide) => (
                  <div 
                    key={slide.id} 
                    className="h-full relative bg-cover bg-center flex-shrink-0"
                    style={{ 
                      width: `${100 / softenerSlides.length}%`,
                      backgroundImage: `url(${slide.url})` 
                    }}
                  />
                ))}
              </div>

              {/* Overlays (placed on top of the moving track for uniform cinematic feel) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/20 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/20 via-transparent to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-blue-950/10 mix-blend-overlay z-10 pointer-events-none" />

              {/* Unique reflection light element */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse z-15 pointer-events-none" />

              {/* Top Banner Paused indicator */}
              <div className={`absolute top-4 right-4 z-30 px-3.5 py-1.5 backdrop-blur-md bg-black/60 border border-white/10 rounded-full text-[9px] font-mono tracking-widest text-[#bf9b30] uppercase transition-all duration-300 ${isSoftenerPaused ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#bf9b30] mr-1.5 animate-pulse" />
                Tạm dừng • Tự phát sau 10s
              </div>



              {/* Arrow navigation buttons - visible ONLY when paused */}
              <div className={`absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 flex justify-between pointer-events-none transition-all duration-500 ${isSoftenerPaused ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <button
                  type="button"
                  onClick={prevSoftenerSlide}
                  className="w-10 h-10 rounded-full bg-slate-950/80 hover:bg-blue-600 border border-white/20 flex items-center justify-center transition-all shadow-2xl cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 text-white"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  onClick={nextSoftenerSlide}
                  className="w-10 h-10 rounded-full bg-slate-950/80 hover:bg-blue-600 border border-white/20 flex items-center justify-center transition-all shadow-2xl cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 text-white"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

              {/* RIGHT SIDE: PREMIUM ENGINEERING CONTENT */}
              <div className="lg:col-span-6 p-8 md:p-12 lg:p-14 flex flex-col justify-center space-y-6 bg-gradient-to-br from-[#070b14] to-[#0c1322] relative z-20 border-l lg:border-l-0 border-slate-800/60">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-cyan-400 uppercase inline-block">
                    WATER SOFTENING SOLUTION
                  </span>
                  
                  <h2 className="text-2xl md:text-3xl lg:text-[32px] font-black text-white uppercase tracking-tight leading-tight font-sans">
                    Pentair – Giải pháp làm mềm nước cứng cao cấp được tin dùng tại châu Âu
                  </h2>
                  
                  <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-sans font-light">
                    Pentair sử dụng vật liệu làm mềm cao cấp mang đến giải pháp xử lý nước cứng toàn diện giúp giảm đóng cặn và nâng cao trải nghiệm sử dụng nước mỗi ngày — từ phòng tắm, nhà bếp đến toàn bộ hệ thống thiết bị trong gia đình.
                  </p>
                </div>

                {/* Direct High-end Luxury bullet list */}
                <div className="space-y-3.5 pt-4 border-t border-slate-800/60">
                  <span className="text-[10px] font-mono tracking-widest text-[#bf9b30] uppercase font-bold block mb-1">
                    Trải nghiệm dòng nước mềm tối ưu:
                  </span>
                  <ul className="space-y-3">
                    {[
                      "Giảm thiểu đóng cặn trên thiết bị vệ sinh cao cấp",
                      "Hạn chế vết ố, cặn trắng bết dính trên vách kính phòng tắm",
                      "Bảo vệ hoàn hảo hệ thống máy nước nóng và đường ống dẫn nguồn",
                      "Mang lại cảm giác làn da và mái tóc mềm mại, tự nhiên mịn màng",
                      "Nâng tầm trải nghiệm chất lượng sinh hoạt vương giả mỗi ngày"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs md:text-sm text-slate-200">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ACTION CALLS */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button 
                    onClick={() => onNavigate('/lien-he')}
                    className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 bg-white hover:bg-slate-150 rounded-xl transition-all font-sans cursor-pointer shadow-lg hover:translate-y-[-1px]"
                  >
                    Tư vấn hệ thống Pentair
                  </button>
                  <button 
                    onClick={() => setShowSoftenerAdvisor(true)}
                    className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-white bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-xl transition-all font-sans cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Kiểm tra độ cứng nguồn nước
                  </button>
                </div>
              </div>
          </div>
        </section>

        {/* WATER HARDNESS DIAGNOSTICS MODAL */}
        {showSoftenerAdvisor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" id="softener-advisor-modal">
            <div className="relative w-full max-w-2xl bg-[#090f1d] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-slate-800 bg-gradient-to-r from-[#090f1d] to-[#121c32] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#bf9b30] uppercase font-bold">
                    PENTAIR ASSISTANT
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wide">
                    HỆ THỐNG KIỂM TRA ĐỘ CỨNG NƯỚC VIỆT NAM
                  </h3>
                </div>
                <button 
                  onClick={() => setShowSoftenerAdvisor(false)} 
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-all cursor-pointer"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-300 scrollbar-thin">
                <p className="text-xs text-slate-400 font-sans leading-relaxed animate-pulse">
                  Độ cứng của nước (hàm lượng Canxi & Magie hòa tan) quyết định độ bền của thiết bị và sự bảo vệ sức khỏe gia đình bạn. Hãy lựa chọn tỉnh thành hoặc di chuyển thanh trượt để chuẩn đoán chính xác nguồn nước nhà bạn:
                </p>

                {/* Regional Quick Presets */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono block">
                    Chọn nhanh khu vực địa hình đặc trưng:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'hn', label: 'Hà Nội Nội Thành', hardness: 180 },
                      { id: 'vnuibac', label: 'Núi Cao / Đá Vôi', hardness: 360 },
                      { id: 'mientrung', label: 'Miền Trung Cát Trắng', hardness: 260 },
                      { id: 'hcm', label: 'Sài Gòn / Miền Nam', hardness: 50 }
                    ].map((reg) => (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => {
                          setSelectedRegion(reg.id);
                          setCustomHardness(reg.hardness);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedRegion === reg.id
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                            : 'bg-[#0d162a]/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold leading-none">{reg.label}</div>
                        <div className="text-[9px] text-slate-405 mt-1 font-mono">{reg.hardness} ppm</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hardness interactive Range Slider */}
                <div className="p-5 bg-[#0c1527] rounded-2xl border border-slate-800/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">
                      HÀM LƯỢNG CANXI & MAGIE (CaCO3)
                    </span>
                    <span className="text-xl font-mono text-cyan-400 font-black">
                      {customHardness} <span className="text-xs ml-0.5 text-slate-400">ppm (mg/L)</span>
                    </span>
                  </div>

                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    value={customHardness}
                    onChange={(e) => {
                      setCustomHardness(parseInt(e.target.value));
                      setSelectedRegion('custom');
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />

                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>10 ppm (Rất mềm)</span>
                    <span>150 ppm</span>
                    <span>300 ppm</span>
                    <span>500 ppm (Cực nặng)</span>
                  </div>
                </div>

                {/* DIAGNOSTIC RESULTS CO-PANEL CARD */}
                {(() => {
                  let alertColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                  let levelKeyword = 'An Toàn / Nước Mềm';
                  let levelQuote = 'Nguồn nước hoàn toàn yên tâm cho sinh hoạt, hạn chế tối đa đóng cặn';
                  let scoreStars = '★ ★ ★ ★ ★';
                  let damageReport: string[] = [];
                  let productRecomName = 'Hệ Thống Lọc Pentair Everpure Premium';
                  let productRecomDesc = 'Phù hợp xử lý tinh lọc, tăng vị ngon và giữ trọn vi chất cao cấp.';

                  if (customHardness >= 60 && customHardness < 120) {
                    alertColor = 'text-amber-300 bg-amber-500/10 border-amber-500/20';
                    levelKeyword = 'Nhẹ Độ Cứng';
                    levelQuote = 'Khởi đầu tích lũy chất đóng váng bám dính siêu mảnh trên kính cường lực và vòi hợp kim.';
                    scoreStars = '★ ★ ★ ★ ☆';
                    damageReport = [
                      'Xuất hiện vài vệt ố mờ nhỏ ở vòi hoa sen sau 2-3 tháng sử dụng.',
                      'Làm giảm khoảng 5% hiệu suất giữ nhiệt của bình đun nước.'
                    ];
                  } else if (customHardness >= 120 && customHardness < 185) {
                    alertColor = 'text-amber-500 bg-[#bf9b30]/15 border-[#bf9b30]/30';
                    levelKeyword = 'Nước Cứng Vừa';
                    levelQuote = 'Gây tắc lỗ phun vòi tắm, xơ khô tóc tự nhiên và giảm tác dụng bọt của sữa tắm cao cấp.';
                    scoreStars = '★ ★ ★ ☆ ☆';
                    damageReport = [
                      'Giảm bọt xà phòng đáng kể, làm hao tốn hóa chất tẩy rửa cao cấp.',
                      'Tóc chịu tích mỡ vôi gây thô, giòn vỡ sau tắm.',
                      'Đóng tảng mỡ bám canxi bạc tại các góc khay chén đĩa.'
                    ];
                    productRecomName = 'Pentair Cabinet Softener SMART-AVANCON';
                    productRecomDesc = 'Giải pháp tuyệt diệu làm mềm nước hiệu năng cao, điều tiết dải muối hoàn nguyên tự động tối tân.';
                  } else if (customHardness >= 185) {
                    alertColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                    levelKeyword = 'CỰC KỲ CỨNG - NGUY CƠ RẤT CAO';
                    levelQuote = 'Nước phá hỏng nhanh thiết bị đun nhiệt, đốm trắng bết rỗ vách kính châu Âu, khiến bề mặt thô cứng cực kỳ phản mỹ quan.';
                    scoreStars = '★ ☆ ☆ ☆ ☆';
                    damageReport = [
                      'Hỏng hóc hoen rỉ ruột đốt máy nước nóng, tắc bình năng lượng mặt trời.',
                      'Kính phòng tắm bám vệt tủa cặn canxi đá vôi đục mờ hoàn toàn khó tẩy sạch.',
                      'Gây khô rát làn da kích ứng cao, tóc rụng xơ mệt mỏi.',
                      'Bám cặn trắng tắc nghẽn thành trong của toàn hệ ống nước đắt đỏ.'
                    ];
                    productRecomName = 'HỆ THỐNG LỌC TỔNG LÀM MỀM CAO CẤP PENTAIR TWIN CAB-SOFTENER';
                    productRecomDesc = 'Hệ song song vận hành đúp luân phiên 24/7, loại trừ 100% canxi kết vón, mang tới tuyệt phẩm nước mềm mịn tuyệt đỉnh.';
                  }

                  return (
                    <div className="space-y-4">
                      {/* Diagnostic Summary Badge */}
                      <div className={`p-4 rounded-2xl border ${alertColor} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono tracking-widest opacity-75">Tình Trạng Nguồn Nước:</span>
                          <div className="text-sm md:text-base font-black uppercase tracking-tight">{levelKeyword}</div>
                        </div>
                        <div className="sm:text-right font-mono text-xs">
                          Chỉ số an toàn: <span className="font-bold text-[#bf9b30]">{scoreStars}</span>
                        </div>
                      </div>

                      {/* Diagnostic details panel */}
                      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-850 space-y-3">
                        <div className="text-xs font-bold text-slate-200">Đánh giá hệ lụy:</div>
                        <p className="text-xs italic text-slate-400">"{levelQuote}"</p>
                        
                        {damageReport.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Các vết phá hủy nhận biết:</span>
                            <ul className="space-y-1">
                              {damageReport.map((dmg, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-xs text-rose-450">
                                  <span className="text-rose-500">•</span>
                                  {dmg}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Advisor recommendation product */}
                      <div className="p-5 bg-gradient-to-r from-blue-950/30 to-[#0e172a] rounded-2xl border border-blue-900/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-blue-400 uppercase font-black">
                          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Khuyên dùng bởi kỹ sư Pentair Hoa Kỳ
                        </div>
                        <h4 className="text-sm font-extrabold text-white uppercase tracking-tight">{productRecomName}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{productRecomDesc}</p>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Footer */}
              <div className="p-6 bg-[#0c1324] border-t border-slate-805 flex flex-wrap items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-mono">
                  *Kiểm tra mang tính chất chuẩn đoán ước lượng thông số vùng miền.
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowSoftenerAdvisor(false)} 
                    className="px-4 py-2 text-xs font-semibold hover:text-white text-slate-400 hover:bg-slate-850 rounded-xl transition-all cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  <button 
                    onClick={() => {
                      setShowSoftenerAdvisor(false);
                      onNavigate('/lien-he');
                    }} 
                    className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    Đăng ký kiểm tra miễn phí tận nhà
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION LUXURY LIVING WORKSPACE - CUSTOM SOLUTIONS PER HOME TYPE */}
        <section className="my-24 py-20 px-8 md:px-12 bg-gradient-to-b from-[#0C3471]/90 to-[#05193B] text-white rounded-[32px] border border-slate-800/80 shadow-2xl relative overflow-hidden">
          {/* Futuristic subtle moving background patterns */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-cyan-400/10 blur-[120px] pointer-events-none" />

          {/* Section Header */}
          <div className="max-w-4xl mx-auto text-center space-y-4 mb-20 relative z-10">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#E6C073] uppercase font-bold bg-white/5 border border-white/10 px-4 py-1.5 rounded-full inline-block">
              Tailored Pure Water Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-black text-white leading-tight uppercase tracking-tight">
              Pentair – Giải pháp lọc tổng phù hợp cho mọi không gian sống
            </h2>
            <div className="h-1 w-20 bg-[#E6C073] mx-auto rounded-full" />
            <p className="text-xs md:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-light">
              Từ căn hộ cao cấp, nhà phố hiện đại đến biệt thự sang trọng, Pentair mang đến các giải pháp lọc tổng và làm mềm nước được thiết kế phù hợp với từng nhu cầu sử dụng thực tế.
            </p>
          </div>

          {/* 3 Grid Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* CARD 1 - CĂN HỘ CHUNG CƯ */}
            <div className="group bg-gradient-to-b from-[#11244E] to-[#0A1633] rounded-2xl overflow-hidden border border-slate-800 hover:border-[#E6C073]/40 transition-all duration-500 flex flex-col justify-between shadow-2xl hover:shadow-[#E6C073]/5">
              {/* Product Visual Area */}
              <div className="relative h-64 overflow-hidden bg-slate-905">
                <img 
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80" 
                  alt="Căn hộ hiện đại & Phòng tắm kính sang trọng"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                {/* Light overlay glow reflection */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1633] via-transparent to-transparent" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent transition-opacity duration-500" />
                
                {/* Embedded Metallic Badge effect */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-md text-[9px] font-mono tracking-widest text-[#E6C073] uppercase font-bold">
                  Compact Design poe
                </div>
              </div>

              {/* Card Content Area */}
              <div className="p-6 md:p-8 space-y-6 flex-grow flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold font-sans text-white group-hover:text-[#E6C073] transition-colors uppercase tracking-tight">Căn hộ chung cư</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    Giải pháp lọc tổng nhỏ gọn giúp xử lý cặn bẩn, Clo dư và hỗ trợ làm mềm nước cho không gian căn hộ hiện đại.
                  </p>
                </div>

                {/* Tech specifications box */}
                <div className="bg-[#0D1627]/60 p-4 rounded-xl border border-slate-800/40 space-y-3">
                  <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold block">
                    Sản phẩm kiến nghị & Phân tích:
                  </span>
                  
                  {/* Products tags */}
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800/60">
                    <span onClick={() => onNavigate('/san-pham')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors">
                      Pentair Softena Smart CS Midi
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans font-light list-disc list-inside">
                    <li>Thiết kế nhỏ gọn, phù hợp không gian căn hộ chung cư hiện đại</li>
                    <li>Xử lý nước cứng, cặn bẩn và Clo dư hiệu quả</li>
                    <li>Tiết kiệm diện tích lắp đặt, vận hành ổn định</li>
                    <li>Phù hợp gia đình 2–3 phòng tắm</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CARD 2 - NHÀ PHỐ */}
            <div className="group bg-gradient-to-b from-[#11244E] to-[#0A1633] rounded-2xl overflow-hidden border border-slate-800 hover:border-[#E6C073]/40 transition-all duration-500 flex flex-col justify-between shadow-2xl hover:shadow-[#E6C073]/5">
              {/* Product Visual Area */}
              <div className="relative h-64 overflow-hidden bg-slate-905">
                <img 
                  src="https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&w=600&q=80" 
                  alt="Nhà phố hiện đại & Hệ thống kỹ thuật gọn gàng"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                {/* Light overlay glow reflection */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1633] via-transparent to-transparent" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-gradient-to-tr from-blue-500/20 via-transparent to-transparent transition-opacity duration-500" />
                
                {/* Embedded Metallic Badge effect */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-md text-[9px] font-mono tracking-widest text-[#E6C073] uppercase font-bold">
                  Universal High-flow
                </div>
              </div>

              {/* Card Content Area */}
              <div className="p-6 md:p-8 space-y-6 flex-grow flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold font-sans text-white group-hover:text-[#E6C073] transition-colors uppercase tracking-tight">Nhà phố hiện đại</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    Giải pháp lọc tổng toàn diện giúp bảo vệ thiết bị, hạn chế đóng cặn và nâng cao trải nghiệm sử dụng nước cho cả gia đình.
                  </p>
                </div>

                {/* Tech specifications box */}
                <div className="bg-[#0D1627]/60 p-4 rounded-xl border border-slate-800/40 space-y-3">
                  <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold block">
                    Sản phẩm kiến nghị & Phân tích:
                  </span>
                  
                  {/* Products tags */}
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800/60">
                    <span onClick={() => onNavigate('/san-pham')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors">
                      Pentair Softena Smart CS Maxi
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans font-light list-disc list-inside">
                    <li>Phù hợp nhà phố với nhu cầu sử dụng nước lớn hơn</li>
                    <li>Công suất cao, đáp ứng 3–5 phòng tắm hoạt động đồng thời</li>
                    <li>Xử lý hiệu quả nước cứng, bảo vệ thiết bị gia đình</li>
                    <li>Thiết kế toàn diện, nâng cao trải nghiệm dùng nước mỗi ngày</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CARD 3 - BIỆT THỰ */}
            <div className="group bg-gradient-to-b from-[#11244E] to-[#0A1633] rounded-2xl overflow-hidden border border-slate-800 hover:border-[#E6C073]/40 transition-all duration-500 flex flex-col justify-between shadow-2xl hover:shadow-[#E6C073]/5">
              {/* Product Visual Area */}
              <div className="relative h-64 overflow-hidden bg-slate-905">
                <img 
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80" 
                  alt="Biệt thự luxury & Phòng kỹ thuật sang trọng"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                {/* Light overlay glow reflection */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1633] via-transparent to-transparent" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent transition-opacity duration-500" />
                
                {/* Embedded Metallic Badge effect */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-md text-[9px] font-mono tracking-widest text-[#E6C073] uppercase font-bold">
                  Elite Villa Luxury
                </div>
              </div>

              {/* Card Content Area */}
              <div className="p-6 md:p-8 space-y-6 flex-grow flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold font-sans text-white group-hover:text-[#E6C073] transition-colors uppercase tracking-tight">Biệt thự & không gian sống cao cấp</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    Giải pháp xử lý nước toàn diện dành cho các không gian sống cao cấp với lưu lượng lớn, khả năng làm mềm nước mạnh mẽ và vận hành ổn định 24/7.
                  </p>
                </div>

                {/* Tech specifications box */}
                <div className="bg-[#0D1627]/60 p-4 rounded-xl border border-slate-800/40 space-y-3">
                  <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold block">
                    Sản phẩm kiến nghị & Phân tích:
                  </span>
                  
                  {/* Products tags */}
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800/60 font-medium font-sans">
                    <span onClick={() => onNavigate('/san-pham')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors">
                      Pentair Foleo Pro Max
                    </span>
                    <span onClick={() => onNavigate('/san-pham')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors">
                      Pentair Watertrust Series 2.0
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans font-light list-disc list-inside">
                    <li>Pentair Foleo Pro Max phù hợp biệt thự và shophouse cao cấp</li>
                    <li>Pentair Watertrust Series 2.0 đáp ứng lưu lượng lớn, vận hành 24/7</li>
                    <li>Công nghệ lọc đa tầng, xử lý toàn diện nguồn nước</li>
                    <li>Phù hợp không gian sống rộng với nhu cầu sử dụng cao</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section CTA footer */}
          <div className="mt-16 pt-10 border-t border-slate-850 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-left space-y-1 max-w-xl">
              <span className="text-xs font-mono font-bold tracking-widest text-[#E6C073] uppercase">Pure Water Consulting</span>
              <p className="text-sm md:text-base font-sans font-light text-slate-200">
                Khám phá giải pháp Pentair phù hợp cho không gian sống của bạn
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('/lien-he')}
                className="px-6 py-3 bg-[#E6C073] hover:bg-[#d4ae5c] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#E6C073]/10 cursor-pointer flex items-center gap-2"
              >
                Tư vấn giải pháp
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              
              <button 
                onClick={() => setShowSoftenerAdvisor(true)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                Kiểm tra nguồn nước
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: CHỨNG NHẬN, CHỨNG CHỈ & GIẢI THƯỞNG STANDALONE CO-PANEL */}
        <section className="my-16 bg-slate-50/70 p-8 md:p-12 rounded-3xl border border-slate-100/80 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#bf9b30] bg-[#bf9b30]/10 px-3.5 py-1 rounded-full select-none">
              Bảo Chứng Niềm Tin Tuyệt Đối
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#004b87] uppercase tracking-tight">
              Chứng Nhận Quốc Tế & Công Nghệ Độc Quyền
            </h2>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Pentair được kiểm định bởi các tổ chức độc lập uy tín hàng đầu Hoa Kỳ, đồng thời sở hữu di sản công nghệ nước lâu đời và bền vững.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {/* Chứng nhận chứng chỉ */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-900 uppercase text-xs tracking-wider flex items-center gap-2 border-b pb-3 text-blue-600">
                <Shield className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                Chứng nhận & Chứng chỉ kiểm định cao cấp
              </h4>
              <ul className="space-y-4">
                {(certificates && certificates.length > 0 ? certificates : [
                  "NSF/ANSI Standard 44 – Tiêu chuẩn kiểm định làm mềm nước của NSF International, Hoa Kỳ.",
                  "NSF/ANSI Standard 53 – Tiêu chuẩn lọc giảm chất gây hại sức khỏe, được công nhận toàn cầu.",
                  "WQA Gold Seal – Con dấu chất lượng vàng của Hiệp hội Chất lượng Nước Quốc tế (Water Quality Association)."
                ]).map((cert: string, i: number) => (
                  <li key={i} className="flex gap-2.5 text-xs md:text-sm text-gray-650 font-sans leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT: Công Nghệ Độc Quyền & Di Sản Đổi Mới */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-900 uppercase text-xs tracking-wider flex items-center gap-2 border-b pb-3 text-[#bf9b30]">
                <Award className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                Công Nghệ Độc Quyền &amp; Di Sản Đổi Mới
              </h4>
              <ul className="space-y-4">
                <li className="flex gap-2.5 text-xs md:text-sm text-gray-650 font-sans leading-relaxed">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Hơn 60 năm kinh nghiệm phát triển công nghệ nước, từ năm 1966 đến nay.</span>
                </li>
                <li className="flex gap-2.5 text-xs md:text-sm text-gray-650 font-sans leading-relaxed">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Sở hữu nhiều bằng sáng chế trong lĩnh vực xử lý nước và van điều khiển tự động.</span>
                </li>
                <li className="flex gap-2.5 text-xs md:text-sm text-gray-650 font-sans leading-relaxed">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Thương hiệu Fleck – nổi tiếng toàn cầu trong ngành làm mềm nước, được các chuyên gia và nhà lắp đặt tin dùng rộng rãi.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ==========================================
  // ARCHITECTURAL PERSPECTIVES GALLERY VIEW
  // ==========================================
  if (isPerspective || isPerspectiveDetail) {
    return (
      <PerspectivePageView 
        currentPath={currentPath}
        onNavigate={onNavigate}
        posts={posts}
        perspectives={publicPerspectives}
        onFormSubmitSuccess={onFormSubmitSuccess}
        brandSettings={brandSettings}
      />
    );
  }

  // 4. PRODUCT INDEX INDEX PAGE
  if (isProducts) {
    const isAdminOrEditor = currentUser?.role === 'administrator' || currentUser?.role === 'editor';
    const isAuthor = currentUser?.role === 'author';

    const productsList = posts.filter(p => {
      if (p.type !== 'product') return false;
      const isPublished = p.status === 'publish' || p.status === 'published' || p.status === 'active';
      if (isPublished) return true;
      if (p.status === 'draft') {
        if (isAdminOrEditor) return true;
        if (isAuthor && p.authorId === currentUser?.id) return true;
      }
      return false;
    });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn" id="products-view">
        <Breadcrumb items={[{ label: 'Tất cả sản phẩm nước sang trọng' }]} onNavigate={onNavigate} />

        <div className="text-center max-w-xl mx-auto mb-12 space-y-3 mt-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-pentair bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
            Pentair Premium Series
          </span>
          <h2 className="text-3xl font-black text-pentair uppercase tracking-tight">Hệ thống xử lý nước siêu sang</h2>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Sự an tâm đỉnh cao cùng thiết bị nhập Hoa Kỳ. Phù hợp hoàn hảo kiến trúc biệt thự, lâu đài sang trọng hay căn hộ penthouse đẳng cấp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {productsList.map((prod) => (
            <div 
              key={prod.id}
              onClick={() => onNavigate(`/san-pham/${prod.slug}`)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-pentair/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer group"
            >
              <div className="aspect-square bg-gray-50 overflow-hidden relative">
                <img 
                  src={prod.featuredImage} 
                  alt={prod.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                {prod.status === 'draft' && (
                  <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-md uppercase tracking-wider z-10 animate-pulse">
                    Bản nháp
                  </span>
                )}

                {prod.meta?.hide_price === true || prod.meta?.hide_price === 'true' ? (
                  <span className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase shadow">
                    Liên hệ
                  </span>
                ) : (
                  <>
                    {prod.meta?.sale_price && prod.meta?.sale_price !== "" && Number(prod.meta?.sale_price) < Number(prod.meta?.regular_price) ? (
                      <div className="absolute top-4 right-4 flex flex-col items-end gap-1 z-10">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase shadow">
                          KM: {formatCurrency(prod.meta?.sale_price)}
                        </span>
                        <span className="bg-slate-900/80 text-white/80 line-through text-[9px] font-mono px-1.5 py-0.5 rounded">
                          {formatCurrency(prod.meta?.regular_price)}
                        </span>
                      </div>
                    ) : (
                      <span className="absolute top-4 right-4 bg-pentair text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider shadow">
                        {prod.meta?.regular_price ? formatCurrency(prod.meta?.regular_price) : 'Liên hệ'}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-pentair uppercase">Bộ sưu tập lọc Mỹ</span>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-pentair transition-colors line-clamp-2">{prod.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mt-1 font-sans">{prod.excerpt}</p>
                </div>

                {/* Purchase Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(prod, 1, false);
                    }}
                    className="py-2.5 px-3 bg-blue-50/70 hover:bg-blue-100 text-pentair transition-all text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-blue-100/40"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Thêm giỏ hàng
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(prod, 1, true);
                    }}
                    className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white transition-all text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Mua Ngay
                  </button>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase font-mono">thegioiloctong.com specs</span>
                  <span className="text-xs font-bold text-pentair flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                    Xem thông số
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. ALL NEWS & WATER ENVIRONMENT INSIGHTS
  if (isNews) {
    const newsList = posts.filter(p => {
      if (p.type !== 'post') return false;
      if (p.status === 'publish') return true;
      if (p.status === 'draft' && isAdminOrEditor) return true;
      return false;
    });
    
    // Perform local client side filter/search for supreme performance SEO matching
    const filteredNews = newsList.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(blogSearch.toLowerCase()) || 
                          n.content.toLowerCase().includes(blogSearch.toLowerCase());
      
      if (selectedCategory) {
        return matchSearch && n.terms?.some(t => t.id === selectedCategory);
      }
      return matchSearch;
    });

    const categoriesList = terms.filter(t => t.taxonomy === 'category' && t.status !== 'hidden');

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn" id="news-index-view">
        <Breadcrumb items={[{ label: 'Tin tức & Nguồn nước' }]} onNavigate={onNavigate} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-4">
          
          {/* Left Column: Side Filter menus (Categories like WP Category Widgets) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-pentair tracking-wider mb-2">Tìm kiếm tin bài</h4>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nhập từ khoá..." 
                  value={blogSearch}
                  onChange={e => setBlogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-pentair text-gray-800"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase text-pentair tracking-wider mb-2 border-b pb-2">Danh mục tin tức</h4>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left py-1 text-xs font-semibold cursor-pointer block ${!selectedCategory ? 'text-pentair font-bold' : 'text-gray-500 hover:text-pentair'}`}
              >
                Tất cả tin bài ({newsList.length})
              </button>
              {categoriesList.map((cat, i) => {
                const count = newsList.filter(n => n.terms?.some(t => t.id === cat.id)).length;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left py-1 text-xs font-semibold cursor-pointer block ${selectedCategory === cat.id ? 'text-pentair font-bold' : 'text-gray-500 hover:text-pentair'}`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: News loop feed */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-50/50 flex flex-wrap gap-2 justify-between items-center">
              <span className="text-xs font-sans text-gray-500">
                Tìm thấy <strong>{filteredNews.length}</strong> bài viết phù hợp
              </span>
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded"
                >
                  Xoá bộ lọc phân loại
                </button>
              )}
            </div>

            {filteredNews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium font-sans">Không tìm thấy bài viết thỏa mãn điều kiện lọc.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNews.map((n) => (
                  <article 
                    key={n.id}
                    onClick={() => onNavigate(`/tin-tuc/${n.slug}`)}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-pentair/40 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group"
                  >
                    <div className="h-44 bg-gray-50 overflow-hidden relative">
                      <img src={n.featuredImage} alt={n.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-3 left-3 bg-white/90 text-pentair font-medium text-[10px] px-2 py-0.5 rounded-full border shadow-sm">
                        {n.terms?.[0]?.name || 'Nguồn nước sạch'}
                      </span>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-pentair transition-colors line-clamp-2 leading-snug">{n.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mt-2 font-sans">{n.excerpt}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="font-bold text-pentair uppercase tracking-widest text-[10px] group-hover:underline">Đọc tiếp</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // 6. CONTACT PAGE WITH ADRESSED MAPS AND DETAILED FORMS
  if (isContact) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn" id="contacts-page-view">
        <Breadcrumb items={[{ label: 'Liên hệ Pentair' }]} onNavigate={onNavigate} />

        {/* Corporate contact block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
          
          {/* Left: Contact Info and Map */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pentair bg-blue-50 px-2 py-0.5 border rounded">Trụ Sở Văn Phòng Chính</span>
              <h2 className="text-2xl font-black text-pentair">Pentair Vietnam Representative</h2>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Đơn vị duy nhất nhập khẩu chính quy và thực thi quy chuẩn bảo hành kép từ tập đoàn Pentair Hoa Kỳ tại Việt Nam.
              </p>
              
              <div className="space-y-3 text-xs text-gray-600 mt-4">
                <div className="p-3 bg-gray-50 rounded-lg flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-pentair shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block font-bold mb-0.5">Địa chỉ trụ sở chính</strong>
                    <span>{brandSettings.address}</span>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-pentair shrink-0" />
                  <div>
                    <strong className="text-gray-900 font-bold">Hotline miễn phí toàn quốc: </strong>
                    <span className="text-rose-600 font-black text-sm">{brandSettings.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="bg-slate-100 h-[280px] rounded-2xl overflow-hidden relative shadow-inner border flex flex-col justify-center items-center">
              <iframe 
                src={headerSettings?.mapIframeUrl || brandSettings.mapIframeUrl || "https://maps.google.com/maps?q=90%20%C4%90%C6%B0%E1%BB%9Dng%20%C4%90inh%20Th%E1%BB%8B%20Thi,%20Khu%20%C4%91%C3%B4%20th%E1%BB%8B%20V%E1%BA%A1n%20Ph%C3%BAc,%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c,%20TP.HCM&t=&z=17&ie=UTF8&iwloc=&output=embed"}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
                title="Google Maps - Pentair Vietnam"
              ></iframe>
            </div>
          </div>

          {/* Right: Submission Consulting form */}
          <div className="lg:col-span-6">
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-lg space-y-6">
              <div>
                <h3 className="text-lg font-bold text-pentair uppercase tracking-wide">Yêu cầu liên hệ, đặt câu hỏi</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Vui lòng điền thông tin chi tiết dưới đây. Các tổng đài viên và kỹ sư trưởng của giải pháp Pentair sẽ tiếp nhận và gọi lại định giá sơ bộ chỉ sau 5 phút.</p>
              </div>

              <form onSubmit={handleSubmitLead} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block uppercase">Họ và tên của bạn *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nguyễn Văn A"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-pentair text-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block uppercase">Số điện thoại liên hệ *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="0911XXXXXX"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-pentair text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block uppercase">Địa chỉ Email *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="lienhe@domain.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-pentair text-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block uppercase">Sản phẩm quan tâm tư vấn</label>
                    <select
                      value={formData.productInterest}
                      onChange={e => setFormData({ ...formData, productInterest: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-pentair bg-white text-gray-800"
                    >
                      <option value="Pentair Maxi">Hệ thống lọc nước biệt thự Pentair Maxi</option>
                      <option value="Pentair Midi">Hệ thống lọc nước căn hộ Pentair Midi</option>
                      <option value="Khác">Sản phẩm lọc khác</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block uppercase">Nội dung ghi chú yêu cầu tư vấn</label>
                  <textarea 
                    rows={4}
                    placeholder="Ghi nhận cụ thể mong muốn của bạn như diện tích lắp đặt, hiện trạng nước nhà mình đang gặp phải..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-pentair text-gray-800"
                  />
                </div>

                {formSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-lg flex gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    <div>
                      <strong className="block font-bold">Gửi thông tin tư vấn thành công!</strong>
                      <span className="font-sans">Chân thành cảm ơn bạn đã quan tâm. Đăng ký đã được lưu vào CMS Submissions. Trưởng bộ phận tư vấn sẽ gọi điện ngay trong tích tắc !</span>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-lg">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 bg-pentair text-white font-bold text-xs uppercase rounded-lg hover:bg-pentair-light transition-all shadow tracking-widest cursor-pointer"
                  id="btn-lead-submit"
                >
                  {formLoading ? 'Hệ thống đang lưu...' : 'Gửi Đăng Ký Tư Vấn'}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* National Showrooms Section */}
        <div className="mt-16 pt-10 border-t border-gray-155">
          <div className="max-w-3xl mb-8">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase font-extrabold tracking-[0.2em] text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
              Hệ thống đại lý ủy quyền
            </span>
            <h2 className="text-2xl md:text-3xl font-sans font-black text-[#0C3471] uppercase tracking-tight leading-tight">
              Hệ Thống Showroom Pentair Toàn Quốc
            </h2>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-sans mt-2 font-light">
              Quý khách có thể trực tiếp tham quan, kiểm tra chất lượng nước và trải nghiệm thực tế các dòng máy lọc nước tổng cao cấp nhập khẩu từ Mỹ tại showroom gần nhất.
            </p>
          </div>

          {/* Search and Filters Controls */}
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-md space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Search Bar */}
              <div className="md:col-span-6 relative">
                <input 
                  type="text"
                  placeholder="Tìm showroom theo tên, địa chỉ, số điện thoại..."
                  value={showroomSearch}
                  onChange={e => {
                    setShowroomSearch(e.target.value);
                    setSelectedCity('Tất cả'); // Reset city when searching globally
                  }}
                  className="w-full pl-10 pr-10 py-3 text-xs md:text-sm rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-450 text-gray-850 transition-all font-sans"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
                {showroomSearch && (
                  <button 
                    onClick={() => setShowroomSearch('')}
                    className="absolute right-3.5 top-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all text-xs font-bold font-sans cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* City Selection Dropdown (Only show relevant cities) */}
              <div className="md:col-span-6 flex items-center gap-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap font-sans">Tỉnh/Thành phố:</label>
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-205 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-800 font-sans cursor-pointer"
                >
                  {cityOptions.map((city, idx) => (
                    <option key={idx} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Region Filters Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
              {(['Tất cả', 'Miền Bắc', 'Miền Trung - Tây Nguyên', 'Miền Nam'] as const).map((region, idx) => {
                const count = regionCounts[region];
                const isActive = activeRegion === region;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveRegion(region);
                      setSelectedCity('Tất cả'); // Reset city selection
                    }}
                    className={`px-4 py-2 rounded-2xl text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-[#0C3471] text-white shadow-md shadow-blue-900/10' 
                        : 'bg-slate-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    <span>{region}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Showroom scroll list */}
          <div 
            className="max-h-[550px] overflow-y-auto pr-2 space-y-4 scrollbar-thin"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#0C3471 rgba(0, 0, 0, 0.05)'
            }}
          >
            {filteredShowroomsList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 space-y-3">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-gray-700 font-sans uppercase">Không tìm thấy showroom phù hợp</h4>
                <p className="text-xs text-gray-400 font-sans max-w-sm mx-auto">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc thiết lập lại bộ lọc vùng miền.</p>
                <button
                  onClick={() => {
                    setShowroomSearch('');
                    setActiveRegion('Tất cả');
                    setSelectedCity('Tất cả');
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                >
                  Thiết lập lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                {filteredShowroomsList.map((show, idx) => {
                  const region = getShowroomRegion(show.address || '');
                  let regionBadgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                  if (region === 'Miền Bắc') regionBadgeColor = 'bg-red-50 text-red-700 border-red-100';
                  if (region === 'Miền Trung - Tây Nguyên') regionBadgeColor = 'bg-amber-50 text-amber-700 border-amber-100';

                  return (
                    <div 
                      key={idx} 
                      className="bg-white p-5 rounded-3xl border border-gray-100 hover:border-blue-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                    >
                      {/* Decorative corner light */}
                      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/5 group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${regionBadgeColor}`}>
                            {region}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            ✓ Đối tác chính hãng
                          </span>
                        </div>

                        <h4 className="text-sm md:text-base font-extrabold text-[#0C3471] group-hover:text-blue-700 transition-colors tracking-tight line-clamp-1 leading-snug">
                          {show.name}
                        </h4>

                        <div className="space-y-2 pt-1">
                          <p className="text-xs text-gray-500 leading-relaxed font-sans min-h-[36px] flex gap-1.5 items-start">
                            <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <span>{show.address}</span>
                          </p>
                          <p className="text-xs text-gray-755 font-semibold flex gap-1.5 items-center">
                            <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>Hotline: </span>
                            <a href={`tel:${show.phone}`} className="text-rose-600 hover:underline">{show.phone}</a>
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(show.name + ' ' + show.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 bg-slate-50 hover:bg-slate-100 text-gray-600 border border-gray-150 hover:border-gray-200 text-[10px] md:text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Xem bản đồ
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            // Autofill the message/notes field with showroom name
                            setFormData(prev => ({
                              ...prev,
                              message: `Tôi muốn đăng ký kiểm định nguồn nước & nhận tư vấn giải pháp từ Showroom: ${show.name}\nĐịa chỉ: ${show.address}`
                            }));
                            
                            // Scroll smoothly to form
                            const formElement = document.getElementById('contacts-page-view');
                            if (formElement) {
                              formElement.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="py-2.5 bg-blue-50 hover:bg-blue-100 text-[#0C3471] border border-blue-100 text-[10px] md:text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                        >
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Tư vấn ngay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 7. HOMEPAGE VIEW (CORE BRAND PRESENTATION)
  // Ensure we display seeded CMS values elegantly
  const homepage = posts.find(p => p.slug === 'trang-chu');
  const { 
    bannerTitle = "Pentair - Tinh Hoa Lọc Nước Thượng Hạng Từ Mỹ", 
    bannerSubTitle = "Hệ thống lọc tổng cao cấp cho căn hộ & biệt thự thượng lưu",
    introTitle = "Khai Phóng Nguồn Nước Thượng Lưu",
    introBody = "Không thuần túy là bộ máy cơ học, hệ thống lọc tổng Pentair là đại diện cho một lối sống an nhiên, tinh tế và bền bỉ chuẩn Âu.",
    whyChooseUs = [],
    videoUrl = "https://www.youtube.com/embed/S28s7-VWeis"
  } = homepage?.meta || {};

  return (
    <div id="homepage-root-view" className="bg-slate-50 min-h-screen">
      <HeroSection 
        bannerTitle={bannerTitle} 
        bannerSubTitle={bannerSubTitle} 
        onNavigate={onNavigate} 
        homepageSettings={homepageSettings}
      />
      <BrandIntroSection 
        introTitle={introTitle} 
        introBody={introBody} 
        onNavigate={onNavigate} 
        homepageSettings={homepageSettings}
      />
      <WhyChoosePentairSection 
        sectionTitle={homepage?.meta?.whyChooseTitle}
        reasons={whyChooseUs} 
        onNavigate={onNavigate} 
      />
      <FeaturedProductsSection 
        products={posts} 
        onNavigate={onNavigate} 
      />
      <ProductVideoSection 
        videoTitle={homepage?.meta?.videoTitle}
        videoSubtitle={homepage?.meta?.videoSubtitle}
        videoUrl={videoUrl} 
        videoThumbnail={homepage?.meta?.videoThumbnail}
        videos={publicVideos}
      />
      <PerspectiveGallerySection 
        galleryTitle={homepage?.meta?.galleryTitle}
        gallerySubtitle={homepage?.meta?.gallerySubtitle}
        perspectives={publicPerspectives} 
        onNavigate={onNavigate}
      />
      <ExploreMoreSection 
        products={posts} 
        onNavigate={onNavigate} 
      />
      <NewsSection 
        posts={posts} 
        onNavigate={onNavigate} 
      />
      <ContactCTASection />
    </div>
  );
}
