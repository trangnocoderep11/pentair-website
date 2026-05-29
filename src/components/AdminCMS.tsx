/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, FileText, ShoppingBag, FolderTree, MessageSquare, Settings2, 
  Database, ShieldCheck, KeyRound, UserCheck, Plus, Pencil, Trash2, 
  Eye, FileCode, CheckCircle, AlertTriangle, Save, LogOut, ArrowRight, Download, Upload, Shield, RefreshCw, Server,
  Mail, Video, LayoutTemplate, Image, Search, ChevronDown, X
} from 'lucide-react';
import { Post, Term, FormSubmission, CMSBackup } from '../types';
import MediaLibrary from './MediaLibrary';

function cleanVietnameseSlug(str: string): string {
  if (!str) return '';
  let slug = str.toLowerCase();
  
  // Replace Vietnamese accent characters with non-accent counterparts
  slug = slug.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
  slug = slug.replace(/[èéẹẻẽêềếệểễ]/g, "e");
  slug = slug.replace(/[ìíịỉĩ]/g, "i");
  slug = slug.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
  slug = slug.replace(/[ùúụủũưừứựửữ]/g, "u");
  slug = slug.replace(/[ỳýỵỷỹ]/g, "y");
  slug = slug.replace(/đ/g, "d");
  
  // Remove special characters, spaces, and replace with hyphens
  slug = slug.replace(/[^a-z0-9\s-]/g, ""); // Keep spaces and alphanumeric
  slug = slug.replace(/\s+/g, "-");         // Replace spaces with -
  slug = slug.replace(/-+/g, "-");          // Remove duplicate -
  slug = slug.trim();
  slug = slug.replace(/^-+|-+$/g, "");      // Strip leading/trailing -
  return slug;
}

interface AdminCMSProps {
  onNewLogin: (user: any, token: string) => void;
  currentUser: any;
  onLogout: () => void;
  onRefreshData: () => Promise<void>;
  posts: Post[];
  terms: Term[];
  options: any[];
  submissions: FormSubmission[];
  videos: any[];
  perspectives: any[];
}

