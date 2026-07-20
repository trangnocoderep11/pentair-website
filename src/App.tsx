/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PublicPages from './components/PublicPages';
import AdminCMS from './components/AdminCMS';
import { Post, Term, Option, FormSubmission, CartItem } from './types';
import { HelpCircle, RefreshCw } from 'lucide-react';
import ShoppingCart from './components/ShoppingCart';
import { initialData } from './initialData';

function decodeHTMLEntities(str: string): string {
  if (!str) return '';
  try {
    if (typeof document === 'undefined') return str;
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    let val = txt.value;
    for (let i = 0; i < 2; i++) {
      if (!val.includes('&')) break;
      const prev = val;
      txt.innerHTML = val;
      val = txt.value;
      if (val === prev) break;
    }
    return val;
  } catch (e) {
    return str;
  }
}

function cleanPostData(post: any) {
  if (!post) return post;
  const meta = post.meta || {};
  const showOnHomepage = meta.hasOwnProperty('showOnHomepage') ? !!meta.showOnHomepage : true;
  return {
    ...post,
    title: decodeHTMLEntities(post.title),
    excerpt: decodeHTMLEntities(post.excerpt),
    content: decodeHTMLEntities(post.content),
    meta: {
      ...meta,
      showOnHomepage
    }
  };
}

function cleanPerspectiveData(per: any) {
  if (!per) return per;
  return {
    ...per,
    title: decodeHTMLEntities(per.title),
    excerpt: decodeHTMLEntities(per.excerpt),
    content: decodeHTMLEntities(per.content)
  };
}

function cleanVideoData(vid: any) {
  if (!vid) return vid;
  return {
    ...vid,
    title: decodeHTMLEntities(vid.title),
    description: decodeHTMLEntities(vid.description)
  };
}

export default function App() {
  
  // REAL URL ROUTER — reads actual pathname so reloads land on the right page
  const [currentPath, setCurrentPath] = React.useState<string>(
    () => window.location.pathname || '/'
  );
  // Is the administrator dashboard currently open?
  const [showAdminCMS, setShowAdminCMS] = React.useState<boolean>(false);

  // SHOPPING CART CONTROLLER
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pentair_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    localStorage.setItem('pentair_cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product: Post, quantity: number = 1, autoOpen: boolean = true) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + quantity
        };
        return next;
      } else {
        return [...prev, { id: product.id, product, quantity }];
      }
    });
    if (autoOpen) {
      setCartOpen(true);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    if (qty < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: qty } : item));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // DATABASE GLOBAL STATES
  // Load cached database from localStorage if available to avoid cold start delay showing stale initialData
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem('pentair_cms_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to parse cached CMS data', e);
    }
    return null;
  };

  const cache = getCachedData();

  const rawPosts = cache?.posts || initialData.posts;
  const rawTerms = cache?.terms || initialData.terms;
  const rawOptions = cache?.options || initialData.options;
  const rawVideos = cache?.videos || initialData.videos;
  const rawPerspectives = cache?.perspectives || initialData.perspectives;

  const [posts, setPosts] = React.useState<Post[]>(rawPosts.map(cleanPostData) as Post[]);
  const [terms, setTerms] = React.useState<Term[]>(rawTerms as Term[]);
  const [options, setOptions] = React.useState<any[]>(rawOptions);
  const [submissions, setSubmissions] = React.useState<FormSubmission[]>([]);
  const [videos, setVideos] = React.useState<any[]>(rawVideos.map(cleanVideoData));
  const [perspectives, setPerspectives] = React.useState<any[]>(rawPerspectives.map(cleanPerspectiveData));
  
  // LOGIN USER SESSION STATE
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [dataLoading, setDataLoading] = React.useState<boolean>(false);
  const [dataError, setDataError] = React.useState<string>('');

  // 1. REFRESH AND BIND CONTENT FROM THE FULL-STACK NODE ENDPOINTS
  const loadCMSData = async () => {
    setDataError('');
    try {
      const headers: Record<string, string> = {};
      let token = localStorage.getItem('cms_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let res = await fetch('/api/bootstrap', { headers });

      // If token is invalid/expired (returns 401), fallback silently to guest mode
      if (res.status === 401) {
        console.warn("CMS session token was invalid or expired. Silently clearing storage and loading guest public content.");
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
        setCurrentUser(null);
        token = null;

        // Fetch public content as guest
        res = await fetch('/api/bootstrap');
      }

      if (!res.ok) {
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            throw new Error(errData.error);
          }
        } catch (jsonErr: any) {
          if (jsonErr.message && jsonErr.message.includes("DATABASE_URL")) {
            throw jsonErr;
          }
        }
        throw new Error("Lỗi tải thông tin cơ sở dữ liệu CMS từ máy chủ.");
      }

      const data = await res.json();

      const freshPosts = (data.posts || []).map(cleanPostData);
      const freshTerms = data.terms || [];
      const freshOptions = data.options || [];
      const freshVideos = (data.videos || []).map(cleanVideoData);
      const freshPerspectives = (data.perspectives || []).map(cleanPerspectiveData);

      setPosts(freshPosts);
      setTerms(freshTerms);
      setOptions(freshOptions);
      setVideos(freshVideos);
      setPerspectives(freshPerspectives);
      setSubmissions(data.submissions || []);

      // Cache fresh public data to localStorage
      try {
        localStorage.setItem('pentair_cms_cache', JSON.stringify({
          posts: freshPosts,
          terms: freshTerms,
          options: freshOptions,
          videos: freshVideos,
          perspectives: freshPerspectives
        }));
      } catch (e) {
        console.error('Failed to cache CMS data', e);
      }

    } catch (err: any) {
      console.error(err);
      if (initialData.posts.length === 0) {
        setDataError(err.message || "Không thể kết nối tới server Express CMS.");
      }
    }
  };

  // CHECK PERSISTENT SESSION ON INITIATION
  React.useEffect(() => {
    const token = localStorage.getItem('cms_token');
    const userStr = localStorage.getItem('cms_user');
    if (token && userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
      }
    }

    loadCMSData();
  }, []);

  // SECRET BACKDOOR ACCESS SYSTEM FOR WEBSITE ADMINISTRATORS
  React.useEffect(() => {
    const checkBackdoors = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const pathname = window.location.pathname;

      if (
        hash === '#admin' || 
        hash === '#cms' || 
        search.includes('portal=admin') || 
        search.includes('cms_login=true') ||
        pathname === '/admin-portal' ||
        pathname === '/admin'
      ) {
        setShowAdminCMS(true);
        if (hash) {
          try {
            window.location.hash = '';
          } catch (err) {}
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey combination: Ctrl + Alt + A (Invisibly opens CMS panel)
      if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setShowAdminCMS(true);
      }
    };

    checkBackdoors();
    window.addEventListener('hashchange', checkBackdoors);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkBackdoors);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 2. URL NAVIGATION — pushes real URL into history so reload works
  const handleVirtualNavigate = (url: string) => {
    window.history.pushState(null, '', url);
    setCurrentPath(url);
    setShowAdminCMS(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state when user presses browser Back / Forward
  React.useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 3. SEO METAS HEADER UPDATE ON FLY (Dynamic meta updating)
  React.useEffect(() => {
    const seoSettingsOption = options?.find(o => o.optionName === 'seo_settings')?.optionValue;
    const defaultTitle = seoSettingsOption?.metaTitle || "Pentair Việt Nam | Máy lọc nước tổng cao cấp nhập khẩu Mỹ";
    const defaultDesc = seoSettingsOption?.metaDescription || "Đại diện lọc tổng Pentair chính hãng.";

    // If viewing deep pages/product/blogs, modify header seo dynamically from its individual content
    let activeTitle = defaultTitle;
    let activeDesc = defaultDesc;

    if (currentPath === '/ve-pentair') {
      activeTitle = "Về Pentair | Lịch sử & Chứng chỉ NSF Mỹ của Pentair Việt Nam";
    } else if (currentPath === '/san-pham') {
      activeTitle = "Danh sách màng thiết bị lọc nước tổng Pentair cao cấp nhập khẩu Mỹ";
    } else if (currentPath === '/tin-tuc') {
      activeTitle = "Tin tức hợp tác & Thực trạng nguồn nước của Pentair Việt Nam";
    } else if (currentPath === '/lien-he') {
      activeTitle = "Showrooms ủy quyền & Liên hệ Hotline 1800 8134 | Pentair";
    } else if (currentPath.startsWith('/san-pham/') || currentPath.startsWith('/tin-tuc/')) {
      const slug = currentPath.substring(currentPath.lastIndexOf('/') + 1);
      const post = posts.find(p => p.slug === slug);
      if (post) {
        activeTitle = `${post.title} | Pentair Việt Nam`;
        activeDesc = post.excerpt || post.content.substring(0, 150);
      }
    }

    // Set document head dynamically
    document.title = activeTitle;
    
    // Attempt meta description update
    let metaDescEl = document.querySelector('meta[name="description"]');
    if (!metaDescEl) {
      metaDescEl = document.createElement('meta');
      metaDescEl.setAttribute('name', 'description');
      document.head.appendChild(metaDescEl);
    }
    metaDescEl.setAttribute('content', activeDesc);

    // Rel canonical updating
    let relCanonicalEl = document.querySelector('link[rel="canonical"]');
    if (!relCanonicalEl) {
      relCanonicalEl = document.createElement('link');
      relCanonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(relCanonicalEl);
    }
    relCanonicalEl.setAttribute('href', (seoSettingsOption?.canonicalUrl || window.location.origin) + currentPath);

    // Dynamic favicon updating
    const brandValueOpt = options?.find(o => o.optionName === 'brand_settings')?.optionValue;
    const faviconUrl = brandValueOpt?.favicon || '/favicon.ico';
    let faviconEl = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!faviconEl) {
      faviconEl = document.createElement('link');
      faviconEl.setAttribute('rel', 'icon');
      document.head.appendChild(faviconEl);
    }
    faviconEl.setAttribute('href', faviconUrl);

  }, [currentPath, options, posts]);

  // LOGIN SESSION HANDLERS
  const handleNewLogin = (user: any, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('cms_token', token);
    localStorage.setItem('cms_user', JSON.stringify(user));
    loadCMSData(); // Reload submissions with token authorization immediately
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    setShowAdminCMS(false);
    loadCMSData(); // Reload data privately
  };

  // ----------------------------------------------------
  // EXTRACT OPTIONS BIND
  // ----------------------------------------------------
  const brandValue = options.find(o => o.optionName === 'brand_settings')?.optionValue || {
    siteName: "Pentair Việt Nam",
    tagline: "Tinh Hoa Lọc Nước Từ Mỹ",
    email: "pentairvn@gmail.com",
    phone: "1800 8134",
    address: "90 Đ. Đinh Thị Thi, Khu đô Thị Vạn Phúc, Thủ Đức, Hồ Chí Minh",
    facebook: "https://www.facebook.com/PentairVietNamOfficial",
    youtube: "https://www.youtube.com/@PentairVietNamOfficial"
  };

  const headerMenuValue = options.find(o => o.optionName === 'header_menu')?.optionValue || [
    { label: "Về Pentair", url: "/ve-pentair" },
    { label: "Sản phẩm", url: "/san-pham" },
    { label: "Phối cảnh", url: "/phoi-canh" },
    { label: "Tin tức", url: "/tin-tuc" },
    { label: "Liên hệ", url: "/lien-he" }
  ];

  const showroomListValue = options.find(o => o.optionName === 'showrooms')?.optionValue || [
    { name: "Showroom Thủ Đức (Vạn Phúc City)", address: "90 Đ. Đinh Thị Thi, Khu đô Thị Vạn Phúc, Thủ Đức, Hồ Chí Minh", phone: "1800 8134" }
  ];

  const footerPoliciesValue = options.find(o => o.optionName === 'footer_policies')?.optionValue || [
    { title: "Chính sách giao hàng", content: "Cam kết tối đa 24h nội thành." },
    { title: "Chính sách bảo hành", content: "Cam kết bảo hành kép 3-5 năm." },
    { title: "Chính sách đổi trả", content: "Đổi mới 1-1 trong 30 ngày." },
    { title: "Chính sách bảo mật", content: "Tuyệt đối an tâm." }
  ];

  const headerSettingsValue = options.find(o => o.optionName === 'header_settings')?.optionValue || {};
  const globalHQsValue = options.find(o => o.optionName === 'global_hqs')?.optionValue || [];
  const homepageSettingsValue = {
    ...(options.find(o => o.optionName === 'homepage_settings')?.optionValue || {}),
    softener_slides: options.find(o => o.optionName === 'softener_slides')?.optionValue || []
  };

  // ----------------------------------------------------
  // DIAGNOSTIC SCREEN FOR CRITICAL ERROR
  // ----------------------------------------------------
  if (dataError) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center p-4 font-sans border-t-4 border-red-500">
        <div className="max-w-md w-full bg-red-50 rounded-2xl p-6 text-center space-y-4 border border-red-150 shadow-lg">
          <HelpCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-red-900 uppercase">Lỗi Đồng Bộ Hoá Dữ Liệu CMS</h2>
          <p className="text-xs text-red-700 leading-relaxed font-sans font-medium">
            {dataError}
          </p>
          <button 
            onClick={loadCMSData}
            className="px-6 py-2.5 bg-red-600 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-700 transition-all font-sans cursor-pointer flex items-center gap-1.5 justify-center mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử tải lại trang
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER CANVAS GATE
  // ----------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showAdminCMS ? (
        
        /* 1. SECURE WORDPRESS CMS MANAGEMENT INTERFACE */
        <AdminCMS 
          currentUser={currentUser}
          onNewLogin={handleNewLogin}
          onLogout={handleLogout}
          onRefreshData={loadCMSData}
          posts={posts}
          terms={terms}
          options={options}
          submissions={submissions}
          videos={videos}
          perspectives={perspectives}
        />
        
      ) : (
        
        /* 2. PUBLIC BRANDING WEBSITE (Pentair Vietnam luxury showcase) */
        <div className="flex flex-col min-h-screen animate-fadeIn">
          {localStorage.getItem('cms_token') && (
            // Small sticky bar informing they are logged in as admin
            <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 flex justify-between items-center font-mono border-b border-black">
              <span className="text-blue-300">✓ Bạn đang ở chế độ Xem với tư cách Administrator sitemap</span>
              <button 
                onClick={() => setShowAdminCMS(true)}
                className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold text-white hover:bg-blue-500"
              >
                Ghé Vào CMS Dashboard
              </button>
            </div>
          )}

          <Header 
            siteName={brandValue.siteName}
            tagline={brandValue.tagline}
            menuItems={headerMenuValue}
            currentPath={currentPath}
            onNavigate={handleVirtualNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenAdmin={() => setShowAdminCMS(true)}
            cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
            onOpenCart={() => setCartOpen(true)}
            logoText={headerSettingsValue.logoText || 'P'}
            logoImageUrl={headerSettingsValue.logoImageUrl || ''}
            topBarHotline={headerSettingsValue.topBarHotline || '1800 8134'}
            topBarAddress={headerSettingsValue.topBarAddress || 'Trụ sở: 90 Đinh Thị Thi, Vạn Phúc City, Thủ Đức'}
            topBarTagline={headerSettingsValue.topBarTagline || 'Pentair USA - Leading the Water Revolution'}
          />

          <main className="flex-grow">
            <PublicPages 
              currentPath={currentPath}
              onNavigate={handleVirtualNavigate}
              brandSettings={brandValue}
              headerSettings={headerSettingsValue}
              homepageSettings={homepageSettingsValue}
              showrooms={showroomListValue}
              posts={posts}
              terms={terms}
              currentUser={currentUser}
              onFormSubmitSuccess={loadCMSData} // Auto reload unread submissions count in background
              videos={videos}
              perspectives={perspectives}
              onAddToCart={handleAddToCart}
            />
          </main>

          <Footer 
            brandSettings={brandValue}
            policies={footerPoliciesValue}
            showrooms={showroomListValue}
            onNavigate={handleVirtualNavigate}
            onOpenAdmin={currentUser ? () => setShowAdminCMS(true) : undefined}
            logoText={headerSettingsValue.footerLogoText}
            logoImageUrl={headerSettingsValue.footerLogoImageUrl}
            logoTextFull={headerSettingsValue.footerLogoTextFull}
            globalHQs={globalHQsValue}
          />

          <ShoppingCart 
            isOpen={cartOpen}
            onClose={() => setCartOpen(false)}
            cartItems={cart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onClearCart={handleClearCart}
            onFormSubmitSuccess={loadCMSData}
            posts={posts}
            onNavigate={handleVirtualNavigate}
          />
        </div>
        
      )}
    </div>
  );
}