export default function AdminCMS({
  onNewLogin,
  currentUser,
  onLogout,
  onRefreshData,
  posts,
  terms,
  options,
  submissions,
  videos,
  perspectives
}: AdminCMSProps) {
  
  // LOGIN FORM STATES
  const [loginUsername, setLoginUsername] = React.useState('admin');
  const [loginPassword, setLoginPassword] = React.useState('admin123');
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const [require2FA, setRequire2FA] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');
  const [loginLoading, setLoginLoading] = React.useState(false);

  // NAVIGATION SUB-MENU
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'posts' | 'pages' | 'products' | 'categories' | 'submissions' | 'settings' | 'security' | 'backup' | 'supabase' | 'email-settings' | 'videos' | 'perspectives' | 'media'>('dashboard');

  // BACKEND INTEGRATION STATES
  const [actionStatus, setActionStatus] = React.useState({ success: '', error: '' });
  const [actionLoading, setActionLoading] = React.useState(false);

  // SUPABASE INTEGRATION STATES
  const [supabaseConfig, setSupabaseConfig] = React.useState<{ url: string; projectRef: string; hasKey: boolean; apiKeyPreview: string } | null>(null);
  const [supabaseTestResult, setSupabaseTestResult] = React.useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [testingSupabase, setTestingSupabase] = React.useState(false);

  // EMAIL NOTIFICATION STATES
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [emailRecipients, setEmailRecipients] = React.useState('');
  const [newEmailInput, setNewEmailInput] = React.useState('');
  const [smtpHost, setSmtpHost] = React.useState('');
  const [smtpPort, setSmtpPort] = React.useState(587);
  const [smtpUser, setSmtpUser] = React.useState('');
  const [smtpPass, setSmtpPass] = React.useState('');
  const [smtpSecure, setSmtpSecure] = React.useState(false);

  const [emailStatusMsg, setEmailStatusMsg] = React.useState('');
  const [emailErrorMsg, setEmailErrorMsg] = React.useState('');
  const [testingEmail, setTestingEmail] = React.useState(false);
  const [savingEmail, setSavingEmail] = React.useState(false);

  // VIDEOS MANAGEMENT STATES
  const [editingVideoId, setEditingVideoId] = React.useState<string | null>(null);
  const [isCreatingVideo, setIsCreatingVideo] = React.useState(false);
  const [videoForm, setVideoForm] = React.useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnail: '',
    category: 'introduction' as 'introduction' | 'operation' | 'installation' | 'review',
    duration: '3:00',
    sortOrder: 1,
    isFeatured: false,
    status: 'published'
  });
  const [videoStatusMsg, setVideoStatusMsg] = React.useState('');
  const [videoErrorMsg, setVideoErrorMsg] = React.useState('');
  const [videoLoading, setVideoLoading] = React.useState(false);

  // PERSPECTIVES MANAGEMENT STATES
  const [editingPerspectiveId, setEditingPerspectiveId] = React.useState<string | null>(null);
  const [isCreatingPerspective, setIsCreatingPerspective] = React.useState(false);
  const [perspectiveForm, setPerspectiveForm] = React.useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    gallery: [] as string[],
    productGallery: [] as string[],
    spaceType: 'villa',
    relatedProductIds: [] as string[],
    status: 'published',
    sortOrder: 1,
    isFeatured: false
  });
  const [perspectiveStatusMsg, setPerspectiveStatusMsg] = React.useState('');
  const [perspectiveErrorMsg, setPerspectiveErrorMsg] = React.useState('');
  const [perspectiveLoading, setPerspectiveLoading] = React.useState(false);
  const [tempGalleryInput, setTempGalleryInput] = React.useState('');
  const [tempProductGalleryInput, setTempProductGalleryInput] = React.useState('');
  const [postSearchQuery, setPostSearchQuery] = React.useState('');

  // MEDIA SELECTOR MODAL STATE
  const [activeMediaSelector, setActiveMediaSelector] = React.useState<{
    target: 'post_featured' | 'video_thumbnail' | 'perspective_featured' | 'perspective_gallery' | 'perspective_product_gallery';
  } | null>(null);

  // USER MANAGEMENT STATES
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [showUserForm, setShowUserForm] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [userForm, setUserForm] = React.useState({
    username: '',
    password: '',
    email: '',
    role: 'editor' as 'administrator' | 'editor'
  });
  const [userSuccessMsg, setUserSuccessMsg] = React.useState('');
  const [userErrorMsg, setUserErrorMsg] = React.useState('');

  // CONTENT PREVIEW STATES
  const [previewItem, setPreviewItem] = React.useState<{
    type: 'post' | 'product' | 'perspective' | 'video';
    data: any;
  } | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      } else {
        const errData = await res.json();
        console.error("Lỗi lấy danh sách user:", errData.error);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách user:", err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'security' && currentUser?.role === 'administrator') {
      fetchUsers();
    }
  }, [activeTab, currentUser]);

  React.useEffect(() => {
    if (currentUser && currentUser.role === 'editor') {
      const allowedTabsForEditor = ['dashboard', 'posts', 'products', 'videos', 'perspectives', 'media'];
      if (!allowedTabsForEditor.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, currentUser]);

  React.useEffect(() => {
    setPostSearchQuery('');
  }, [activeTab]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccessMsg('');
    setUserErrorMsg('');
    try {
      const isEdit = !!editingUserId;
      const url = isEdit ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thao tác thất bại.');
      }

      setUserSuccessMsg(`Đã ${isEdit ? 'cập nhật' : 'thêm'} thành viên thành công!`);
      setUserForm({ username: '', password: '', email: '', role: 'editor' });
      setEditingUserId(null);
      setShowUserForm(false);
      fetchUsers();
    } catch (err: any) {
      setUserErrorMsg(err.message || 'Lỗi không xác định.');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản quản trị viên "${username}" không?`)) return;
    setUserSuccessMsg('');
    setUserErrorMsg('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xóa tài khoản thất bại.');
      }
      triggerToast("Đã xóa tài khoản quản trị thành công.");
      fetchUsers();
    } catch (err: any) {
      triggerToast(err.message || 'Lỗi không thể xóa tài khoản.', true);
    }
  };

  // Fetch Email Configuration on Mount / Tab Switch
  React.useEffect(() => {
    if (activeTab === 'email-settings') {
      setEmailStatusMsg('');
      setEmailErrorMsg('');
      fetch('/api/admin/settings/email', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setEmailEnabled(data.email_notification_enabled !== false);
          setEmailRecipients(data.contact_email_recipients || '');
          setSmtpHost(data.smtp_settings?.host || '');
          setSmtpPort(data.smtp_settings?.port || 587);
          setSmtpUser(data.smtp_settings?.username || '');
          setSmtpPass(data.smtp_settings?.password || '');
          setSmtpSecure(data.smtp_settings?.encryption === 'SSL' || data.smtp_settings?.port == 465);
        })
        .catch(err => {
          console.error('Lỗi tải cấu hình email:', err);
          setEmailErrorMsg('Không thể tải cấu hình email từ máy chủ.');
        });
    }
  }, [activeTab]);

  // Handle Save Email Notifications Options
  const handleSaveEmailSettings = async (customRecipients?: string) => {
    setSavingEmail(true);
    setEmailStatusMsg('');
    setEmailErrorMsg('');
    const targetRecipients = customRecipients !== undefined ? customRecipients : emailRecipients;
    try {
      const res = await fetch('/api/admin/settings/email', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({
          email_notification_enabled: emailEnabled,
          contact_email_recipients: targetRecipients,
          smtp_settings: {
            host: smtpHost,
            port: Number(smtpPort),
            username: smtpUser,
            password: smtpPass,
            encryption: smtpSecure ? 'SSL' : 'TLS'
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu cấu hình.');
      setEmailStatusMsg('Đã lưu cấu hình email notification thành công!');
    } catch (err: any) {
      setEmailErrorMsg(err.message || 'Lỗi không xác định.');
    } finally {
      setSavingEmail(false);
    }
  };

  // Run Test Verification Email SMTP
  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    setEmailStatusMsg('');
    setEmailErrorMsg('');
    try {
      const res = await fetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gửi test thất bại.');
      setEmailStatusMsg('Đã gửi email kiểm tra thành công! Vui lòng kiểm tra inbox (hoặc spam) của các email nhận tin.');
    } catch (err: any) {
      setEmailErrorMsg(err.message || 'Lỗi gửi test.');
    } finally {
      setTestingEmail(false);
    }
  };

  // Add an email to the notification recipients list (persisted immediately)
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInsert = newEmailInput.trim().toLowerCase();
    
    // Basic email format validator
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToInsert) {
      setEmailErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!emailRegex.test(emailToInsert)) {
      setEmailErrorMsg('Địa chỉ email không đúng định dạng. Ví dụ: hotro@pentairvn.com');
      return;
    }

    const currentList = emailRecipients
      .split(/[\n,]+/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email !== '');

    if (currentList.includes(emailToInsert)) {
      setEmailErrorMsg('Email này đã tồn tại trong danh sách nhận tin.');
      return;
    }

    const updatedList = [...currentList, emailToInsert];
    const combinedStr = updatedList.join(', ');
    setEmailRecipients(combinedStr);
    setNewEmailInput('');
    
    // Auto-save to the backend
    await handleSaveEmailSettings(combinedStr);
  };

  // Remove an email from the notification recipients list (persisted immediately)
  const handleDeleteEmail = async (emailToRemove: string) => {
    const currentList = emailRecipients
      .split(/[\n,]+/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email !== '');

    const updatedList = currentList.filter(email => email !== emailToRemove.toLowerCase());
    const combinedStr = updatedList.join(', ');
    setEmailRecipients(combinedStr);

    // Auto-save to the backend
    await handleSaveEmailSettings(combinedStr);
  };

  // Fetch Supabase configuration on mount or when activeTab changes
  React.useEffect(() => {
    if (activeTab === 'supabase') {
      fetch('/api/supabase/config')
        .then(res => res.json())
        .then(data => setSupabaseConfig(data))
        .catch(err => console.error("Lỗi tải cấu hình Supabase:", err));
    }
  }, [activeTab]);

  const testSupabaseConnection = async () => {
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await fetch('/api/supabase/test-connection', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSupabaseTestResult({ success: true, message: data.message, details: data.details });
      } else {
        setSupabaseTestResult({ success: false, message: data.error || "Không thể xác thực kết nối." });
      }
    } catch (err: any) {
      setSupabaseTestResult({ success: false, message: err.message || "Lỗi mạng khi kết nối tới Supabase." });
    } finally {
      setTestingSupabase(false);
    }
  };

  // VIDEO CRUD HANDLERS
  const startCreateVideo = () => {
    setIsCreatingVideo(true);
    setEditingVideoId(null);
    setVideoForm({
      title: '',
      description: '',
      videoUrl: '',
      thumbnail: '',
      category: 'introduction',
      duration: '3:00',
      sortOrder: (videos && videos.length > 0 ? videos.length + 1 : 1),
      isFeatured: false,
      status: 'published'
    });
    setVideoStatusMsg('');
    setVideoErrorMsg('');
  };

  const startEditVideo = (v: any) => {
    setIsCreatingVideo(false);
    setEditingVideoId(v.id);
    setVideoForm({
      title: v.title || '',
      description: v.description || '',
      videoUrl: v.videoUrl || '',
      thumbnail: v.thumbnail || '',
      category: v.category || 'introduction',
      duration: v.duration || '3:00',
      sortOrder: v.sortOrder || 1,
      isFeatured: !!v.isFeatured,
      status: v.status || 'published'
    });
    setVideoStatusMsg('');
    setVideoErrorMsg('');
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoLoading(true);
    setVideoStatusMsg('');
    setVideoErrorMsg('');
    try {
      const isEdit = !!editingVideoId;
      const url = isEdit ? `/api/admin/videos/${editingVideoId}` : '/api/admin/videos';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thao tác.');

      setVideoStatusMsg(`Đã ${isEdit ? 'cập nhật' : 'thêm'} video thành công!`);
      setIsCreatingVideo(false);
      setEditingVideoId(null);
      await onRefreshData();
    } catch (err: any) {
      setVideoErrorMsg(err.message || 'Lỗi lưu dữ liệu.');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa video này khỏi danh sách phát không?')) return;
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xóa video.');
      triggerToast('Đã xóa video thành công!');
      await onRefreshData();
    } catch (err: any) {
      triggerToast(err.message || 'Lỗi xảy ra.', true);
    }
  };

  // PERSPECTIVE CRUD HANDLERS
  const startCreatePerspective = () => {
    setIsCreatingPerspective(true);
    setEditingPerspectiveId(null);
    setPerspectiveForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      gallery: [],
      productGallery: [],
      spaceType: 'villa',
      relatedProductIds: [],
      status: 'published',
      sortOrder: (perspectives && perspectives.length > 0 ? perspectives.length + 1 : 1),
      isFeatured: false
    });
    setTempGalleryInput('');
    setTempProductGalleryInput('');
    setPerspectiveStatusMsg('');
    setPerspectiveErrorMsg('');
  };

  const startEditPerspective = (p: any) => {
    setIsCreatingPerspective(false);
    setEditingPerspectiveId(p.id);
    setPerspectiveForm({
      title: p.title || '',
      slug: p.slug || '',
      excerpt: p.excerpt || '',
      content: p.content || '',
      featuredImage: p.featuredImage || '',
      gallery: p.gallery || [],
      productGallery: p.productGallery || [],
      spaceType: p.spaceType || 'villa',
      relatedProductIds: p.relatedProductIds || [],
      status: p.status || 'published',
      sortOrder: p.sortOrder || 1,
      isFeatured: !!p.isFeatured
    });
    setTempGalleryInput((p.gallery || []).join(', '));
    setTempProductGalleryInput((p.productGallery || []).join(', '));
    setPerspectiveStatusMsg('');
    setPerspectiveErrorMsg('');
  };

  const handleSavePerspective = async (e: React.FormEvent) => {
    e.preventDefault();
    setPerspectiveLoading(true);
    setPerspectiveStatusMsg('');
    setPerspectiveErrorMsg('');
    try {
      const isEdit = !!editingPerspectiveId;
      const url = isEdit ? `/api/admin/perspectives/${editingPerspectiveId}` : '/api/admin/perspectives';
      const method = isEdit ? 'PUT' : 'POST';

      const galleryArr = tempGalleryInput
        ? tempGalleryInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const productGalleryArr = tempProductGalleryInput
        ? tempProductGalleryInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...perspectiveForm,
        gallery: galleryArr,
        productGallery: productGalleryArr
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu phối cảnh.');

      setPerspectiveStatusMsg(`Đã ${isEdit ? 'sửa' : 'thêm'} phối cảnh '${payload.title}' thành công!`);
      setIsCreatingPerspective(false);
      setEditingPerspectiveId(null);
      await onRefreshData();
    } catch (err: any) {
      setPerspectiveErrorMsg(err.message || 'Lỗi lưu dữ liệu.');
    } finally {
      setPerspectiveLoading(false);
    }
  };

  const handleDeletePerspective = async (id: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa không gian phối cảnh này không?')) return;
    try {
      const res = await fetch(`/api/admin/perspectives/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thao tác.');
      triggerToast('Đã xóa phối cảnh không gian thành công!');
      await onRefreshData();
    } catch (err: any) {
      triggerToast(err.message || 'Có lỗi xảy ra.', true);
    }
  };


  // POST/PAGE/PRODUCT EDITING STATES
  const [editingPostId, setEditingPostId] = React.useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [postForm, setPostForm] = React.useState<Partial<Post>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    type: 'post',
    status: 'draft',
    featuredImage: '',
    menuOrder: 0,
    meta: {},
    terms: []
  });

  // TERMS FORM STATES
  const [termForm, setTermForm] = React.useState({ 
    name: '', 
    slug: '', 
    taxonomy: 'category' as 'category' | 'tag' | 'product_cat',
    status: 'publish' as 'publish' | 'hidden'
  });
  const [editingTermId, setEditingTermId] = React.useState<string | null>(null);
  const [selectedInspectTermId, setSelectedInspectTermId] = React.useState<string | null>(null);

  // BRAND & SEO SETTINGS OPTIONS FORM
  const [brandForm, setBrandForm] = React.useState({
    siteName: 'Pentair Việt Nam',
    tagline: 'Tinh Hoa Lọc Nước Từ Mỹ',
    phone: '1800 8134',
    email: 'contact@pentairvn.com',
    address: '90 Đ. Đinh Thị Thi, Khu đô Thị Vạn Phúc, Thủ Đức, Hồ Chí Minh',
    facebook: 'https://www.facebook.com/PentairVietNamOfficial',
    youtube: 'https://www.youtube.com/@PentairVietNamOfficial'
  });
  const [seoForm, setSeoForm] = React.useState({
    metaTitle: 'Pentair Việt Nam | Máy lọc nước tổng cao cấp nhập khẩu Mỹ',
    metaDescription: 'Phân phối chính hãng màng sợi rỗng, van điều khiển fleck sừng sỏ',
    canonicalUrl: 'https://thegioiloctong.com',
    robotsTxt: ''
  });

  // SHOWROOMS SETTING LIST
  const [showroomList, setShowroomList] = React.useState<any[]>([]);

  // BACKUP CODE-BOX IMPORT
  const [backupJsonText, setBackupJsonText] = React.useState('');

  // INITIATION OPTIONS BIND
  React.useEffect(() => {
    if (options && options.length > 0) {
      const brand = options.find(o => o.optionName === 'brand_settings')?.optionValue || {};
      const seo = options.find(o => o.optionName === 'seo_settings')?.optionValue || {};
      const shows = options.find(o => o.optionName === 'showrooms')?.optionValue || [];
      
      setBrandForm({
        siteName: brand.siteName || 'Pentair Việt Nam',
        tagline: brand.tagline || 'Tinh Hoa Lọc Nước Từ Mỹ',
        phone: brand.phone || '1800 8134',
        email: brand.email || 'pentairvn@gmail.com',
        address: brand.address || '90 Đ. Đinh Thị Thi, Khu đô Thị Vạn Phúc, Thủ Đức, Hồ Chí Minh',
        facebook: brand.facebook || '',
        youtube: brand.youtube || ''
      });

      setSeoForm({
        metaTitle: seo.metaTitle || '',
        metaDescription: seo.metaDescription || '',
        canonicalUrl: seo.canonicalUrl || '',
        robotsTxt: seo.robotsTxt || ''
      });

      setShowroomList(shows);
    }
  }, [options]);

  const triggerToast = (msgStr: string, isError = false) => {
    setActionStatus({
      success: isError ? '' : msgStr,
      error: isError ? msgStr : ''
    });
    setTimeout(() => {
      setActionStatus({ success: '', error: '' });
    }, 4500);
  };

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          twoFactorCode: require2FA ? twoFactorCode : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công.');
      }

      if (data.require2FA) {
        setRequire2FA(true);
        triggerToast("Vui lòng thực hiện xác minh mã bảo mật 2FA 6 số.");
      } else {
        onNewLogin(data.user, data.token);
        triggerToast(`Chào mừng quản trị viên ${data.user.username} quay trở lại!`);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Mất kết nối máy chủ.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termForm.name) return;
    try {
      const endpoint = editingTermId ? `/api/terms/${editingTermId}` : '/api/terms';
      const method = editingTermId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(termForm)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || (editingTermId ? "Cập nhật chuyên mục bị từ chối." : "Thêm danh mục bị từ chối."));
      }
      setTermForm({ name: '', slug: '', taxonomy: 'category', status: 'publish' });
      setEditingTermId(null);
      await onRefreshData();
      triggerToast(editingTermId ? "Cập nhật chuyên mục thành công." : "Cập nhật sơ đồ danh mục thành công.");
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chuyên mục này không? Các bài viết và sản phẩm thuộc chuyên mục này sẽ chỉ bị bỏ liên kết mà không bị mất dữ liệu.")) return;
    try {
      const res = await fetch(`/api/terms/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "Thao tác xóa chuyên mục thất bại.");
        let errMsg = "Thao tác xóa chuyên mục thất bại.";
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          errMsg = errText;
        }
        throw new Error(errMsg);
      }
      await onRefreshData();
      triggerToast("Đã xóa chuyên mục thành công!");
      if (selectedInspectTermId === id) {
        setSelectedInspectTermId(null);
      }
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleToggleTermStatus = async (term: Term) => {
    const nextStatus = term.status === 'hidden' ? 'publish' : 'hidden';
    try {
      const res = await fetch(`/api/terms/${term.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({ ...term, status: nextStatus })
      });
      if (!res.ok) throw new Error("Cập nhật trạng thái danh mục thất bại.");
      await onRefreshData();
      triggerToast(`Đã thay đổi trạng thái danh mục thành: ${nextStatus === 'hidden' ? 'Ẩn' : 'Công khai'}`);
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleRemovePostFromTerm = async (postId: string, termId: string) => {
    const postObj = posts.find(p => p.id === postId);
    if (!postObj) return;
    if (!confirm(`Bạn có chắc muốn xoá bài viết "${postObj.title}" khỏi danh mục này không?`)) return;

    // Filter out the selected category (term)
    const updatedTerms = (postObj.terms || []).filter(t => t.id !== termId);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({
          ...postObj,
          terms: updatedTerms
        })
      });
      if (!res.ok) {
        throw new Error("Không thể gỡ bỏ liên kết bài viết khỏi danh mục này.");
      }
      await onRefreshData();
      triggerToast("Đã xoá bài viết khỏi danh mục thành công!");
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  // POST CRUD HANDLERS
  const triggerEditPost = (p: Post) => {
    setPostForm({ ...p });
    setEditingPostId(p.id);
    setIsCreatingNew(false);
  };

  const triggerCreateNewPost = (type: 'post' | 'page' | 'product') => {
    setPostForm({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      type,
      status: 'draft',
      featuredImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      menuOrder: 0,
      meta: type === 'product' ? {
        price: '185000000',
        regular_price: '185000000',
        sale_price: '165000000',
        hide_price: false,
        attributes: [
          { name: 'Thương hiệu', value: 'Pentair USA' },
          { name: 'Bảo hành', value: '5 năm chính hãng' },
          { name: 'Vị trí lắp đặt', value: 'Đầu nguồn biệt thự' }
        ],
        specs: [
          { name: 'Công suất lọc tối đa', value: '3.5 m3/giao' },
          { name: 'Khả năng làm mềm', value: 'Canxi cứng' },
          { name: 'Xuất xứ', value: 'USA' }
        ],
        features: [
          'Tự động sục rửa'
        ],
        scenes: [
          'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=400&q=80'
        ]
      } : {},
      terms: []
    });
    setEditingPostId(null);
    setIsCreatingNew(true);
  };

  const handleSavePostForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const method = isCreatingNew ? 'POST' : 'PUT';
      const endpoint = isCreatingNew ? '/api/posts' : `/api/posts/${editingPostId}`;
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(postForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lưu bài đăng thất bại.');
      }

      await onRefreshData();
      setIsCreatingNew(false);
      setEditingPostId(null);
      triggerToast("Lưu bản ghi thành công trên máy chủ Pentair.");
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const insertFormatting = (type: 'h2' | 'h3' | 'bullet' | 'image' | 'bold') => {
    const textarea = document.getElementById('form-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = postForm.content || '';
    const selectedText = currentText.substring(startPos, endPos);

    let insertText = '';
    if (type === 'h2') {
      const headingText = selectedText || 'Tiêu đề đề tài';
      insertText = `\n\n## ${headingText}\n`;
    } else if (type === 'h3') {
      const headingText = selectedText || 'Tiêu đề phụ';
      insertText = `\n\n### ${headingText}\n`;
    } else if (type === 'bullet') {
      const listText = selectedText || 'Nội dung dòng danh sách';
      insertText = `\n- ${listText}\n`;
    } else if (type === 'image') {
      const imageUrl = prompt('Nhập địa chỉ liên kết (URL) của hình ảnh:', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80');
      if (imageUrl === null) return; // cancelled
      const altText = prompt('Nhập chú thích miêu tả ảnh:', 'Mô tả hình ảnh Pentair');
      insertText = `\n\n![${altText || 'hình ảnh'}](${imageUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80'})\n\n`;
    } else if (type === 'bold') {
      const boldText = selectedText || 'chữ in đậm';
      insertText = `**${boldText}**`;
    }

    const updatedText = currentText.substring(0, startPos) + insertText + currentText.substring(endPos);
    setPostForm({ ...postForm, content: updatedText });

    // Refocus & set selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + insertText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Bạn có tin chắc loại bỏ hoàn toàn nội dung này không?")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      if (!res.ok) throw new Error("Chỉ quản trị viên mới có thể xoá dữ liệu.");
      await onRefreshData();
      triggerToast("Xoá dữ liệu an toàn thành công.");
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  // SAVE CORE CONFIGS
  const handleSaveAllConfigs = async () => {
    setActionLoading(true);
    try {
      const payload = [
        { id: "opt-brand", optionName: "brand_settings", optionValue: brandForm },
        { id: "opt-seo", optionName: "seo_settings", optionValue: seoForm },
        { id: "opt-showrooms", optionName: "showrooms", optionValue: showroomList }
      ];

      const res = await fetch('/api/options', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Sự cố lưu cài đặt hệ thống. Kiểm tra quyền Administrator.");
      await onRefreshData();
      triggerToast("Đã đồng bộ hoá cài đặt Brand & SEO lên sitemap.xml.");
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // LEAD INTAKES CONTROL
  const handleToggleSubStatus = async (id: string, status: 'read' | 'unread' | 'archived') => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Không thể chuyển tiếp trạng thái tin nhắn.");
      await onRefreshData();
      triggerToast("Đã thay đổi trạng thái xử lý hội thoại.");
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  // 2FA CONFIG CONTROLLER
  const handleToggleTwoFactor = async (nextState: boolean) => {
    try {
      const res = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({ enabled: nextState })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sự cố kích hoạt bảo mật.");
      await onRefreshData();
      triggerToast(nextState ? `Kích hoạt 2FA thành công! Token xác thực: ${data.secret || '123456'}` : "Tắt mã xác thực 2FA thành công.");
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  // BACKUP CODE ENGINE IMPORT/EXPORT
  const handleExportJson = () => {
    const backupObj = {
      posts,
      terms,
      options,
      submissions,
      exportedAt: new Date().toISOString()
    };
    const str = JSON.stringify(backupObj, null, 2);
    setBackupJsonText(str);
    
    // Auto download support
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pentair_wordpress_backup_${Date.now()}.json`;
    a.click();
    triggerToast("Backup JSON đã tải xuống và hiển thị trong khung sao chép.");
  };

  const handleImportJson = async () => {
    if (!backupJsonText) {
      triggerToast("Vui lòng gắn chuỗi JSON khôi phục vào ô trống.", true);
      return;
    }
    if (!window.confirm("Thao tác này sẽ ghi đè toàn bộ dữ liệu CMS hiện tại. Bạn có chắn chắn muốn tiếp tục?")) return;
    
    setActionLoading(true);
    try {
      const parsed = JSON.parse(backupJsonText);
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nhập bản ghi backup thất bại.");
      
      await onRefreshData();
      triggerToast("Nhập dữ liệu và build lại Sitemap thành công tuyệt hảo.");
      setBackupJsonText('');
    } catch (err: any) {
      triggerToast("Lỗi định dạng dữ liệu: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // ----------------------------------------------------
  // RENDER GATE: LOGIN REQUIRED
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans" id="admin-login-screen">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585837575652-267c0ee1228b?auto=format&fit=crop&w=1200&q=80')" }} />
        
        <div className="relative z-10 max-w-md w-full bg-slate-800/80 backdrop-blur rounded-2xl p-8 border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-600 shadow-md shadow-blue-500/10 rounded-xl flex items-center justify-center font-black text-2xl mx-auto">
              P
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wider text-blue-400">Pentair Việt Nam Custom CMS</h3>
            <p className="text-xs text-slate-400">Hệ thống quản trị nội dung tương đương WordPress Core</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Tên đăng nhập / Email *</label>
              <input 
                type="text" 
                required
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 text-white text-xs rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                id="login-username"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Mật khẩu truy cập *</label>
              <input 
                type="password" 
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 text-white text-xs rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium animate-fadeIn"
                id="login-pass"
              />
            </div>

            {require2FA && (
              <div className="space-y-1 p-3 bg-blue-950/50 rounded-lg border border-blue-500/20">
                <label className="text-[10px] font-black text-blue-400 uppercase block tracking-wider mb-1">Mã xác minh 2FA bảo mật *</label>
                <input 
                  type="text" 
                  maxLength={6}
                  required
                  placeholder="Nhập 123456 để vượt qua test"
                  value={twoFactorCode}
                  onChange={e => setTwoFactorCode(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-blue-500/40 text-blue-300 font-mono text-center tracking-widest font-black rounded text-sm"
                  id="login-2fa"
                />
              </div>
            )}

            {loginError && (
              <p className="text-xs text-rose-400 bg-rose-950/30 p-2.5 rounded border border-rose-950 flex gap-1 items-center font-sans leading-none">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                {loginError}
              </p>
            )}

            <button 
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-500 transition-all font-sans cursor-pointer tracking-wider"
              id="btn-admin-login-submit"
            >
              {loginLoading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
            </button>
          </form>

          {/* Quick instructions so users can prototype easily */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-2 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300 block uppercase border-b border-white/5 pb-1">Tài khoản thử nghiệm nhanh:</span>
            <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded">
              <span>Admin: <strong>admin</strong> / <strong>admin123</strong></span>
              <span className="bg-emerald-600 text-white text-[9px] px-1 rounded font-bold font-mono">Role Admin</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded">
              <span>Editor: <strong>editor</strong> / <strong>editor123</strong></span>
              <span className="bg-blue-600 text-white text-[9px] px-1 rounded font-bold font-mono">Role Editor</span>
            </div>
            <div className="text-[10px] text-yellow-300 flex items-start gap-1 justify-center italic pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Cài đặt an toàn 2FA, token kiểm soát SQL & XSS.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GIAO DIỆN CMS CHÍNH (ĐÃ ĐĂNG NHẬP THÀNH CÔNG)
  // ----------------------------------------------------
  const typedPosts = posts.filter(p => p.type === (activeTab === 'posts' ? 'post' : activeTab === 'pages' ? 'page' : 'product'));
  const filteredPostsList = typedPosts.filter(p => {
    if (!postSearchQuery) return true;
    const q = postSearchQuery.toLowerCase().trim();
    const matchTitle = (p.title || '').toLowerCase().includes(q);
    const matchSlug = (p.slug || '').toLowerCase().includes(q);
    const matchId = (p.id || '').toLowerCase().includes(q);
    const matchTerm = p.terms && p.terms.some(t => (t.name || '').toLowerCase().includes(q));
    const matchContent = (p.content || '').toLowerCase().includes(q);
    return matchTitle || matchSlug || matchId || matchTerm || matchContent;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex text-gray-800 font-sans" id="cms-authorized-wrapper">
      
      {/* Toast feedback alerts */}
      {actionStatus.success && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-sm animate-slideUp">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">{actionStatus.success}</span>
        </div>
      )}
      {actionStatus.error && (
        <div className="fixed bottom-4 right-4 z-50 bg-rose-900 border border-rose-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-sm animate-slideUp">
          <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">{actionStatus.error}</span>
        </div>
      )}

      {/* LEFT NAVIGATION DRAWER (WP Style Menu sidebar) */}
      <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col justify-between border-r border-slate-800" id="cms-sidebar">
        <div>
          {/* Header */}
          <div className="p-4 bg-slate-950 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              P
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">{brandForm.siteName}</h4>
              <span className="text-[10px] text-blue-400 lowercase font-mono">WordPress Engine emulator</span>
            </div>
          </div>

          {/* User info Card */}
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 font-black text-white flex items-center justify-center uppercase border border-slate-600">
              {currentUser.username[0]}
            </div>
            <div>
              <span className="text-xs font-bold text-white block truncate max-w-[140px]">{currentUser.username}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block mt-0.5">{currentUser.role}</span>
            </div>
          </div>

          {/* Main List */}
          <nav className="p-3 space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsCreatingNew(false); setEditingPostId(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Bảng Tổng Quan
            </button>
            
            <div className="space-y-1" id="posts-nav-group">
              <button 
                onClick={() => { setActiveTab('posts'); setIsCreatingNew(false); setEditingPostId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${(activeTab === 'posts' || activeTab === 'categories') ? 'bg-slate-800/80 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`w-4 h-4 ${(activeTab === 'posts' || activeTab === 'categories') ? 'text-blue-400' : ''}`} />
                  <span>Quản Trị Bài Viết</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${(activeTab === 'posts' || activeTab === 'categories') ? 'rotate-180 text-blue-400' : 'text-slate-500'}`} />
              </button>

              {/* Sub-menu features */}
              {(activeTab === 'posts' || activeTab === 'categories') && (
                <div className="pl-5 pr-1 py-1 space-y-1 bg-slate-950/40 rounded-lg border border-slate-800/40 text-left">
                  <button
                    onClick={() => { setActiveTab('posts'); setIsCreatingNew(false); setEditingPostId(null); }}
                    className={`w-full flex items-center gap-2.5 py-1.5 px-2 text-[11px] font-semibold rounded-md cursor-pointer transition-all ${activeTab === 'posts' ? 'text-blue-400 bg-blue-950/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'posts' ? 'bg-blue-400' : 'bg-slate-650'}`}></span>
                    Tất cả bài viết
                  </button>
                  <button
                    onClick={() => { setActiveTab('categories'); setIsCreatingNew(false); setEditingPostId(null); }}
                    className={`w-full flex items-center gap-2.5 py-1.5 px-2 text-[11px] font-semibold rounded-md cursor-pointer transition-all ${activeTab === 'categories' ? 'text-blue-400 bg-blue-950/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'categories' ? 'bg-blue-400' : 'bg-slate-650'}`}></span>
                    Quản lý danh mục
                  </button>
                </div>
              )}
            </div>

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => { setActiveTab('pages'); setIsCreatingNew(false); setEditingPostId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'pages' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <FileCode className="w-4 h-4" />
                Hệ Thống Trang (Pages)
              </button>
            )}

            <button 
              onClick={() => { setActiveTab('products'); setIsCreatingNew(false); setEditingPostId(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Quản Trị Sản Phẩm
            </button>

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => { setActiveTab('submissions'); setIsCreatingNew(false); setEditingPostId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all relative ${activeTab === 'submissions' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <MessageSquare className="w-4 h-4" />
                Khách Đăng_Ký (Leads)
                {submissions.filter(s => s.status === 'unread').length > 0 && (
                  <span className="absolute right-3 top-2 bg-rose-500 text-white text-[9px] font-sans font-black px-1.5 py-0.5 rounded-full">
                    {submissions.filter(s => s.status === 'unread').length} New
                  </span>
                )}
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => { setActiveTab('settings'); setIsCreatingNew(false); setEditingPostId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Settings2 className="w-4 h-4" />
                SEO & Brand Cấu Hình
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => { setActiveTab('security'); setIsCreatingNew(false); setEditingPostId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <KeyRound className="w-4 h-4" />
                User & 2FA Trung Tâm
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => { setActiveTab('email-settings'); setIsCreatingNew(false); setEditingPostId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'email-settings' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Mail className="w-4 h-4" />
                Cấu hình thông báo Email
              </button>
            )}

            <button 
              onClick={() => { setActiveTab('videos'); setIsCreatingNew(false); setEditingPostId(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'videos' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Video className="w-4 h-4" />
              Quản trị Playlist Video
            </button>

            <button 
              onClick={() => { setActiveTab('perspectives'); setIsCreatingNew(false); setEditingPostId(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'perspectives' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <LayoutTemplate className="w-4 h-4" />
              Phối cảnh Không gian
            </button>

            <button 
              onClick={() => { setActiveTab('media'); setIsCreatingNew(false); setEditingPostId(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'media' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Image className="w-4 h-4 text-sky-400" />
              Kho Thư Viện Ảnh (Media)
            </button>

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => { setActiveTab('backup'); setIsCreatingNew(false); setEditingPostId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'backup' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Database className="w-4 h-4" />
                Xuất/Nhập Sao Lưu CMS
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => { setActiveTab('supabase'); setIsCreatingNew(false); setEditingPostId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'supabase' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Server className="w-4 h-4 text-emerald-400 animate-pulse" />
                Tích hợp Supabase
              </button>
            )}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full py-2 bg-rose-900/30 text-rose-300 hover:bg-rose-900/50 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất Admin
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-grow p-8 overflow-y-auto max-h-screen" id="cms-canvas">
        
        {/* UPPER HEADING STATUS STRIP */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-200 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Hệ Thống CMS Pentair</h1>
            <p className="text-xs text-gray-500 font-sans">
              Tính năng mô phỏng: <strong className="text-pentair font-bold">{activeTab.toUpperCase()} PANEL</strong> | Quyền: <strong className="uppercase text-emerald-600">{currentUser.role}</strong>
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onRefreshData}
              className="px-3.5 py-1.5 text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
              title="Lấy dữ liệu mới nhất từ node server"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Thống kê Live
            </button>
            <a 
              href="/" 
              target="_blank" 
              className="px-3.5 py-1.5 text-xs font-black uppercase text-white bg-pentair hover:bg-pentair-light rounded-lg shadow transition-all cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Ghé thăm Website
            </a>
          </div>
        </div>

        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL 1: DASHBOARD
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn" id="panel-dashboard">
            {/* Widget figures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Bài Đăng Tin Tức</span>
                  <strong className="text-xl font-black text-gray-900">{posts.filter(p => p.type === 'post').length} Bài</strong>
                  <span className="text-[10px] text-emerald-500 tracking-wide block font-sans">Sitemap.xml Auto-Sync</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Thiết Bị Lọc Nước</span>
                  <strong className="text-xl font-black text-gray-900">{posts.filter(p => p.type === 'product').length} Sản Phẩm</strong>
                  <span className="text-[10px] text-emerald-500 tracking-wide block">thegioiloctong Specs</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Yêu Cầu Từ Khách</span>
                  <strong className="text-xl font-black text-gray-900">{submissions.length} Leads</strong>
                  {submissions.filter(s => s.status === 'unread').length > 0 ? (
                    <span className="text-[10px] text-rose-500 font-bold tracking-wide block animate-pulse">
                      • {submissions.filter(s => s.status === 'unread').length} đơn chưa đọc
                    </span>
                  ) : <span className="text-[10px] text-gray-400 tracking-wide block">Đã xử lý gọn gàng</span>}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Hệ Thống Security</span>
                  <strong className="text-sm font-black text-slate-800 tracking-tight block">XSS/CSRF Proof</strong>
                  <span className="text-[10px] text-slate-500 tracking-wide block">
                    {currentUser.role === 'administrator' ? 'Quyền cao nhất' : 'Biên tập viên'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual SVG metrics analytical block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Biểu đồ xu hướng nhận yêu cầu lọc tổng (Submissions)</h3>
                <p className="text-xs text-gray-500 font-sans mt-0.5">Thống kê lưu lượng data leads đổ về Văn Phòng 90 Đinh Thị Thi theo tuần.</p>
              </div>
              
              {/* Clean decorative SVG chart for supreme layout elegance */}
              <div className="h-44 flex items-end gap-6 pt-6 px-4 bg-slate-50/50 rounded-xl relative border border-gray-50">
                <div className="absolute inset-x-0 bottom-1/2 border-t border-dashed border-gray-200" />
                <div className="absolute inset-x-0 bottom-1/4 border-t border-dashed border-gray-200" />
                <div className="absolute inset-x-0 bottom-3/4 border-t border-dashed border-gray-200" />
                
                {/* Visual Bars with different heights representing weeks */}
                {[
                  { label: "Tuần 1", count: 8, pct: "w-10 h-16 bg-blue-600 hover:bg-blue-700" },
                  { label: "Tuần 2", count: 14, pct: "w-10 h-24 bg-blue-600 hover:bg-blue-700" },
                  { label: "Tuần 3", count: 20, pct: "w-10 h-32 bg-blue-600 hover:bg-blue-700 animate-pulse" },
                  { label: "Tuần 4", count: 12, pct: "w-10 h-20 bg-blue-600 hover:bg-blue-700" },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group z-10">
                    <span className="text-[10px] text-slate-600 font-black opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-1.5 py-0.5 rounded">
                      {bar.count} leads
                    </span>
                    <div className={`${bar.pct} rounded-t-md transition-all duration-500 shadow-lg`} />
                    <span className="text-[10px] font-bold text-gray-500 font-mono">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Draft info & WP Activity log block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity feeds */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase text-gray-900 border-b pb-2">Hồi âm gần đây của khách từ website</h3>
                <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                  {submissions.slice(0, 4).map((sub, i) => (
                    <div key={i} className="py-3 flex justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-900 block">{sub.name} ({sub.phone})</span>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-sm font-sans line-clamp-1">{sub.message}</p>
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded h-fit ${sub.status === 'unread' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-500'}`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                  {submissions.length === 0 && (
                    <p className="text-xs text-center py-6 text-gray-400">Không có đơn đăng ký liên hệ nào.</p>
                  )}
                </div>
              </div>

              {/* Server Diagnostics & Status info */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase text-gray-900 border-b pb-2">Trạng thái kỹ thuật & Sơ đồ SEO</h3>
                <div className="space-y-3 text-xs text-gray-600">
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span>Sitemap.xml Status</span>
                    <span className="text-emerald-600 font-black flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Dynamic Serving
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span>File Config</span>
                    <span className="font-mono text-gray-800 text-[10px] font-bold">/data/db.json dynamic cache</span>
                  </div>
                  <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-50 space-y-1">
                    <strong className="block text-[11px] uppercase text-pentair">Ghi chú SEO canonical URL</strong>
                    <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                      Sơ đồ Sitemap.xml tự động lập chỉ mục (index) các trang, bài báo hay thông số Pentair Maxi/Midi đồng bộ tới công cụ tìm kiếm Google khi bạn publish nội dung bất kỳ.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL 1.5: CATEGORIES & TAXNOMIES (Custom category directory)
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn" id="panel-category-management">
            
            {/* Header section with Stats Card */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                  Quản Lý Toàn Diện Danh Mục & Phân Loại
                </h3>
                <p className="text-xs text-gray-400 font-sans mt-0.5">
                  Tùy biến cấu trúc sơ đồ danh mục của từng bài viết, tin tức Pentair và sản phẩm lọc nước
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-sans">Tổng các phân loại hoạt động:</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-lg">
                  {terms.length} danh mục
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT SIDE: CREATION / EDITING FORM + INSTRUCTIONS */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <div className="border-b pb-3">
                  <h4 className="text-xs font-black uppercase text-[#0C3471]">
                    {editingTermId ? '⚡ Cập nhật danh mục' : '➕ Thêm danh mục mới'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-sans mt-1">
                    Điền thông số để kiến tạo một luồng phân loại lưu trữ bài viết hoặc thiết bị.
                  </p>
                </div>

                <form onSubmit={handleSaveTerms} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Tên danh mục *
                    </label>
                    <input 
                      type="text"
                      required
                      value={termForm.name}
                      onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                      placeholder="Ví dụ: Lọc nước biệt thự, Tin tức Pentair"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-150 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white bg-slate-50/50 text-gray-800 placeholder-gray-400 font-sans transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Đường dẫn Slug (Tùy chọn)
                    </label>
                    <input 
                      type="text"
                      value={termForm.slug}
                      onChange={(e) => setTermForm({ ...termForm, slug: e.target.value })}
                      placeholder="he-thong-loc-villa (Tự sinh nếu để trống)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-150 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white bg-slate-50/50 text-gray-800 placeholder-gray-400 font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Kiểu phân loại (Taxonomy) *
                    </label>
                    <select
                      value={termForm.taxonomy}
                      onChange={(e) => setTermForm({ ...termForm, taxonomy: e.target.value as 'category' | 'product_cat' })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-150 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-850 font-sans transition-all"
                    >
                      <option value="category">Bài viết blog / Tin tức (category)</option>
                      <option value="product_cat">Dòng sản phẩm lọc nước (product_cat)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Trạng thái hiển thị *
                    </label>
                    <select
                      value={termForm.status || 'publish'}
                      onChange={(e) => setTermForm({ ...termForm, status: e.target.value as 'publish' | 'hidden' })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-150 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-850 font-sans transition-all"
                    >
                      <option value="publish">Hiển thị công khai (Publish)</option>
                      <option value="hidden">Ẩn danh mục (Hidden)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 text-xs font-black uppercase tracking-wider text-white bg-[#0C3471] hover:bg-[#0C3471]/90 rounded-xl cursor-pointer transition-colors"
                    >
                      {editingTermId ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                    {editingTermId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTermId(null);
                          setTermForm({ name: '', slug: '', taxonomy: 'category', status: 'publish' });
                        }}
                        className="px-3 py-2 text-xs font-bold uppercase rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-655 transition-colors cursor-pointer"
                      >
                        Huỷ
                      </button>
                    )}
                  </div>
                </form>

                <div className="pt-4 border-t border-dashed mt-4 text-[11px] text-gray-400 font-sans leading-relaxed space-y-1.5">
                  <span className="font-bold text-slate-700 block">💡 Ghi chú hướng dẫn quản lý:</span>
                  <p>• Các danh mục có trạng thái <strong>"Ẩn"</strong> sẽ tạm ngưng xuất hiện tại bộ lọc danh mục của người dùng trên trang chủ và trang chi tiết sản phẩm.</p>
                  <p>• Xoá danh mục sẽ <strong>gỡ liên kết</strong> tất cả các bài viết hiện tại ra khỏi danh mục này một cách an toàn mà không xoá bản thân bài viết.</p>
                </div>
              </div>

              {/* RIGHT SIDE: DIRECTORY TABLE & DETAIL VIEW INSPECTOR */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Main Directory Listing of Categories */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800">
                      Sơ đồ danh mục hiện có
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-gray-100 text-gray-400 text-[10px] uppercase font-black tracking-wider">
                          <th className="p-4 pl-6">Mã ID</th>
                          <th className="p-4">Tên chuyên mục</th>
                          <th className="p-4">Dạng đối tượng</th>
                          <th className="p-4 text-center">Trạng thái</th>
                          <th className="p-4 text-center">Số bài viết</th>
                          <th className="p-4 pr-6 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs text-slate-800">
                        {terms.map((term) => {
                          const associatedCount = posts.filter(p => p.terms?.some(t => t.id === term.id)).length;
                          const isInspecting = selectedInspectTermId === term.id;
                          return (
                            <tr 
                              key={term.id} 
                              className={`hover:bg-slate-50/50 transition-all cursor-pointer ${isInspecting ? 'bg-blue-50/30 font-semibold' : ''}`}
                              onClick={() => setSelectedInspectTermId(term.id)}
                            >
                              <td className="p-4 pl-6 font-mono text-[10px] text-gray-400">
                                {term.id.replace('term-', '')}
                              </td>
                              <td className="p-4">
                                <span className="text-slate-900 font-bold block">{term.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono block">/{term.slug}</span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${term.taxonomy === 'product_cat' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                  {term.taxonomy === 'product_cat' ? 'Sản Phẩm' : 'Tin tức/Blog'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTermStatus(term);
                                  }}
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase select-none transition-colors border cursor-pointer ${
                                    term.status === 'hidden'
                                      ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title="Bấm để chuyển trạng thái Ẩn/Hiện"
                                >
                                  {term.status === 'hidden' ? 'Ẩn (Hidden)' : 'Công khai'}
                                </button>
                              </td>
                              <td className="p-4 text-center font-bold font-mono">
                                {associatedCount}
                              </td>
                              <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedInspectTermId(term.id)}
                                    className="p-1 px-2.5 text-xs text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border transition-all"
                                    title="Xem chi tiết danh mục"
                                  >
                                    Xem
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingTermId(term.id);
                                      setTermForm({
                                        name: term.name,
                                        slug: term.slug,
                                        taxonomy: term.taxonomy,
                                        status: term.status || 'publish'
                                      });
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Chỉnh sửa danh mục"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTerm(term.id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                                    title="Xoá danh mục"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {terms.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-gray-400 italic">
                              Chưa có danh mục nào được khởi tạo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Detail Viewer: Associated Posts/Products Inspector inside Category */}
                {selectedInspectTermId && (() => {
                  const currentTerm = terms.find(t => t.id === selectedInspectTermId);
                  if (!currentTerm) return null;
                  const associatedPosts = posts.filter(p => p.terms?.some(t => t.id === currentTerm.id));
                  return (
                    <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4 animate-slideUp">
                      <div className="flex justify-between items-center border-b pb-3.5">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-black text-blue-600 tracking-wider">Bộ duyệt chi tiết thuộc danh mục</span>
                          <h4 className="text-sm font-black uppercase text-slate-800">
                            📂 {currentTerm.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => setSelectedInspectTermId(null)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-700 bg-slate-50 px-3 py-1.5 rounded-xl border cursor-pointer"
                        >
                          Đóng bộ duyệt ✕
                        </button>
                      </div>

                      <div className="space-y-3">
                        {associatedPosts.length === 0 ? (
                          <div className="py-8 text-center text-xs text-gray-400 italic border-2 border-dashed border-gray-100 rounded-xl">
                            Không tìm thấy bài viết hoặc sản phẩm nào thuộc danh mục này.
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-150 max-h-96 overflow-y-auto">
                            {associatedPosts.map((post) => (
                              <div key={post.id} className="py-3 flex justify-between items-center gap-4 hover:bg-slate-50/30 px-1 rounded-lg">
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-slate-900 block line-clamp-1">
                                    {post.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                                    <span>#{post.id.replace('post-', '')}</span>
                                    <span>•</span>
                                    <span className="uppercase text-slate-500 font-bold">{post.type === 'product' ? 'Sản phẩm lọc' : 'Bài viết blog'}</span>
                                    <span>•</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${post.status === 'publish' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {post.status}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemovePostFromTerm(post.id, currentTerm.id)}
                                  className="px-3 py-1.5 text-[10px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl transition-all flex items-center gap-1 cursor-pointer select-none"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Xoá khỏi danh mục
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>

          </div>
        )}

        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL 2: POSTS & PAGES & PRODUCTS (WP loop table + CRUD forms)
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {(activeTab === 'posts' || activeTab === 'pages' || activeTab === 'products') && (
          <div className="space-y-6 animate-fadeIn" id="panel-content-management">
            
            {/* If we are NOT in editing mode and NOT creating new: Show loop table */}
            {!editingPostId && !isCreatingNew ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">
                      {activeTab === 'posts' ? 'Danh Sách Bài Viết Blog' : activeTab === 'pages' ? 'Quản Lý Sơ Đồ Trang (Pages)' : 'Kho Thiết Bị Lọc Nước'}
                    </h3>
                    <p className="text-xs text-gray-400">Giao diện quản lý chuẩn dạng bảng phong cách WordPress</p>
                  </div>
                  
                  <button
                    onClick={() => triggerCreateNewPost(activeTab === 'pages' ? 'page' : activeTab === 'products' ? 'product' : 'post')}
                    className="px-4 py-2 text-xs font-black uppercase text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow transition-all cursor-pointer flex items-center gap-1 leading-none"
                    id="btn-create-post"
                  >
                    <Plus className="w-4 h-4" /> Thêm {activeTab === 'pages' ? 'Trang' : activeTab === 'products' ? 'Sản Phẩm' : 'Bài Viết'}
                  </button>
                </div>

                {/* THANH TÌM KIẾM BÀI VIẾT CAO CẤP */}
                <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder={`Tìm kiếm theo tiêu đề, đường dẫn slug, ID hoặc phân loại...`}
                      value={postSearchQuery}
                      onChange={(e) => setPostSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 focus:bg-white placeholder-gray-400 transition-all font-sans"
                    />
                    {postSearchQuery && (
                      <button
                        onClick={() => setPostSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {postSearchQuery && (
                    <div className="text-[11px] text-gray-500 font-sans">
                      Tìm thấy <strong className="text-blue-600 font-bold">{filteredPostsList.length}</strong> kết quả phù hợp.
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-gray-400 tracking-wider uppercase border-b border-gray-100 font-sans">
                        <th className="p-4 pl-6">ID</th>
                        <th className="p-4">Tiêu đề - Đường dẫn</th>
                        <th className="p-4">Phân loại</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Thứ tự</th>
                        <th className="p-4 pr-6 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {filteredPostsList.map((post) => (
                        <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 pl-6 font-mono text-gray-400 text-[10px]">{post.id.replace('post-', '')}</td>
                          <td className="p-4 max-w-sm">
                            <strong className="text-gray-900 block text-xs truncate font-bold">{post.title}</strong>
                            <span className="text-[10px] text-blue-500 font-mono block mt-0.5">/{post.slug}</span>
                          </td>
                          <td className="p-4">
                            {post.terms && post.terms.length > 0 ? (
                              <span className="bg-blue-50 text-pentair px-2 py-0.5 rounded border text-[10px] font-semibold">
                                {post.terms?.[0]?.name}
                              </span>
                            ) : <span className="text-[10px] text-gray-400 italic">Không phân loại</span>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded inline-block text-[10px] font-bold uppercase tracking-wider ${
                              post.status === 'publish' || post.status === 'published' || post.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                : post.status === 'draft'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                  : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                              {post.status === 'publish' || post.status === 'published' || post.status === 'active'
                                ? 'Xuất bản' 
                                : post.status === 'draft'
                                  ? 'Bản nháp'
                                  : 'Ẩn'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-gray-500 font-medium">{post.menuOrder}</td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex justify-end gap-2.5">
                              <button 
                                onClick={() => triggerEditPost(post)}
                                className="p-1 px-2 text-[10px] font-bold text-blue-500 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-all cursor-pointer flex items-center gap-1"
                                id={`btn-edit-post-${post.id}`}
                              >
                                <Pencil className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="p-1 px-2 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-all cursor-pointer flex items-center gap-1"
                                id={`btn-delete-post-${post.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xoá
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPostsList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-gray-400 italic font-sans leading-relaxed">
                            {postSearchQuery 
                              ? 'Không tìm thấy kết quả phù hợp với từ khoá tìm kiếm.' 
                              : 'Chưa có nội dung bản ghi nào tồn tại. Nhấn thêm mới để khởi tạo.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              
              /* CRUD FORM FOR INDIVIDUAL RECORD EDITING */
              <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden animate-fadeIn space-y-6">
                
                {/* Form header */}
                <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center px-6">
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                      {isCreatingNew ? 'Khởi Tạo Nội Dung Bản Ghi Mới' : 'Hiệu Chỉnh Khung Bài Đăng'}
                    </h3>
                    <p className="text-xs text-gray-400 font-sans">Kiến trúc các trường tùy chỉnh, hỗ trợ nhập liệu thủ công chuẩn SEO.</p>
                  </div>
                  
                  <button 
                    onClick={() => { setIsCreatingNew(false); setEditingPostId(null); }}
                    className="px-3.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer border font-sans"
                  >
                    Quay lại bảng tin
                  </button>
                </div>

                <form onSubmit={handleSavePostForm} className="p-6 md:p-8 space-y-6">
                  
                  {/* Core post inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block uppercase">Tiêu đề vĩ mô *</label>
                      <input 
                        type="text" 
                        required
                        value={postForm.title}
                        onChange={e => {
                          const val = e.target.value;
                          setPostForm({ 
                            ...postForm, 
                            title: val,
                            slug: val.toString().toLowerCase()
                                    .normalize('NFD') // nfd-normalize
                                    .replace(/[\u0300-\u036f]/g, '') // remove accent
                                    .replace(/[^a-z0-9\s-]/g, '')
                                    .replace(/[\s_]+/g, '-') // replace space
                                    .replace(/^-+|-+$/g, '')
                          });
                        }}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none text-gray-800"
                        id="form-title"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block uppercase">Đường dẫn tĩnh (Slug URL) *</label>
                      <input 
                        type="text" 
                        required
                        value={postForm.slug}
                        onChange={e => setPostForm({ ...postForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none text-gray-800 font-mono"
                        id="form-slug"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block uppercase">Trạng thái công bố *</label>
                      <select
                        value={postForm.status}
                        onChange={e => setPostForm({ ...postForm, status: e.target.value as 'draft' | 'publish' | 'hidden' })}
                        className="w-full px-3 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none bg-white text-gray-800"
                        id="form-status"
                      >
                        <option value="publish">Đã xuất bản (Publish)</option>
                        <option value="draft">Bản nháp (Draft)</option>
                        <option value="hidden">Ẩn (Hidden)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block uppercase">Ảnh tiêu biểu (Featured Image URL)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={postForm.featuredImage}
                          onChange={e => setPostForm({ ...postForm, featuredImage: e.target.value })}
                          className="flex-grow px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none text-gray-800 font-mono"
                          id="form-featured-image"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveMediaSelector({ target: 'post_featured' })}
                          className="px-3 py-2 text-xs font-semibold bg-slate-900 border hover:bg-slate-800 text-white rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-sm font-sans"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Chọn từ kho ảnh
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block uppercase">Thứ tự ưu tiên menu</label>
                      <input 
                        type="number" 
                        value={postForm.menuOrder}
                        onChange={e => setPostForm({ ...postForm, menuOrder: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none text-gray-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* Taxonomy categoriser choose for SEO mapping */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block uppercase">Móc phân loại (Taxonomy category)</label>
                    <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl">
                      {terms.filter(t => t.taxonomy === (postForm.type === 'product' ? 'product_cat' : 'category')).map((cat) => {
                        const isChecked = postForm.terms?.some(t => t.id === cat.id);
                        return (
                          <label key={cat.id} className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                const currentTerms = postForm.terms || [];
                                const hasTerm = currentTerms.some(t => t.id === cat.id);
                                const newTerms = hasTerm 
                                  ? currentTerms.filter(t => t.id !== cat.id)
                                  : [...currentTerms, cat];
                                setPostForm({ ...postForm, terms: newTerms });
                              }}
                            />
                            {cat.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block uppercase">Mô tả tóm tắt ngắn (Excerpt)</label>
                    <input 
                      type="text" 
                      value={postForm.excerpt}
                      onChange={e => setPostForm({ ...postForm, excerpt: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block uppercase">Toàn văn nội dung chính *</label>
                    
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-gray-200 rounded-t-xl -mb-1 select-none">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest px-2 font-mono">Soạn thảo nhanh:</span>
                      <div className="h-4 w-px bg-gray-250"></div>
                      
                      <button
                        type="button"
                        onClick={() => insertFormatting('h2')}
                        className="px-2.5 py-1 text-[11px] font-black text-slate-700 bg-white hover:bg-slate-100 hover:text-blue-700 border border-gray-200 rounded shadow-xs cursor-pointer transition-all active:scale-95"
                        title="Thêm Tiêu đề lớn Heading 2 (##)"
                      >
                        H2
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting('h3')}
                        className="px-2.5 py-1 text-[11px] font-black text-slate-700 bg-white hover:bg-slate-100 hover:text-blue-700 border border-gray-200 rounded shadow-xs cursor-pointer transition-all active:scale-95"
                        title="Thêm Tiêu đề phụ Heading 3 (###)"
                      >
                        H3
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting('bullet')}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 hover:text-blue-700 border border-gray-200 rounded shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Thêm dòng danh sách mục tròn (Bullet)"
                      >
                        <span>•</span> <span className="text-[10px] font-medium font-sans">Bullets</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting('image')}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 hover:text-blue-700 border border-gray-200 rounded shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Chèn ảnh dạng liên kết (Image)"
                      >
                        <span>📷</span> <span className="text-[10px] font-medium font-sans">Thêm ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting('bold')}
                        className="px-2.5 py-1 text-[11px] font-black text-slate-700 bg-white hover:bg-slate-100 hover:text-blue-700 border border-gray-200 rounded shadow-xs cursor-pointer transition-all active:scale-95"
                        title="In đậm chữ đang chọn (**bold**)"
                      >
                        B
                      </button>

                      <span className="text-[9px] text-[#0C3471] bg-blue-50 px-2 py-0.5 rounded font-medium ml-auto hidden md:inline-block">
                        Hỗ trợ định dạng Markdown & Căn chỉnh ảnh 4K tự động
                      </span>
                    </div>

                    <textarea 
                      id="form-content-textarea"
                      rows={12}
                      required
                      value={postForm.content}
                      onChange={e => setPostForm({ ...postForm, content: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-b-lg border border-t-0 border-gray-200 focus:outline-none text-gray-800 font-sans leading-relaxed"
                      placeholder="Nhập nội dung bài đăng chuẩn chỉnh..."
                    />
                  </div>

                  {/* PRODUCT SCHEMA EXTRA BOX (If type === product) */}
                  {postForm.type === 'product' && (
                    <div className="bg-blue-50/20 p-6 rounded-2xl border border-blue-50 space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-wider text-pentair border-b pb-1.5 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        CẤU HÌNH THÔNG TIN THƯƠNG MẠI & KỸ THUẬT SẢN PHẨM
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-700 uppercase">Giá niêm yết (Hãng) *</label>
                            <span className="text-[9px] text-gray-500 font-medium font-mono">VND</span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Vd: 185000000"
                            value={postForm.meta?.regular_price || ''}
                            onChange={e => {
                              const rawVal = e.target.value.replace(/[^0-9]/g, '');
                              setPostForm({ 
                                ...postForm, 
                                meta: { 
                                  ...postForm.meta, 
                                  regular_price: rawVal,
                                  price: rawVal // keep legacy price in sync
                                } 
                              });
                            }}
                            className="w-full px-3 py-2 text-xs rounded bg-white border border-gray-200 focus:outline-none font-bold text-slate-800"
                          />
                          <p className="text-[9px] text-gray-400">
                            {postForm.meta?.regular_price ? Number(postForm.meta.regular_price).toLocaleString('vi-VN') + " đ" : "Chưa nhập số"}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-700 uppercase">Giá khuyến mãi (Bán lẻ)</label>
                            <span className="text-[9px] text-emerald-600 font-bold font-sans">Khu vực giảm giá</span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Vd: 165000000 (Để trống nếu không giảm)"
                            value={postForm.meta?.sale_price || ''}
                            onChange={e => {
                              const rawVal = e.target.value.replace(/[^0-9]/g, '');
                              setPostForm({ 
                                ...postForm, 
                                meta: { 
                                  ...postForm.meta, 
                                  sale_price: rawVal 
                                } 
                              });
                            }}
                            className="w-full px-3 py-2 text-xs rounded bg-white border border-gray-200 focus:outline-none font-bold text-rose-600"
                          />
                          <p className="text-[9px] text-gray-400">
                            {postForm.meta?.sale_price ? Number(postForm.meta.sale_price).toLocaleString('vi-VN') + " đ" : "Để trống sẽ hiển thị Giá Niêm Yết đầu"}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 block uppercase">Yêu cầu ẩn giá / Liên hệ</label>
                          <div className="flex items-center space-x-2 bg-white/70 p-2 rounded border border-gray-200 h-[38px]">
                            <input 
                              type="checkbox" 
                              id="chk-hide-price"
                              checked={postForm.meta?.hide_price === true || postForm.meta?.hide_price === 'true'}
                              onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, hide_price: e.target.checked } })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="chk-hide-price" className="text-[11px] font-semibold text-gray-700 cursor-pointer select-none">
                              Ẩn giá, hiển thị chữ "Liên hệ"
                            </label>
                          </div>
                          <p className="text-[9px] text-gray-400 font-sans">Phù hợp các nguồn nước cần khảo sát cấu hình thực tế.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-700 block uppercase">Ghi chú nguồn dữ liệu (Clone Source Note)</label>
                          <input 
                            type="text" 
                            placeholder="Vd: Nhập khẩu nguyên chiếc Pentair Mỹ chính hãng..."
                            value={postForm.meta?.cloneSource || ''}
                            onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, cloneSource: e.target.value } })}
                            className="w-full px-3 py-2 text-xs rounded bg-white border border-gray-200 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 1. THUỘC TÍNH SẢN PHẨM (attributes) */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-700 block">Thuộc Tính Sản Phẩm (Màu sắc, Bảo hành, Xuất xứ...)</span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentAttrs = postForm.meta?.attributes || [];
                              setPostForm({
                                ...postForm,
                                meta: {
                                  ...postForm.meta,
                                  attributes: [...currentAttrs, { name: '', value: '' }]
                                }
                              });
                            }}
                            className="px-2.5 py-1 text-[10px] font-black uppercase text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-transparent rounded-lg flex items-center gap-1 transition-all cursor-pointer font-sans leading-none"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm thuộc tính
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(postForm.meta?.attributes || []).map((attr: { name: string; value: string }, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-gray-100 shadow-xs">
                              <input 
                                type="text" 
                                value={attr.name} 
                                onChange={e => {
                                  const newAttrs = [...(postForm.meta?.attributes || [])];
                                  newAttrs[idx] = { ...newAttrs[idx], name: e.target.value };
                                  setPostForm({ ...postForm, meta: { ...postForm.meta, attributes: newAttrs } });
                                }}
                                className="w-5/12 p-2 text-xs rounded bg-slate-50 font-medium text-gray-800"
                                placeholder="Tên thuộc tính (Vd: Thương hiệu, Bảo hành...)" 
                              />
                              <input 
                                type="text" 
                                value={attr.value} 
                                onChange={e => {
                                  const newAttrs = [...(postForm.meta?.attributes || [])];
                                  newAttrs[idx] = { ...newAttrs[idx], value: e.target.value };
                                  setPostForm({ ...postForm, meta: { ...postForm.meta, attributes: newAttrs } });
                                }}
                                className="w-6/12 p-2 text-xs rounded bg-slate-50 font-medium text-gray-850"
                                placeholder="Giá trị (Vd: Pentair USA, 5 năm...)" 
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newAttrs = (postForm.meta?.attributes || []).filter((_: any, i: number) => i !== idx);
                                  setPostForm({ ...postForm, meta: { ...postForm.meta, attributes: newAttrs } });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer border border-transparent hover:border-red-100"
                                title="Xóa thuộc tính"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {(postForm.meta?.attributes || []).length === 0 && (
                            <p className="text-[11px] text-gray-405 italic font-sans text-center py-2 bg-slate-50/50 rounded-lg">Chưa thiết lập thuộc tính sản phẩm. Nhấn nút "Thêm thuộc tính" để bắt đầu.</p>
                          )}
                        </div>
                      </div>

                      {/* 2. THÔNG SỐ KỸ THUẬT (specs) */}
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-700 block">Thông Số Kỹ Thuật (specs)</span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentSpecs = postForm.meta?.specs || [];
                              setPostForm({
                                ...postForm,
                                meta: {
                                  ...postForm.meta,
                                  specs: [...currentSpecs, { name: '', value: '' }]
                                }
                              });
                            }}
                            className="px-2.5 py-1 text-[10px] font-black uppercase text-cyan-600 hover:text-white bg-cyan-50 hover:bg-cyan-600 border border-cyan-200 hover:border-transparent rounded-lg flex items-center gap-1 transition-all cursor-pointer font-sans leading-none"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm thông số mới
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(postForm.meta?.specs || []).map((sp: { name: string; value: string }, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-gray-100 shadow-xs">
                              <input 
                                type="text" 
                                value={sp.name} 
                                onChange={e => {
                                  const newSpecs = [...(postForm.meta?.specs || [])];
                                  newSpecs[idx] = { ...newSpecs[idx], name: e.target.value };
                                  setPostForm({ ...postForm, meta: { ...postForm.meta, specs: newSpecs } });
                                }}
                                className="w-5/12 p-2 text-xs rounded bg-slate-50 font-medium text-gray-800"
                                placeholder="Tên thông số (Vd: Công suất lọc, Điện áp...)" 
                              />
                              <input 
                                type="text" 
                                value={sp.value} 
                                onChange={e => {
                                  const newSpecs = [...(postForm.meta?.specs || [])];
                                  newSpecs[idx] = { ...newSpecs[idx], value: e.target.value };
                                  setPostForm({ ...postForm, meta: { ...postForm.meta, specs: newSpecs } });
                                }}
                                className="w-6/12 p-2 text-xs rounded bg-slate-50 font-medium text-gray-850"
                                placeholder="Giá trị cụ thể (Vd: 3.5 m3/giờ, 220V...)" 
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newSpecs = (postForm.meta?.specs || []).filter((_: any, i: number) => i !== idx);
                                  setPostForm({ ...postForm, meta: { ...postForm.meta, specs: newSpecs } });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer border border-transparent hover:border-red-100"
                                title="Xóa thông số"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {(postForm.meta?.specs || []).length === 0 && (
                            <p className="text-[11px] text-gray-405 italic font-sans text-center py-2 bg-slate-50/50 rounded-lg">Chưa thiết lập thông số kỹ thuật. Nhấn nút "Thêm thông số mới" để bắt đầu.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HOMEPAGE SCHEMA EXTRA BOX (If type === page && slug === trang-chu) */}
                  {postForm.type === 'page' && postForm.slug === 'trang-chu' && (
                    <div className="bg-amber-50/25 p-6 rounded-2xl border border-amber-200/50 space-y-6">
                      <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#062c63]">
                          Hệ thống quản lý nội dung trang chủ (CMS Pentair Home)
                        </h4>
                      </div>

                      {/* Presets - Media Library Quick Actions */}
                      <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-2 text-left">
                        <span className="text-[10px] font-bold uppercase text-slate-700 block">Thư Viện Ảnh Quick Copy (Media Library Presets)</span>
                        <p className="text-[10px] text-gray-400 font-sans">Click vào ảnh bất kỳ để tự động sao chép đường dẫn, dán vào các trường nhập nhanh chóng.</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 pt-1">
                          {[
                            { url: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=800&q=80", label: "Maxi" },
                            { url: "https://images.unsplash.com/photo-1585837575652-267c0ee1228b?auto=format&fit=crop&w=800&q=80", label: "Midi" },
                            { url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80", label: "Foleo" },
                            { url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80", label: "WaterTrust" },
                            { url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80", label: "Kitchen" },
                            { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", label: "Bathroom" },
                            { url: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80", label: "Plant" },
                            { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80", label: "Terrace" }
                          ].map((preset, pIdx) => (
                            <div 
                              key={pIdx} 
                              onClick={() => {
                                navigator.clipboard.writeText(preset.url);
                                alert(`Đã sao chép đường dẫn: ${preset.label} vào clipboard! Hãy dán vào trường mong muốn.`);
                              }}
                              className="aspect-square rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-amber-500 select-none relative group shadow-xs hover:shadow-md"
                              title={preset.label}
                            >
                              <img src={preset.url} className="w-full h-full object-cover pointer-events-none" alt="Preset" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                Copy URL
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Editorial Title and descriptions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">Tiêu đề Hero Banner (bannerTitle)</label>
                          <input 
                            type="text" 
                            value={postForm.meta?.bannerTitle || ''}
                            onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, bannerTitle: e.target.value } })}
                            className="w-full p-2.5 text-xs rounded border border-gray-205 bg-white text-gray-800 focus:outline-[#0C3471]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">Tiêu đề intro (introTitle)</label>
                          <input 
                            type="text" 
                            value={postForm.meta?.introTitle || ''}
                            onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, introTitle: e.target.value } })}
                            className="w-full p-2.5 text-xs rounded border border-gray-205 bg-white text-gray-800 focus:outline-[#0C3471]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">Mô tả ngắn Hero (bannerSubTitle)</label>
                        <textarea 
                          rows={2}
                          value={postForm.meta?.bannerSubTitle || ''}
                          onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, bannerSubTitle: e.target.value } })}
                          className="w-full p-2.5 text-xs rounded border border-gray-255 bg-white text-gray-800 resize-none focus:outline-[#0C3471]"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">Chi tiết giới thiệu (introBody)</label>
                        <textarea 
                          rows={3}
                          value={postForm.meta?.introBody || ''}
                          onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, introBody: e.target.value } })}
                          className="w-full p-2.5 text-xs rounded border border-gray-255 bg-white text-gray-800 resize-none font-sans leading-relaxed focus:outline-[#0C3471]"
                        />
                      </div>

                      {/* Section: Why Choose Us */}
                      <div className="bg-white p-5 rounded-xl border border-gray-200/60 space-y-4 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-[#0C3471] block uppercase font-mono">Tiêu đề lớn của Section \"Why Choose Us\"</label>
                          <input 
                            type="text"
                            value={postForm.meta?.whyChooseTitle || 'Vì sao nên chọn hệ thống lọc tổng Pentair?'}
                            onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, whyChooseTitle: e.target.value } })}
                            className="w-full p-2 text-xs border rounded-lg font-bold text-[#0C3471]"
                            placeholder="Tiêu đề section"
                          />
                        </div>

                        <span className="text-[10px] font-bold uppercase text-[#0C3471] block border-t pt-2">Sắp xếp & Quản lý lý do chọn Pentair (Tối đa 7 lý do)</span>
                        <div className="space-y-4">
                          {(postForm.meta?.whyChooseUs || []).map((reason: { title: string; desc: string }, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50/50 rounded-lg border border-gray-200 relative space-y-2 text-left">
                              <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-md select-none">
                                <span className="text-[9px] font-mono font-black text-[#0C3471]">Reason 0{idx + 1}</span>
                                <div className="flex gap-1 select-none">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      if (idx === 0) return;
                                      const newReasons = [...(postForm.meta?.whyChooseUs || [])];
                                      const temp = newReasons[idx];
                                      newReasons[idx] = newReasons[idx - 1];
                                      newReasons[idx - 1] = temp;
                                      setPostForm({ ...postForm, meta: { ...postForm.meta, whyChooseUs: newReasons } });
                                    }}
                                    className="p-1 px-1.5 text-[9px] bg-white border border-gray-200 rounded hover:bg-slate-100 font-bold cursor-pointer"
                                    disabled={idx === 0}
                                  >
                                    ↑ Lên
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newReasons = [...(postForm.meta?.whyChooseUs || [])];
                                      if (idx === newReasons.length - 1) return;
                                      const temp = newReasons[idx];
                                      newReasons[idx] = newReasons[idx + 1];
                                      newReasons[idx + 1] = temp;
                                      setPostForm({ ...postForm, meta: { ...postForm.meta, whyChooseUs: newReasons } });
                                    }}
                                    className="p-1 px-1.5 text-[9px] bg-white border border-gray-200 rounded hover:bg-slate-100 font-bold cursor-pointer"
                                    disabled={idx === (postForm.meta?.whyChooseUs || []).length - 1}
                                  >
                                    ↓ Xuống
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newReasons = (postForm.meta?.whyChooseUs || []).filter((_: any, i: number) => i !== idx);
                                      setPostForm({ ...postForm, meta: { ...postForm.meta, whyChooseUs: newReasons } });
                                    }}
                                    className="p-1 px-1.5 text-[9px] bg-rose-50 text-rose-600 border border-rose-100 rounded hover:bg-rose-100 font-bold cursor-pointer"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                              <input 
                                type="text"
                                value={reason.title}
                                onChange={e => {
                                  const newReasons = [...(postForm.meta?.whyChooseUs || [])];
                                  newReasons[idx].title = e.target.value;
                                  setPostForm({ ...postForm, meta: { ...postForm.meta, whyChooseUs: newReasons } });
                                }}
                                className="w-full p-2 text-xs bg-white border rounded font-semibold text-gray-800 focus:outline-[#0C3471]"
                                placeholder="Tiêu đề lý do"
                              />
                              <textarea 
                                value={reason.desc}
                                onChange={e => {
                                  const newReasons = [...(postForm.meta?.whyChooseUs || [])];
                                  newReasons[idx].desc = e.target.value;
                                  setPostForm({ ...postForm, meta: { ...postForm.meta, whyChooseUs: newReasons } });
                                }}
                                rows={2}
                                className="w-full p-2 text-xs bg-white border rounded resize-none text-gray-650 focus:outline-[#0C3471]"
                                placeholder="Mô tả lý do"
                              />
                            </div>
                          ))}
                          <button 
                            type="button"
                            onClick={() => {
                              const newReasons = [...(postForm.meta?.whyChooseUs || []), { title: 'Lý do mới', desc: 'Mô tả ngắn...' }];
                              setPostForm({ ...postForm, meta: { ...postForm.meta, whyChooseUs: newReasons } });
                            }}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-150 text-[#0C3471] text-xs font-bold rounded-lg border-2 border-dashed border-gray-250 cursor-pointer"
                          >
                            + Thêm Lý Do Chọn Pentair
                          </button>
                        </div>
                      </div>

                      {/* Section Video Product Customizer */}
                      <div className="bg-white p-5 rounded-xl border border-gray-200/60 space-y-4 text-left">
                        <span className="text-[10px] font-bold uppercase text-[#0C3471] block border-b pb-1">Quản lý Video trình chiếu (Độc lập)</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">Tiêu đề Section Video</label>
                            <input 
                              type="text" 
                              value={postForm.meta?.videoTitle || 'Trải nghiệm hệ thống lọc tổng Pentair qua video'}
                              onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, videoTitle: e.target.value } })}
                              className="w-full p-2 text-xs rounded border focus:outline-[#0C3471]"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">Mô tả bổ sung video</label>
                            <input 
                              type="text" 
                              value={postForm.meta?.videoSubtitle || ''}
                              onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, videoSubtitle: e.target.value } })}
                              className="w-full p-2 text-xs rounded border focus:outline-[#0C3471]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block text-left">Địa chỉ nhúng YouTube Link</label>
                            <input 
                              type="text" 
                              value={postForm.meta?.videoUrl || ''}
                              onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, videoUrl: e.target.value } })}
                              className="w-full p-2 text-xs rounded border text-blue-600 font-mono focus:outline-[#0C3471]"
                              placeholder="https://www.youtube.com/embed/S28s7-VWeis"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block text-left">Ảnh bìa video (Thumbnail Image URL)</label>
                            <input 
                              type="text" 
                              value={postForm.meta?.videoThumbnail || ''}
                              onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, videoThumbnail: e.target.value } })}
                              className="w-full p-2 text-xs rounded border font-mono focus:outline-[#0C3471]"
                              placeholder="Dán URL ảnh phối cảnh vào đây"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section Gallery Management */}
                      <div className="bg-white p-5 rounded-xl border border-gray-200/60 space-y-4 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block uppercase">Tiêu đề Section Gallery Phối Cảnh</label>
                            <input 
                              type="text" 
                              value={postForm.meta?.galleryTitle || 'Pentair trong không gian sống hiện đại'}
                              onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, galleryTitle: e.target.value } })}
                              className="w-full p-2 text-xs border rounded focus:outline-[#0C3471]"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block uppercase">Mô tả phụ cho Gallery</label>
                            <input 
                              type="text" 
                              value={postForm.meta?.gallerySubtitle || ''}
                              onChange={e => setPostForm({ ...postForm, meta: { ...postForm.meta, gallerySubtitle: e.target.value } })}
                              className="w-full p-2 text-xs border rounded focus:outline-[#0C3471]"
                            />
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase text-[#0C3471] block border-t pt-2 text-left">Sắp xếp & Quản lý gallery hình phối cảnh</span>
                        <div className="col-span-2 text-left space-y-4">
                          {(postForm.meta?.perspectives || []).map((url: string, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50/50 rounded-lg border border-gray-200 relative space-y-2 text-left">
                              <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-md select-none">
                                <span className="text-[9px] font-mono font-black text-[#0C3471]">Ảnh phối cảnh #0{idx + 1}</span>
                                <div className="flex gap-1 select-none">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      if (idx === 0) return;
                                      const newPers = [...(postForm.meta?.perspectives || [])];
                                      const temp = newPers[idx];
                                      newPers[idx] = newPers[idx - 1];
                                      newPers[idx - 1] = temp;
                                      setPostForm({ ...postForm, meta: { ...postForm.meta, perspectives: newPers } });
                                    }}
                                    className="p-1 px-1.5 text-[9px] bg-white border rounded hover:bg-slate-100 font-bold cursor-pointer"
                                    disabled={idx === 0}
                                  >
                                    ↑ Lên
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newPers = [...(postForm.meta?.perspectives || [])];
                                      if (idx === newPers.length - 1) return;
                                      const temp = newPers[idx];
                                      newPers[idx] = newPers[idx + 1];
                                      newPers[idx + 1] = temp;
                                      setPostForm({ ...postForm, meta: { ...postForm.meta, perspectives: newPers } });
                                    }}
                                    className="p-1 px-1.5 text-[9px] bg-white border rounded hover:bg-slate-100 font-bold cursor-pointer"
                                    disabled={idx === (postForm.meta?.perspectives || []).length - 1}
                                  >
                                    ↓ Xuống
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newPers = (postForm.meta?.perspectives || []).filter((_: any, i: number) => i !== idx);
                                      setPostForm({ ...postForm, meta: { ...postForm.meta, perspectives: newPers } });
                                    }}
                                    className="p-1 px-1.5 text-[9px] bg-rose-50 text-rose-600 border border-rose-100 rounded hover:bg-rose-100 font-bold cursor-pointer"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-3 items-center">
                                <input 
                                  type="text"
                                  value={url}
                                  onChange={e => {
                                    const newPers = [...(postForm.meta?.perspectives || [])];
                                    newPers[idx] = e.target.value;
                                    setPostForm({ ...postForm, meta: { ...postForm.meta, perspectives: newPers } });
                                  }}
                                  className="w-full p-2 text-xs bg-white border rounded font-mono focus:outline-[#0C3471]"
                                  placeholder="Đường dẫn ảnh phối cảnh"
                                />
                                <div className="w-10 h-10 border rounded overflow-hidden shrink-0 bg-slate-100 shadow-xs">
                                  {url ? (
                                    <img src={url} className="w-full h-full object-cover" alt="Preview Layout" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">Trống</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <button 
                            type="button"
                            onClick={() => {
                              const newPers = [...(postForm.meta?.perspectives || []), ''];
                              setPostForm({ ...postForm, meta: { ...postForm.meta, perspectives: newPers } });
                            }}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-150 text-[#0C3471] text-xs font-bold rounded-lg border-2 border-dashed border-gray-250 cursor-pointer"
                          >
                            + Thêm Hình Phối Cảnh Vào Slider/Grid
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex gap-4 border-t pt-5">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-pentair text-white font-bold text-xs uppercase rounded-lg shadow hover:bg-pentair-light transition-all flex items-center gap-1.5 cursor-pointer leading-none"
                      id="btn-save-post-submit"
                    >
                      <Save className="w-4 h-4" />
                      {actionLoading ? 'Đang gửi...' : 'Đăng dữ liệu (Sync Sitemap)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewItem({ type: 'post', data: postForm })}
                      className="px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs uppercase rounded-lg border border-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer leading-none"
                    >
                      <Eye className="w-4 h-4" />
                      Xem trước
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingNew(false); setEditingPostId(null); }}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded-lg transition-all"
                    >
                      Huỷ bỏ
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>
        )}



        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL 4: CUSTOMER SHOWROOMS FORM SUBMISSIONS
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeTab === 'submissions' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn" id="panel-customer-leads">
            <div className="p-5 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Hồ sơ khách hàng đăng ký tư vấn</h3>
              <p className="text-xs text-gray-400">Danh bạ nạp thời vật thu hoạch trực tiếp từ các biểu mẫu (leads intake form)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 font-bold text-[10px] text-gray-400 uppercase tracking-wider border-b">
                    <th className="p-4 pl-6">Khách hàng</th>
                    <th className="p-4">Địa chỉ / Điện thoại</th>
                    <th className="p-4">Quan tâm</th>
                    <th className="p-4 col-span-2">Lời nhắn câu hỏi</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 pr-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className={`hover:bg-slate-50/60 ${sub.status === 'unread' ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-4 pl-6">
                        <strong className="text-gray-950 block">{sub.name}</strong>
                        <span className="text-[10px] text-gray-400 block font-mono">{new Date(sub.createdAt).toLocaleString('vi-VN')}</span>
                      </td>
                      <td className="p-4">
                        <span className="block font-bold text-gray-800 font-mono text-[11px]">{sub.phone}</span>
                        <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">{sub.email}</span>
                        {sub.address && (
                          <span className="text-[10px] text-amber-800 bg-amber-50/70 border border-amber-100 rounded px-1.5 py-0.5 mt-1 block truncate max-w-[180px] font-sans" title={sub.address}>
                            📍 {sub.address}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-pentair block">{sub.productInterest || 'Tư vấn tổng quan'}</span>
                        {sub.productQuantity && (
                          <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                            Số lượng: <strong className="text-gray-800">{sub.productQuantity}</strong>
                          </span>
                        )}
                        {sub.formName && (
                          <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded block mt-1 w-fit border border-emerald-100 uppercase tracking-wide">
                            {sub.formName}
                          </span>
                        )}
                      </td>
                      <td className="p-4 max-w-xs text-gray-600 font-sans">
                        <p className="line-clamp-2 italic text-gray-700 mb-1 leading-snug">"{sub.message}"</p>
                        {sub.sourceUrl && (
                          <a 
                            href={sub.sourceUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 hover:text-blue-800 underline font-mono block truncate max-w-[220px]"
                            title={sub.sourceUrl}
                          >
                            Nguồn: {sub.sourceUrl.replace(window.location.origin, '') || '/'}
                          </a>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${sub.status === 'unread' ? 'bg-red-50 text-red-600 border border-red-200' : sub.status === 'read' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2 text-[10px]">
                          {sub.status === 'unread' && (
                            <button 
                              onClick={() => handleToggleSubStatus(sub.id, 'read')}
                              className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 cursor-pointer"
                            >
                              Đã đọc
                            </button>
                          )}
                          {sub.status !== 'archived' && (
                            <button 
                              onClick={() => handleToggleSubStatus(sub.id, 'archived')}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-gray-600 font-bold rounded cursor-pointer"
                            >
                              Lưu kho
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 italic">Không có biểu mẫu liên hệ nào ghi nhận.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL 5: SEO SETTINGS & BRAND IDENTITIES CONFIGS
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn" id="panel-settings">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Brand designs settings */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase text-pentair border-b pb-2">Thiết lập bộ nhận dạng thương hiệu</h3>
                
                <div className="space-y-3.5">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tên website chính</label>
                    <input 
                      type="text" 
                      value={brandForm.siteName}
                      onChange={e => setBrandForm({ ...brandForm, siteName: e.target.value })}
                      className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none font-bold text-gray-800"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Slogan thương hiệu</label>
                    <input 
                      type="text" 
                      value={brandForm.tagline}
                      onChange={e => setBrandForm({ ...brandForm, tagline: e.target.value })}
                      className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Số hotline miễn phí</label>
                      <input 
                        type="text" 
                        value={brandForm.phone}
                        onChange={e => setBrandForm({ ...brandForm, phone: e.target.value })}
                        className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Email liên hệ tổng đài</label>
                      <input 
                        type="text" 
                        value={brandForm.email}
                        onChange={e => setBrandForm({ ...brandForm, email: e.target.value })}
                        className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Đại chỉ Trực thuộc chính</label>
                    <input 
                      type="text" 
                      value={brandForm.address}
                      onChange={e => setBrandForm({ ...brandForm, address: e.target.value })}
                      className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Đường dẫn Facebook</label>
                      <input 
                        type="text" 
                        value={brandForm.facebook}
                        onChange={e => setBrandForm({ ...brandForm, facebook: e.target.value })}
                        className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none font-mono text-[10px]"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Kênh Youtube Official</label>
                      <input 
                        type="text" 
                        value={brandForm.youtube}
                        onChange={e => setBrandForm({ ...brandForm, youtube: e.target.value })}
                        className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO parameters meta & sitemaps robots configurations */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase text-pentair border-b pb-2">Cấu Hình SEO Vĩ Mô & Robot.txt</h3>
                
                <div className="space-y-3.5">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">SEO Meta Title Mặt Định</label>
                    <input 
                      type="text" 
                      value={seoForm.metaTitle}
                      onChange={e => setSeoForm({ ...seoForm, metaTitle: e.target.value })}
                      className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none text-gray-900 font-bold"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">SEO Meta Description</label>
                    <textarea 
                      rows={2}
                      value={seoForm.metaDescription}
                      onChange={e => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                      className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Canonical URL gốc</label>
                    <input 
                      type="text" 
                      value={seoForm.canonicalUrl}
                      onChange={e => setSeoForm({ ...seoForm, canonicalUrl: e.target.value })}
                      className="w-full p-2 text-xs rounded bg-gray-50 border focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Cấu hình robots.txt (Cho robot index bài viết)</label>
                    <textarea 
                      rows={4}
                      value={seoForm.robotsTxt}
                      onChange={e => setSeoForm({ ...seoForm, robotsTxt: e.target.value })}
                      className="w-full p-2 text-[10px] font-mono rounded bg-gray-50 border focus:outline-none leading-relaxed"
                      placeholder="User-agent: *..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSaveAllConfigs}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-pentair text-white font-bold text-xs uppercase rounded-lg shadow-md hover:bg-pentair-light transition-all cursor-pointer leading-none flex items-center gap-1"
                id="btn-settings-save"
              >
                <Save className="w-4 h-4" /> {actionLoading ? 'Đang cập nhật...' : 'Đồng bộ hóa toàn bộ cấu hình'}
              </button>
            </div>

          </div>
        )}

        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL 6: USERS INVENTORY & 2FA SECURITY CENTER
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeIn" id="panel-security">
            
            {currentUser?.role !== 'administrator' ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl">
                Bạn không có quyền truy cập vào trung tâm quản trị tài khoản. Chức năng này chỉ dành cho tài khoản Toàn quyền quản lý (admin).
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* User role lists */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-sm font-black uppercase text-pentair">Danh sách Phân Quyền Quản Trị Viên</h3>
                    <button 
                      onClick={() => {
                        setEditingUserId(null);
                        setUserForm({ username: '', password: '', email: '', role: 'editor' });
                        setShowUserForm(!showUserForm);
                        setUserErrorMsg('');
                        setUserSuccessMsg('');
                      }}
                      className="px-3 py-1.5 text-[10px] font-black uppercase text-white bg-pentair hover:bg-pentair-light rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {showUserForm ? 'Đóng form' : '+ Thêm quản trị mới'}
                    </button>
                  </div>

                  {showUserForm && (
                    <form onSubmit={handleSaveUser} className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-800">{editingUserId ? 'Chỉnh sửa quyền admin' : 'Thêm tài khoản admin mới'}</h4>
                      
                      {userErrorMsg && (
                        <div className="p-2 text-xs bg-red-100 text-red-700 rounded-lg">{userErrorMsg}</div>
                      )}
                      {userSuccessMsg && (
                        <div className="p-2 text-xs bg-emerald-100 text-emerald-700 rounded-lg">{userSuccessMsg}</div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Tên đăng nhập *</label>
                          <input 
                            type="text" 
                            required
                            disabled={!!editingUserId}
                            value={userForm.username}
                            onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded border bg-white focus:outline-none"
                            placeholder="admin_marketing"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">{editingUserId ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu *'}</label>
                          <input 
                            type="password" 
                            required={!editingUserId}
                            value={userForm.password}
                            onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded border bg-white focus:outline-none"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Email liên hệ *</label>
                          <input 
                            type="email" 
                            required
                            value={userForm.email}
                            onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded border bg-white focus:outline-none"
                            placeholder="email@thegioiloctong.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Cấp độ tài khoản *</label>
                          <select
                            value={userForm.role}
                            disabled={editingUserId === 'usr-admin'}
                            onChange={e => setUserForm({ ...userForm, role: e.target.value as 'administrator' | 'editor' })}
                            className="w-full px-3 py-2 text-xs rounded border bg-white focus:outline-none"
                          >
                            <option value="administrator">Toàn quyền quản lý (Full admin)</option>
                            <option value="editor">Quản trị viên (Restricted Editor)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button 
                          type="submit" 
                          className="px-4 py-2 text-xs font-bold uppercase text-white bg-blue-600 rounded-lg hover:bg-blue-500"
                        >
                          {editingUserId ? 'Cập nhật tài khoản' : 'Tạo tài khoản'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setShowUserForm(false); setEditingUserId(null); }}
                          className="px-4 py-2 text-xs font-bold uppercase text-gray-600 bg-gray-200 rounded-lg"
                        >
                          Huỷ
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3 font-sans">
                    {usersList.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">Đang tải danh sách tài khoản...</div>
                    ) : (
                      usersList.map((user) => (
                        <div key={user.id} className="p-3 bg-slate-50 border border-gray-150 rounded-xl flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <strong className="text-gray-900 font-bold block">{user.username}</strong>
                            <span className="text-[10px] text-gray-400 font-mono block">{user.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${user.role === 'administrator' ? 'bg-indigo-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                              {user.role === 'administrator' ? 'Toàn quyền quản lý' : 'Quản trị viên'}
                            </span>

                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setUserForm({ username: user.username, password: '', email: user.email, role: user.role });
                                  setShowUserForm(true);
                                  setUserErrorMsg('');
                                  setUserSuccessMsg('');
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Sửa quyền / Mật khẩu"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              
                              {user.id !== 'usr-admin' && (
                                <button 
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                  title="Xoá tài khoản"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2FA Controller box */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-1.5 text-pentair">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-black uppercase">WordPress Two-Factor Authentication (2FA)</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-sans leading-relaxed">
                    Ngăn chặn mọi rủi ro dò mật khẩu brute-force bằng cơ chế xác minh 2FA 6 số an toàn. Khi kích hoạt, bạn bắt buộc phải điền mã dự phòng để vượt qua gate đăng nhập.
                  </p>

                  <div className="pt-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-900 block">Trạng thái bảo vệ 2FA của bạn:</span>
                      <span className="text-[10px] text-gray-400 uppercase font-mono">Bật/Tắt chế độ kiểm duyệt bảo an</span>
                    </div>

                    <div>
                      {posts.some(p => p.authorId === 'usr-admin') ? (
                        <button 
                          onClick={() => handleToggleTwoFactor(!posts.some(p => p.id === 'setup-2fa-active'))}
                          className={`px-4 py-2 text-xs font-black uppercase rounded-lg shadow cursor-pointer transition-all ${
                            posts.some(p => p.id === 'setup-2fa-active')
                              ? 'bg-rose-600 text-white hover:bg-rose-500' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          }`}
                          id="btn-toggle-2fa"
                        >
                          {posts.some(p => p.id === 'setup-2fa-active') ? 'Vô Hiệu Hoá 2FA' : 'Kích Hoạt Bảo vệ 2FA'}
                        </button>
                      ) : (
                        // Fallback visual
                        <button 
                          onClick={() => triggerToast("Chức năng chỉ dành cho Administrator.", true)}
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase rounded-lg"
                        >
                          Kích Hoạt Bảo vệ 2FA
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL 7: BACKUPS DATA EXPORT/IMPORT CODE-BOX
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeTab === 'backup' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-fadeIn" id="panel-backup">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Xuất & Nhập Bài Đăng WordPress Portable (JSON)</h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                Rất an tâm! Sao lưu toàn bộ bài viết, cấu hình Brand, sơ đồ showrooms và đơn đăng ký submissions của khách hàng dạng XML-like JSON portable format.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Actions columns */}
              <div className="space-y-5 bg-slate-50 p-5 rounded-2xl border border-gray-100">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-gray-900 uppercase">Sao lưu dữ liệu (Export Backup File)</h4>
                  <p className="text-xs text-gray-500 font-sans leading-relaxed">
                    Nhấn nút dưới để tải xuống lập tức tệp cấu hình dạng file `.json` tiện dời nhà, đổi hosting/VPS tiện lợi mà không mất dữ liệu.
                  </p>
                  <button 
                    onClick={handleExportJson}
                    className="px-4 py-2 bg-pentair text-white text-xs font-bold uppercase rounded-lg hover:bg-pentair-light transition-all flex items-center gap-1 cursor-pointer"
                    id="btn-export-backup"
                  >
                    <Download className="w-4 h-4" /> Tiến hành Export dữ liệu
                  </button>
                </div>

                <hr className="border-gray-200" />

                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-gray-900 uppercase">Khôi phục dữ liệu (Import Backup File)</h4>
                  <p className="text-xs text-gray-500 font-sans leading-relaxed col-span-2">
                    Dán chuỗi JSON đã xuất phía bên phải vào phần ô nhập liệu và nhấn nút để khôi phục trạng thái nguyên trạng.
                  </p>
                  <button 
                    onClick={handleImportJson}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                    id="btn-import-backup"
                  >
                    <Upload className="w-4 h-4" /> {actionLoading ? 'Đang khôi phục...' : 'Kích hoạt Import dữ liệu'}
                  </button>
                </div>
              </div>

              {/* Code Box Area */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-700 block uppercase">Dữ liệu thô sao lưu dạng chuỗi JSON</label>
                <textarea 
                  rows={10}
                  placeholder='Gắn mã JSON khôi phục vào đây...'
                  value={backupJsonText}
                  onChange={e => setBackupJsonText(e.target.value)}
                  className="w-full p-3 font-mono text-[10px] text-slate-800 bg-slate-50 border border-gray-150 rounded-xl leading-relaxed focus:outline-none"
                  id="backup-raw-textarea"
                />
              </div>

            </div>

          </div>
        )}

        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL 8: SUPABASE DATABASE INTEGRATION CENTER & MIGRATION HELPER
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeTab === 'supabase' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8 animate-fadeIn text-left" id="panel-supabase">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Trung Tâm Quản Lý Tích Hợp Supabase (PostgreSQL)</h3>
              </div>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                Rất chuyên nghiệp! Hệ thống đã tự động nhận diện thông tin và khoá API của dự án Supabase thuộc tài khoản của bạn.
              </p>
            </div>

            {/* Dashboard grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Diagnostics & Connection Status */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200/60 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#062c63] block">Trạng thái kết nối hiện tại</span>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200">
                      <span className="text-gray-500 font-medium font-sans">Project Reference (Ref ID):</span>
                      <span className="font-mono font-bold text-[#0C3471]">{supabaseConfig?.projectRef || 'rrfldkxgwbcclpchuyxef'}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200">
                      <span className="text-gray-500 font-medium font-sans">Supabase Project URL:</span>
                      <span className="font-mono text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded text-[11px]">{supabaseConfig?.url || 'https://rrfldkxgwbcclpchuyxef.supabase.co'}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200">
                      <span className="text-gray-500 font-medium font-sans">API Key (Anon Key):</span>
                      <span className="font-mono text-gray-700 font-bold" title="API Key do bạn đã nhập">{supabaseConfig?.apiKeyPreview || 'eyJhbGciOiJI...loJkTD9I4'}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium font-sans">Service Status:</span>
                      <span className="flex items-center gap-1.5 font-sans font-bold text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Đã sẵn sàng (Ready)
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={testSupabaseConnection}
                      disabled={testingSupabase}
                      className="w-full py-2.5 bg-[#0C3471] hover:bg-[#062c63] text-white text-xs font-bold uppercase rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${testingSupabase ? 'animate-spin' : ''}`} />
                      {testingSupabase ? 'Đang kiểm tra kết nối...' : 'Kiểm Tra Kết Nối Live'}
                    </button>
                  </div>

                  {/* Test Connection Results wrapper */}
                  {supabaseTestResult && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${supabaseTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        {supabaseTestResult.success ? (
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        )}
                        <span>{supabaseTestResult.message}</span>
                      </div>
                      {supabaseTestResult.details && (
                        <p className="opacity-90 font-sans mt-1 text-[11px]">{supabaseTestResult.details}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Guide panel */}
                <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3">
                  <h4 className="text-xs font-black text-blue-900 uppercase">Làm cách nào để kết nối cục bộ?</h4>
                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                    Khởi chạy ứng dụng và tự động kết nối bằng cách định nghĩa các biến môi trường sau trong tệp <code className="bg-white px-1 py-0.5 border rounded text-rose-600 font-mono text-[10px]">.env</code>:
                  </p>
                  <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[10px] rounded-lg overflow-x-auto leading-relaxed">
                    {`# Cho máy chủ Express (server.ts)\nSUPABASE_URL="https://rrfldkxgwbcclpchuyxef.supabase.co"\nSUPABASE_ANON_KEY="eyJhbGciOiJI..."\n\n# Cho ứng dụng client (Vite React)\nVITE_SUPABASE_URL="https://rrfldkxgwbcclpchuyxef.supabase.co"\nVITE_SUPABASE_ANON_KEY="eyJhbGciOiJI..."`}
                  </pre>
                </div>
              </div>

              {/* Right Column: Schema SQL Creator */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center justify-between border-b pb-2 border-gray-150">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Supabase Migration Query</span>
                    <h4 className="text-xs font-black text-gray-800 uppercase">Khởi tạo các bảng cơ sở dữ liệu (Database Schema SQL)</h4>
                  </div>
                  <button 
                    onClick={() => {
                      const sqlText = (document.getElementById('supabase-sql-schema') as HTMLTextAreaElement)?.value;
                      if (sqlText) {
                        navigator.clipboard.writeText(sqlText);
                        alert("Đã sao chép câu lệnh SQL vào clipboard!");
                      }
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-lg cursor-pointer"
                  >
                    Sao Chép SQL
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                  Để lưu trữ các bài viết Pentair Việt Nam trực tiếp trên dự án bảo mật Supabase của bạn, hãy mở <strong className="text-emerald-600 font-semibold font-sans">Supabase SQL Editor</strong> trong bảng điều khiển Supabase của bạn và dán đoạn mã Schema SQL dưới đây để chạy:
                </p>

                <textarea 
                  id="supabase-sql-schema"
                  rows={14}
                  readOnly
                  value={`-- Cấu trúc bảng Lưu trữ bài viết CMS\nCREATE TABLE IF NOT EXISTS public.posts (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  slug TEXT UNIQUE NOT NULL,\n  content TEXT,\n  excerpt TEXT,\n  type TEXT,\n  status TEXT,\n  author_id TEXT,\n  featured_image TEXT,\n  menu_order INTEGER DEFAULT 0,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  meta JSONB DEFAULT '{}'::jsonb,\n  terms JSONB DEFAULT '[]'::jsonb\n);\n\n-- Cấu trúc bảng Phân loại chuyên mục Taxonomies\nCREATE TABLE IF NOT EXISTS public.terms (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  slug TEXT UNIQUE NOT NULL,\n  taxonomy TEXT NOT NULL\n);\n\n-- Cấu trúc bảng Khách hàng đăng ký liên hệ\nCREATE TABLE IF NOT EXISTS public.submissions (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT,\n  phone TEXT,\n  message TEXT,\n  product_interest TEXT,\n  status TEXT DEFAULT 'unread',\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\n-- Cấu trúc bảng Cấu hình toàn bộ Brand Options\nCREATE TABLE IF NOT EXISTS public.options (\n  id TEXT PRIMARY KEY,\n  option_name TEXT UNIQUE NOT NULL,\n  option_value JSONB DEFAULT '{}'::jsonb\n);`}
                  className="w-full p-4 font-mono text-[10px] text-slate-100 bg-slate-900 border border-gray-150 rounded-2xl leading-relaxed focus:outline-none select-all"
                />

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-[11px] text-amber-850 space-y-1.5 leading-relaxed font-sans">
                  <span className="font-bold uppercase tracking-wide text-amber-900 font-sans block">⚠️ LƯU Ý KHI MỞ RỘNG MIGRATION</span>
                  <p className="font-sans">
                    Hệ thống CMS hiện sử dụng database lai (Hybrid Database) với bộ nhớ đệm an toàn tự đồng bộ qua file tĩnh <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono text-[10px]">data/db.json</code>. Việc thiết lập trên giúp hệ thống của bạn hoạt động mượt mà, ngay cả khi Supabase ở chế độ Free Tier tạm ngắt kết nối do không hoạt động (auto-pause).
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            EMAIL NOTIFICATION SETTINGS PANEL VIEW
            ========================================== */}
        {activeTab === 'email-settings' && (
          <div className="space-y-6" id="email-settings-panel">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase">HỘP THƯ NHẬN THÔNG BÁO TỨC THỜI</h2>
                <p className="text-xs text-gray-500 font-sans mt-0.5">Quản lý danh sách email kỹ sư nhận thông tin liên kết tức thời khi khách hàng điền form liên hệ.</p>
              </div>
            </div>

            {emailStatusMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{emailStatusMsg}</span>
              </div>
            )}

            {emailErrorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{emailErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-6 space-y-6 shadow-xs">
                
                {/* 1. Toggle switch */}
                <div className="flex items-center justify-between bg-blue-50/20 p-4 rounded-xl border border-blue-50">
                  <div>
                    <span className="font-bold text-gray-900 text-xs uppercase tracking-wider block">KÍCH HOẠT GỬI EMAIL TỰ ĐỘNG</span>
                    <span className="text-[11px] text-gray-400 font-sans">Bật/tắt chế độ gửi thư khi nhận được yêu cầu tư vấn mới từ khách hàng</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={emailEnabled}
                      onChange={async (e) => {
                        const newEnabled = e.target.checked;
                        setEmailEnabled(newEnabled);
                        // Auto save instantly
                        setSavingEmail(true);
                        try {
                          const res = await fetch('/api/admin/settings/email', {
                            method: 'PUT',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
                            },
                            body: JSON.stringify({
                              email_notification_enabled: newEnabled,
                              contact_email_recipients: emailRecipients,
                              smtp_settings: {
                                host: smtpHost,
                                port: Number(smtpPort),
                                username: smtpUser,
                                password: smtpPass,
                                encryption: smtpSecure ? 'SSL' : 'TLS'
                              }
                            })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Lỗi lưu cấu hình.');
                          setEmailStatusMsg(newEnabled ? 'Đã bật tính năng tự động gửi email thông báo!' : 'Đã tạm tắt tính năng gửi email thông báo.');
                        } catch (err: any) {
                          setEmailErrorMsg(err.message || 'Lỗi cập nhật trạng thái.');
                        } finally {
                          setSavingEmail(false);
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 2. Interactive Add Email form */}
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">Thêm Email Nhận Tin Tức Thời</label>
                  <form onSubmit={handleAddEmail} className="flex gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus-within:border-blue-600 transition-all">
                    <div className="relative flex-1">
                      <input 
                        type="email"
                        placeholder="Nhập địa chỉ email mới... Ví dụ: hotro@pentairvn.com"
                        value={newEmailInput}
                        onChange={e => setNewEmailInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-blue-600 bg-white text-gray-800 font-sans"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingEmail}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" /> THÊM EMAIL
                    </button>
                  </form>
                </div>

                {/* 3. List of current emails with trash buttons */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">Danh Sách Email Trực Tiếp Tiếp Nhận Hotline/Leads</label>
                  
                  {(() => {
                    const recipientList = emailRecipients
                      .split(/[\n,]+/)
                      .map(email => email.trim())
                      .filter(email => email !== '');

                    if (recipientList.length === 0) {
                      return (
                        <div className="bg-slate-50 text-center py-8 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500 italic font-sans">
                          Chưa có email nhận tin. Nhập một email ở trên và bấm "Thêm Email" để thiết lập.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recipientList.map((email) => (
                          <div key={email} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-150 bg-white hover:border-blue-200 hover:shadow-xs transition-all group">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black font-mono shrink-0">@</span>
                              <span className="text-xs font-bold text-gray-700 truncate font-mono" title={email}>{email}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteEmail(email)}
                              disabled={savingEmail}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all ml-2 cursor-pointer shrink-0"
                              title="Xóa khỏi danh sách nhận"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* 4. Collapsible Advanced SMTP Options (optional) */}
                <div className="pt-2">
                  <details className="group border border-gray-150 rounded-2xl p-4 bg-gray-50/40" open>
                    <summary className="text-[11px] font-extrabold text-gray-600 uppercase tracking-widest flex items-center justify-between cursor-pointer list-none select-none">
                      <span className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-gray-400 group-open:text-blue-500 transition-colors" /> 
                        CẤU HÌNH GỬI MAIL NÂNG CAO (SMTP SERVER - KHÔNG BẮT BUỘC)
                      </span>
                      <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform font-sans">▼</span>
                    </summary>
                    
                    <div className="mt-4 pt-4 border-t border-gray-150 space-y-4 cursor-default" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100/80 p-3 rounded-xl border border-slate-200">
                        <div className="space-y-1">
                          <p className="text-[11px] text-gray-600 font-bold font-sans">
                            Trạng thái cấu hình SMTP hiện tại:
                          </p>
                          <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                            Mặc định hệ thống dùng máy chủ nội bộ. Bạn bắt buộc phải điền Email & Mật khẩu bên dưới rồi bấm <strong className="text-slate-800">"Lưu"</strong> để đổi tài khoản gửi thư.
                          </p>
                        </div>
                        <div className="shrink-0">
                          {smtpUser && smtpPass ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Đã thiết lập tài khoản gửi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Sử dụng Server gửi mặc định thôi
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block uppercase">SMTP Host</label>
                          <input 
                            type="text" 
                            placeholder="Ví dụ: smtp.gmail.com"
                            value={smtpHost}
                            onChange={e => setSmtpHost(e.target.value)}
                            className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block uppercase">SMTP Port</label>
                          <input 
                            type="number" 
                            placeholder="587 hoặc 465"
                            value={smtpPort}
                            onChange={e => setSmtpPort(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block uppercase">SMTP Username (Địa chỉ Email quý khách)</label>
                          <input 
                            type="text" 
                            placeholder="BẮT BUỘC NHẬP: nhap-email-gui-cua-ban@gmail.com"
                            value={smtpUser}
                            onChange={e => setSmtpUser(e.target.value)}
                            className="w-full px-3 py-2 text-xs border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg focus:outline-none bg-white transition-all font-mono text-gray-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block uppercase">SMTP Password / Mật khẩu ứng dụng (App Password)</label>
                          <input 
                            type="password" 
                            placeholder="BẮT BUỘC NHẬP: Mật khẩu ứng dụng 16 ký tự"
                            value={smtpPass}
                            onChange={e => setSmtpPass(e.target.value)}
                            className="w-full px-3 py-2 text-xs border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg focus:outline-none bg-white transition-all font-mono text-gray-900"
                          />
                          <p className="text-[9px] text-gray-400 font-sans">
                            Đối với Gmail, bạn cần tạo "Mật khẩu ứng dụng" (App Password) trong mục bảo mật tài khoản Google, không sử dụng mật khẩu đăng nhập chính.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input 
                          type="checkbox" 
                          id="smtp-secure-toggle" 
                          checked={smtpSecure}
                          onChange={e => setSmtpSecure(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="smtp-secure-toggle" className="text-xs text-gray-700 font-sans cursor-pointer select-none">Sử dụng SSL/TLS Bảo Mật (Port 465)</label>
                      </div>

                      <div className="pt-4 border-t flex flex-wrap gap-3">
                        <button 
                          type="button"
                          onClick={() => handleSaveEmailSettings()}
                          disabled={savingEmail}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-600 text-white font-bold text-xs uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {savingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 
                          Lưu SMTP nâng cao
                        </button>

                        <button 
                          type="button"
                          onClick={handleSendTestEmail}
                          disabled={testingEmail || savingEmail}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold text-xs uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {testingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} 
                          Gửi Thử Kiểm Tra SMTP (Test Send)
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

              </div>

              <div className="lg:col-span-4 bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4 leading-relaxed shadow-xs">
                <h4 className="font-bold text-xs text-slate-850 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> NGUYÊN LÝ HOẠT ĐỘNG
                </h4>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  Khi khách hàng điền biểu mẫu (báo giá, liên hệ tư vấn, đặt lịch) trên website, biểu mẫu sẽ ngay lập tức được chụp lại và phân phối đồng thời tới toàn bộ hòm thư trong danh sách của bạn.
                </p>
                <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl space-y-2 text-[11px] text-blue-800 font-sans">
                  <span className="font-semibold uppercase tracking-wider text-[10px] block">Nội dung thư thông báo gồm:</span>
                  <ul className="list-disc pl-4 space-y-1 font-sans">
                    <li>Họ tên khách hàng</li>
                    <li>Số điện thoại nóng</li>
                    <li>Địa chỉ email của khách</li>
                    <li>Sản phẩm / Giải pháp quan tâm</li>
                    <li>Nội dung mô tả hoặc lời chúc</li>
                    <li>Ngày giờ nộp cụ thể</li>
                  </ul>
                </div>
                <div className="text-[10px] text-gray-400 italic font-sans">
                  * Hệ thống sẽ tự động lọc bỏ các email trùng lặp và loại trừ các ký tự thừa để bảo đảm hòm thư an toàn.
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ==========================================
            VIDEO PLAYLIST CMS MANAGEMENT PANEL VIEW
            ========================================== */}
        {activeTab === 'videos' && (
          <div className="space-y-6" id="videos-panel">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase">Quản trị Playlist Video trang chủ</h2>
                <p className="text-xs text-gray-500 font-sans mt-0.5">Sắp xếp kho bài giảng, review, quy trình sục rửa và hoạt họa van Pentair.</p>
              </div>
              {!isCreatingVideo && !editingVideoId && (
                <button 
                  onClick={startCreateVideo}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" /> Thêm video mới
                </button>
              )}
            </div>

            {videoStatusMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{videoStatusMsg}</span>
              </div>
            )}

            {videoErrorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{videoErrorMsg}</span>
              </div>
            )}

            {/* FORM CONTAINER FOR EDITING / CREATING */}
            {(isCreatingVideo || editingVideoId) && (
              <form onSubmit={handleSaveVideo} className="bg-white border border-gray-150 rounded-2xl p-6 space-y-6 animate-fadeIn">
                <h3 className="text-xs font-black uppercase text-blue-700 tracking-wider">
                  {editingVideoId ? 'Chỉnh sửa tọa độ video phát' : 'Thêm video mới vào playlist'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Tiêu đề Video *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="VD: Hướng dẫn vận hành van thông minh fleck 5600"
                      value={videoForm.title}
                      onChange={e => setVideoForm({...videoForm, title: e.target.value})}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block uppercase">Phân loại danh mục *</label>
                      <select 
                        value={videoForm.category}
                        onChange={e => setVideoForm({...videoForm, category: e.target.value as any})}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white"
                      >
                        <option value="introduction">Giới thiệu</option>
                        <option value="operation">Vận hành</option>
                        <option value="installation">Lắp đặt</option>
                        <option value="review">Đánh giá / Review</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block uppercase">Thời lượng (Duration) *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="VD: 4:32"
                        value={videoForm.duration}
                        onChange={e => setVideoForm({...videoForm, duration: e.target.value})}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">URL Video phát (YouTube Link hoặc Embed Link) *</label>
                    <input 
                      type="url" 
                      required
                      placeholder="https://www.youtube.com/watch?v=xxx... hoặc embed"
                      value={videoForm.videoUrl}
                      onChange={e => setVideoForm({...videoForm, videoUrl: e.target.value})}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Ảnh thumbnail đại diện (Image URL) *</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        required
                        placeholder="https://images.unsplash.com/..."
                        value={videoForm.thumbnail}
                        onChange={e => setVideoForm({...videoForm, thumbnail: e.target.value})}
                        className="flex-grow px-3 py-2 text-xs border rounded-lg focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveMediaSelector({ target: 'video_thumbnail' })}
                        className="px-3 py-2 text-xs font-semibold bg-slate-900 border hover:bg-slate-800 text-white rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-sm font-sans"
                      >
                        <Image className="w-3.5 h-3.5" />
                        Chọn tệp
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Mô tả ngắn chất lượng video *</label>
                    <textarea 
                      rows={2}
                      required
                      placeholder="Viết một đoạn ngắn giới thiệu cấu tạo để kích thích lượt xem..."
                      value={videoForm.description}
                      onChange={e => setVideoForm({...videoForm, description: e.target.value})}
                      className="w-full p-3 border text-xs rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block uppercase">Số thứ tự sắp xếp</label>
                      <input 
                        type="number" 
                        value={videoForm.sortOrder}
                        onChange={e => setVideoForm({...videoForm, sortOrder: Number(e.target.value)})}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block uppercase">Trạng thái phát *</label>
                      <select 
                        value={videoForm.status}
                        onChange={e => setVideoForm({...videoForm, status: e.target.value})}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white"
                      >
                        <option value="published">Xuất bản (Publish)</option>
                        <option value="draft">Bản nháp (Draft)</option>
                        <option value="hidden">Ẩn (Hidden)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input 
                        type="checkbox" 
                        id="is-featured-video"
                        className="rounded text-blue-600"
                        checked={videoForm.isFeatured}
                        onChange={e => setVideoForm({...videoForm, isFeatured: e.target.checked})}
                      />
                      <label htmlFor="is-featured-video" className="text-xs text-gray-700 font-bold uppercase select-none cursor-pointer">Video tiêu biểu</label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-2">
                  <button 
                    type="submit"
                    disabled={videoLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    {videoLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 
                    Lưu video
                  </button>

                  <button 
                    type="button"
                    onClick={() => setPreviewItem({ type: 'video', data: videoForm })}
                    className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs uppercase rounded-xl border border-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem trước
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setIsCreatingVideo(false); setEditingVideoId(null); }}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            )}

            {/* LIST TABLE VIDEOS */}
            {!isCreatingVideo && !editingVideoId && (
              <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b font-sans">
                      <th className="p-4 w-28">Thumbnail</th>
                      <th className="p-4">Tiêu đề & Mô tả</th>
                      <th className="p-4 w-32">Danh mục</th>
                      <th className="p-4 w-24 text-center">Nổi bật</th>
                      <th className="p-4 w-24 text-center">Trạng thái</th>
                      <th className="p-4 w-24 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(videos && videos.length > 0 ? videos : []).map((v: any, index: number) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <img 
                            src={v.thumbnail || 'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=400&q=80'} 
                            alt={v.title}
                            className="w-24 aspect-video object-cover rounded-lg border border-gray-250 bg-gray-100"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="font-bold text-gray-950 uppercase leading-snug">{v.title}</div>
                          <p className="text-gray-500 text-[10px] font-sans line-clamp-2 max-w-md">{v.description}</p>
                          <div className="text-[9px] text-gray-400 font-mono">ID: {v.id} | Order: {v.sortOrder} | {v.duration} min</div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold uppercase py-1 px-2.5 bg-blue-50 text-blue-700 rounded-full select-none font-sans">
                            {v.category}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {v.isFeatured ? (
                            <span className="text-xs text-amber-500">★ Yes</span>
                          ) : (
                            <span className="text-xs text-gray-300">No</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-sans ${
                            v.status === 'published' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : v.status === 'hidden' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-gray-150 text-gray-600'
                          }`}>
                            {v.status === 'published' ? 'Xuất bản' : v.status === 'hidden' ? 'Ẩn' : 'Bản nháp'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => startEditVideo(v)}
                              className="p-1.5 text-blue-600 hover:bg-double-highlight rounded transition-colors"
                              title="Sửa video"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteVideo(v.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Xóa video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(videos && videos.length > 0) ? null : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          Chưa có video nào. Bấm Thêm video mới ở góc trên để cấu hình danh sách phát.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {/* ==========================================
            SPACE PERSPECTIVES CMS MANAGEMENT VIEW
            ========================================== */}
        {activeTab === 'perspectives' && (
          <div className="space-y-6" id="perspectives-panel">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase">Quản trị Phối cảnh trong không gian</h2>
                <p className="text-xs text-gray-500 font-sans mt-0.5">Xây dựng bản vẽ thiết kế 3D, bóc tách kĩ thuật lắp ráp tại biệt thự, căn hộ, hầm.</p>
              </div>
              {!isCreatingPerspective && !editingPerspectiveId && (
                <button 
                  onClick={startCreatePerspective}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Plus className="w-4 h-4" /> Thêm phối cảnh
                </button>
              )}
            </div>

            {perspectiveStatusMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-slideUp">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{perspectiveStatusMsg}</span>
              </div>
            )}

            {perspectiveErrorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{perspectiveErrorMsg}</span>
              </div>
            )}

            {/* FORM CONTAINER FOR CREATING / EDITING PERSPECTIVES */}
            {(isCreatingPerspective || editingPerspectiveId) && (
              <form onSubmit={handleSavePerspective} className="bg-white border border-gray-150 rounded-2xl p-6 space-y-6 animate-fadeIn">
                <h3 className="text-xs font-black uppercase text-blue-700 tracking-wider">
                  {editingPerspectiveId ? 'Cập nhật bản phối cảnh 3D' : 'Kiến tạo phối cảnh tủ lọc mới'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Tên phối cảnh / Không gian *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="VD: Phối cảnh hệ lọc biệt thự Vinhomes Grand Park"
                      value={perspectiveForm.title}
                      onChange={e => {
                        const title = e.target.value;
                        const slug = title.toLowerCase()
                          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                          .replace(/[đĐ]/g, 'd')
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/-+/g, '-');
                        setPerspectiveForm({...perspectiveForm, title, slug});
                      }}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Slug URL Định Nghĩa (Đường dẫn tĩnh) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="VD: biet-thu-vinhomes-grand-park"
                      value={perspectiveForm.slug}
                      onChange={e => setPerspectiveForm({...perspectiveForm, slug: e.target.value})}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block uppercase">Phân loại không gian sống *</label>
                      <select 
                        value={perspectiveForm.spaceType}
                        onChange={e => setPerspectiveForm({...perspectiveForm, spaceType: e.target.value})}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white"
                      >
                        <option value="villa">Biệt thự</option>
                        <option value="townhouse">Nhà phố</option>
                        <option value="apartment">Căn hộ chung cư</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block uppercase">Thứ tự sắp xếp</label>
                      <input 
                        type="number" 
                        value={perspectiveForm.sortOrder}
                        onChange={e => setPerspectiveForm({...perspectiveForm, sortOrder: Number(e.target.value)})}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block uppercase">Trạng thái bản vẽ *</label>
                      <select 
                        value={perspectiveForm.status}
                        onChange={e => setPerspectiveForm({...perspectiveForm, status: e.target.value})}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white font-bold"
                      >
                        <option value="published">Công khai (Publish)</option>
                        <option value="draft">Bản nháp (Draft)</option>
                        <option value="hidden">Ẩn (Hidden)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input 
                        type="checkbox" 
                        id="is-featured-perspective"
                        className="rounded text-blue-601"
                        checked={perspectiveForm.isFeatured}
                        onChange={e => setPerspectiveForm({...perspectiveForm, isFeatured: e.target.checked})}
                      />
                      <label htmlFor="is-featured-perspective" className="text-xs text-slate-800 font-bold uppercase select-none cursor-pointer">Công trình tiêu biểu ở t.chủ</label>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Ảnh đại diện chính biệt thự (Featured Image URL) *</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        required
                        placeholder="https://images.unsplash.com/photo-..."
                        value={perspectiveForm.featuredImage}
                        onChange={e => setPerspectiveForm({...perspectiveForm, featuredImage: e.target.value})}
                        className="flex-grow px-3 py-2 text-xs border rounded-lg focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveMediaSelector({ target: 'perspective_featured' })}
                        className="px-3 py-2 text-xs font-semibold bg-slate-900 border hover:bg-slate-800 text-white rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-sm font-sans"
                      >
                        <Image className="w-3.5 h-3.5" />
                        Chọn từ kho ảnh
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-500 block uppercase">Danh sách thư viện ảnh phụ chi tiết / Bản vẽ (Gallery Image URLs, cách nhau bởi dấu phẩy) *</label>
                      <button
                        type="button"
                        onClick={() => setActiveMediaSelector({ target: 'perspective_gallery' })}
                        className="px-2 py-1 text-[10px] font-extrabold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-150 rounded-md cursor-pointer transition-colors flex items-center gap-1 font-sans"
                      >
                        <Plus className="w-3 h-3" />
                        Thêm ảnh từ kho tư liệu
                      </button>
                    </div>
                    <textarea 
                      rows={3}
                      placeholder="https://images.unsplash.com/photo1, https://images.unsplash.com/photo2"
                      value={tempGalleryInput}
                      onChange={e => setTempGalleryInput(e.target.value)}
                      className="w-full p-3 border text-xs rounded-lg focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-black text-blue-800 block uppercase tracking-wide">Hình ảnh sản phẩm thực tế trong không gian (Product Images In Space, cách nhau bởi dấu phẩy)</label>
                      <button
                        type="button"
                        onClick={() => setActiveMediaSelector({ target: 'perspective_product_gallery' })}
                        className="px-2.5 py-1 text-[10px] font-extrabold bg-blue-600 text-white hover:bg-blue-700 rounded-md cursor-pointer transition-colors flex items-center gap-1 font-sans shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        Chọn từ kho ảnh
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 font-sans mb-2">Thêm liên kết hình ảnh chụp cận cảnh các sản phẩm lọc nước lắp đặt tại không gian thực tế này để trưng bày dạng slide/gallery sản phẩm:</p>
                    <textarea 
                      rows={3}
                      placeholder="https://images.unsplash.com/product-photo1, https://images.unsplash.com/product-photo2"
                      value={tempProductGalleryInput}
                      onChange={e => setTempProductGalleryInput(e.target.value)}
                      className="w-full p-3 border border-blue-200/60 text-xs rounded-lg focus:outline-none focus:border-blue-600 font-mono bg-white"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Mô tả tóm tắt không gian (Excerpt) *</label>
                    <textarea 
                      rows={2}
                      required
                      placeholder="Mô tả sơ bộ vị trí hộp kĩ thuật hoặc biệt thự cổ điển..."
                      value={perspectiveForm.excerpt}
                      onChange={e => setPerspectiveForm({...perspectiveForm, excerpt: e.target.value})}
                      className="w-full p-3 border text-xs rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Related products choosing */}
                  <div className="space-y-2 md:col-span-2 border-t pt-4">
                    <label className="text-[10px] font-black text-gray-800 block uppercase tracking-wider">Chọn thiết bị sản phẩm thuộc hệ thống lọc lắp đặt</label>
                    <p className="text-[10px] text-gray-400 font-sans mb-2">Đánh dấu tích để map các sản phẩm lọc nước từ danh sách posts (loại sản phẩm) vào trang chi tiết:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border max-h-48 overflow-y-auto custom-scrollbar">
                      {posts.filter(p => p.type === 'product').map((prod) => {
                        const isChecked = perspectiveForm.relatedProductIds.includes(prod.id);
                        return (
                          <div key={prod.id} className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id={`checkbox-rel-${prod.id}`}
                              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                              checked={isChecked}
                              onChange={e => {
                                let list = [...perspectiveForm.relatedProductIds];
                                if (e.target.checked) {
                                  if (!list.includes(prod.id)) list.push(prod.id);
                                } else {
                                  list = list.filter(id => id !== prod.id);
                                }
                                setPerspectiveForm({...perspectiveForm, relatedProductIds: list});
                              }}
                            />
                            <label htmlFor={`checkbox-rel-${prod.id}`} className="text-xs text-gray-750 font-sans cursor-pointer truncate" title={prod.title}>
                              {prod.title}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content rich text layout using simple HTML area */}
                  <div className="space-y-1 md:col-span-2 border-t pt-4">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Nội dung chi tiết dự án (HTML Allowed) *</label>
                    <textarea 
                      rows={8}
                      required
                      placeholder="VD: <p>Nội dung chi tiết...</p><h4>Đặc trưng thi công</h4><ul><li>...</li></ul>"
                      value={perspectiveForm.content}
                      onChange={e => setPerspectiveForm({...perspectiveForm, content: e.target.value})}
                      className="w-full p-4 border text-xs rounded-lg focus:outline-none font-sans leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-2">
                  <button 
                    type="submit"
                    disabled={perspectiveLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {perspectiveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 
                    Lưu phối cảnh
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      const galleryArr = tempGalleryInput
                        ? tempGalleryInput.split(',').map(s => s.trim()).filter(Boolean)
                        : [];
                      setPreviewItem({ 
                        type: 'perspective', 
                        data: { ...perspectiveForm, gallery: galleryArr } 
                      });
                    }}
                    className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs uppercase rounded-xl border border-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem trước
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setIsCreatingPerspective(false); setEditingPerspectiveId(null); }}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            )}

            {/* LIST TABLE PERSPECTIVES */}
            {!isCreatingPerspective && !editingPerspectiveId && (
              <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b font-sans">
                      <th className="p-4 w-28">Hình ảnh đại diện</th>
                      <th className="p-4">Thông tin công trình</th>
                      <th className="p-4 w-32">Không gian sống</th>
                      <th className="p-4 w-32">Sản phẩm tham chiếu</th>
                      <th className="p-4 w-20 text-center">Nổi bật</th>
                      <th className="p-4 w-24 text-center">Trạng thái</th>
                      <th className="p-4 w-24 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(perspectives && perspectives.length > 0 ? perspectives : []).map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <img 
                            src={p.featuredImage} 
                            className="w-24 aspect-[16/10] object-cover rounded-xl border bg-gray-50"
                            alt={p.title}
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="font-bold text-gray-950 uppercase leading-snug">{p.title}</div>
                          <p className="text-gray-500 text-[10px] font-sans line-clamp-2 max-w-sm">{p.excerpt}</p>
                          <div className="text-[9px] text-gray-400 font-mono">Slug: <span className="underline">{p.slug}</span> | Order: {p.sortOrder}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold uppercase px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full font-sans">
                            {p.spaceType}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-[10px] text-slate-600 font-sans space-y-0.5 max-w-xs truncate">
                            {(p.relatedProductIds || []).map((id: string) => {
                              const product = posts.find(item => item.id === id);
                              return (
                                <div key={id} className="bg-slate-100 rounded px-1.5 py-0.5 inline-block text-[9px] mr-1 mb-1 font-sans">
                                  {product ? product.title : `Prod: ${id}`}
                                </div>
                              );
                            })}
                            {(p.relatedProductIds || []).length === 0 && <span className="text-gray-400 font-light">Chưa cấu hình</span>}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {p.isFeatured ? (
                            <span className="text-xs text-amber-500">★ Yes</span>
                          ) : (
                            <span className="text-xs text-gray-300">No</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-sans ${
                            p.status === 'published' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : p.status === 'hidden' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-gray-150 text-gray-600'
                          }`}>
                            {p.status === 'published' ? 'Xuất bản' : p.status === 'hidden' ? 'Ẩn' : 'Bản nháp'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => startEditPerspective(p)}
                              className="p-1.5 text-blue-600 hover:bg-double-highlight rounded transition-colors"
                              title="Sửa phối cảnh"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeletePerspective(p.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Xóa phối cảnh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(perspectives && perspectives.length > 0) ? null : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          Chưa có thiết kế phối cảnh nào. Nhấn Thêm mới phối cảnh ở trên để bắt đầu bóc tách.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            MEDIA REPOSITORY MANAGEMENT VIEW
            ========================================== */}
        {activeTab === 'media' && (
          <div className="space-y-6" id="media-library-panel">
            <MediaLibrary />
          </div>
        )}

      </main>

      {/* RENDER DYNAMIC PUBLIC-PREVIEW MODAL (Trực quan & Bảo lưu Pentair) */}
      {previewItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-[9999] overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col font-sans text-slate-805">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono">Chế độ xem trước</span>
                <h4 className="text-sm font-black uppercase tracking-tight truncate max-w-md">
                  {previewItem.data.title || "Chưa đặt tiêu đề"}
                </h4>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="p-1 px-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Đóng [Esc]
              </button>
            </div>

            {/* Modal Content Arena */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-left">
              
              {/* post preview wrapper */}
              {previewItem.type === 'post' && previewItem.data.type !== 'product' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div className="space-y-2">
                    <span className="text-xs font-black text-blue-600 uppercase">Tin tức & Sự kiện</span>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{previewItem.data.title || 'Tiêu Đề Bài Viết'}</h1>
                    <div className="text-xs text-gray-400 font-sans">Đăng bởi hệ thống ngày {new Date().toLocaleDateString('vi-VN')}</div>
                  </div>

                  {previewItem.data.featuredImage && (
                    <img 
                      src={previewItem.data.featuredImage} 
                      className="w-full aspect-[21/9] object-cover rounded-2xl border" 
                      alt="News Banner" 
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className="prose max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4 font-sans whitespace-pre-line border-t pt-4">
                    {previewItem.data.content || 'Nội dung bài viết chưa được nhập.'}
                  </div>
                </div>
              )}

              {/* product preview wrapper */}
              {previewItem.type === 'post' && previewItem.data.type === 'product' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left column */}
                    <div className="lg:col-span-5 space-y-3">
                      <img 
                        src={previewItem.data.featuredImage || 'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=600&q=80'} 
                        className="w-full aspect-square object-cover rounded-2xl border border-gray-100 shadow-sm" 
                        alt="Product visual" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {(previewItem.data.meta?.scenes || []).slice(0, 4).map((imgUrl: string, idx: number) => (
                          <div key={idx} className="aspect-square rounded-lg border overflow-hidden bg-slate-50">
                            <img src={imgUrl} className="w-full h-full object-cover" alt="scene thumbnail" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="space-y-1.5">
                        <span className="px-2.5 py-1 bg-[#0C3471]/10 text-[#0C3471] text-[9px] font-bold uppercase tracking-wider rounded-full">Pentair USA Certified</span>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight uppercase">{previewItem.data.title || "Tên Sản Phẩm Thử Nghiệm"}</h1>
                        <div className="text-xs text-gray-400 font-mono">Mã sản phẩm (ID): <span className="underline">{previewItem.data.slug || 'slug-placeholder'}</span></div>
                      </div>

                      {/* Pricing block */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100/80 flex flex-wrap gap-4 items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">Giá bán lẻ niêm yết:</span>
                          <span className="text-sm line-through text-gray-400 font-mono">
                            {previewItem.data.meta?.price ? (Number(previewItem.data.meta?.price).toLocaleString('vi-VN') + " đ") : "Tùy biến cấu hình"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500 block uppercase font-bold">Giá ưu đãi Pentair:</span>
                          <span className="text-xl font-black text-rose-600 font-mono">
                            {previewItem.data.meta?.salePrice ? (Number(previewItem.data.meta?.salePrice).toLocaleString('vi-VN') + " đ") : "Liên hệ báo giá"}
                          </span>
                        </div>
                      </div>

                      {/* Excerpt */}
                      {previewItem.data.excerpt && (
                        <p className="text-xs text-gray-500 font-sans italic border-l-4 border-blue-600 pl-3">
                          {previewItem.data.excerpt}
                        </p>
                      )}

                      {/* Specs bullet grid */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Thông số kỹ thuật tiêu chuẩn:</span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                          {(previewItem.data.meta?.specs || []).map((sp: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex justify-between gap-1 border border-slate-100">
                              <span className="text-gray-450 font-semibold">{sp.name || 'Thông số'}</span>
                              <strong className="text-slate-800 text-right">{sp.value || 'Liên hệ'}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Description block */}
                  <div className="border-t pt-6 space-y-3">
                    <span className="text-sm font-black uppercase text-slate-900 block border-b pb-1">Chi tiết tính năng vượt trội:</span>
                    <div className="prose max-w-none text-xs sm:text-sm text-gray-700 font-sans whitespace-pre-line leading-relaxed">
                      {previewItem.data.content || "Nội dung sản phẩm chưa được thiết lập."}
                    </div>
                  </div>
                </div>
              )}

              {/* video preview wrapper */}
              {previewItem.type === 'video' && (
                <div className="space-y-4 max-w-2xl mx-auto text-center">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-red-600 uppercase">Mục Phát Video Playlist</span>
                    <h2 className="text-xl font-black text-gray-900">{previewItem.data.title || 'Video Thử Nghiệm'}</h2>
                    <span className="inline-block px-2 py-0.5 bg-red-105 text-[#0C3471]-700 text-[10px] uppercase font-bold rounded-full">
                      {previewItem.data.category}
                    </span>
                  </div>

                  {previewItem.data.videoUrl ? (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border bg-black flex items-center justify-center text-white relative">
                      <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${previewItem.data.thumbnail || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80'})` }}></div>
                      <div className="relative z-10 space-y-2">
                        <span className="text-5xl block">▶</span>
                        <div className="text-xs font-mono font-bold bg-[#0C3471] px-3 py-1 rounded-full border border-white/20 inline-block">
                          Mô phỏng phát: {previewItem.data.videoUrl}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-slate-100 rounded-2xl flex items-center justify-center text-gray-400">
                      Chưa gắn đường dẫn video Youtube
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-gray-650 font-sans text-left leading-relaxed bg-slate-50 p-4 rounded-xl border">
                    {previewItem.data.description || "Video chưa được nhập phần biên dịch mô tả chính thức."}
                  </p>
                </div>
              )}

              {/* perspective preview wrapper */}
              {previewItem.type === 'perspective' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-cyan-600 uppercase">Thiết kế Phối cảnh Phối Hợp Không Gian</span>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900">{previewItem.data.title || "Công Trình Phối Cảnh Độc Quyền"}</h2>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 text-[9px] uppercase font-bold rounded-lg leading-none">
                        Dòng Không gian: {previewItem.data.spaceType || "villa"}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] uppercase font-bold rounded-lg leading-none">
                        Sắp xếp: #{previewItem.data.sortOrder || 1}
                      </span>
                    </div>
                  </div>

                  {previewItem.data.featuredImage && (
                    <img 
                      src={previewItem.data.featuredImage} 
                      className="w-full aspect-[21/9] object-cover rounded-2xl border" 
                      alt="Featured Perspective Space" 
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {previewItem.data.excerpt && (
                    <p className="text-xs sm:text-sm text-gray-500 italic bg-cyan-50/20 p-4 border-l-4 border-cyan-500 rounded-r-xl">
                      {previewItem.data.excerpt}
                    </p>
                  )}

                  {/* HTML Area simulation */}
                  <div className="space-y-2 border-t pt-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Nội dung thuyết minh:</span>
                    <div 
                      className="text-xs sm:text-sm text-gray-750 font-sans leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: previewItem.data.content || "Chưa có nội dung thuyết minh." }}
                    />
                  </div>

                  {/* Gallery listing preview */}
                  {(previewItem.data.gallery || []).length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Album ảnh thực tế công trình thi công:</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {previewItem.data.gallery.map((urlStr: string, idx: number) => (
                          <div key={idx} className="aspect-[16/10] rounded-xl overflow-hidden border">
                            <img src={urlStr.trim()} className="w-full h-full object-cover" alt="Actual Construction Space" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t flex justify-end shrink-0">
              <button 
                onClick={() => setPreviewItem(null)}
                className="px-6 py-2 bg-slate-900 border hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer leading-none"
              >
                Xác nhận đã duyệt (Đóng)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA SELECTOR MODAL DOCK */}
      {activeMediaSelector && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Biên tập & Lựa chọn tệp từ Thư viện Hình ảnh
                </h3>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                  Dễ dàng duyệt tìm thư mục, tệp tin và click nút "Chọn hình ảnh này" để điền trực tiếp vào biểu mẫu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMediaSelector(null)}
                className="p-1 px-2.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                HỦY BỎ <X className="w-5 h-5 bg-slate-900 rounded-full p-1" />
              </button>
            </div>

            <div className="flex-grow overflow-hidden flex flex-col bg-slate-900">
              <MediaLibrary 
                onSelect={(url) => {
                  const target = activeMediaSelector.target;
                  if (target === 'post_featured') {
                    setPostForm(prev => ({ ...prev, featuredImage: url }));
                  } else if (target === 'video_thumbnail') {
                    setVideoForm(prev => ({ ...prev, thumbnail: url }));
                  } else if (target === 'perspective_featured') {
                    setPerspectiveForm(prev => ({ ...prev, featuredImage: url }));
                  } else if (target === 'perspective_gallery') {
                    setTempGalleryInput(prev => {
                      const trimmed = prev.trim();
                      if (!trimmed) return url;
                      return trimmed.endsWith(',') ? `${trimmed} ${url}` : `${trimmed}, ${url}`;
                    });
                  } else if (target === 'perspective_product_gallery') {
                    setTempProductGalleryInput(prev => {
                      const trimmed = prev.trim();
                      if (!trimmed) return url;
                      return trimmed.endsWith(',') ? `${trimmed} ${url}` : `${trimmed}, ${url}`;
                    });
                  }
                  setActiveMediaSelector(null);
                }}
                selectButtonText="XÁC NHẬN CHỌN HÌNH ẢNH NÀY"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
