/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, FileText, ShoppingBag, FolderTree, MessageSquare, Settings2, Sliders,
  Database, ShieldCheck, KeyRound, UserCheck, Plus, Pencil, Trash2, 
  Eye, FileCode, CheckCircle, AlertTriangle, Save, LogOut, ArrowRight, Download, Upload, Shield, RefreshCw, Server,
  Mail, Video, LayoutTemplate, Image, Search, ChevronDown, X, Layout, Link, GripVertical, ChevronUp, Youtube, Loader2, MapPin
} from 'lucide-react';
import { Post, Term, FormSubmission, CMSBackup } from '../types';
import MediaLibrary from './MediaLibrary';
import RichTextEditor from './RichTextEditor';

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
  type AdminTab = 'dashboard' | 'posts' | 'pages' | 'products' | 'categories' | 'submissions' | 'settings' | 'security' | 'backup' | 'supabase' | 'email-settings' | 'videos' | 'perspectives' | 'media' | 'header-footer' | 'homepage';
  const [activeTab, setActiveTab] = React.useState<AdminTab>('dashboard');

  const buildPostFormSnapshot = (form: Partial<Post>) => JSON.stringify({
    title: form.title || '',
    slug: form.slug || '',
    content: form.content || '',
    excerpt: form.excerpt || '',
    type: form.type || 'post',
    status: form.status || 'draft',
    featuredImage: form.featuredImage || '',
    menuOrder: form.menuOrder || 0,
    meta: form.meta || {},
    terms: form.terms || []
  });

  const [postFormBaseline, setPostFormBaseline] = React.useState<string>(() => buildPostFormSnapshot({
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
  }));

  const [actionStatus, setActionStatus] = React.useState({ success: '', error: '' });
  const [actionLoading, setActionLoading] = React.useState(false);

  // SUPABASE INTEGRATION STATES
  const [supabaseConfig, setSupabaseConfig] = React.useState<{ url: string; projectRef: string; hasKey: boolean; apiKeyPreview: string } | null>(null);
  const [supabaseTestResult, setSupabaseTestResult] = React.useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [testingSupabase, setTestingSupabase] = React.useState(false);
  const [dbHost, setDbHost] = React.useState('');
  const [dbPort, setDbPort] = React.useState('5432');
  const [dbName, setDbName] = React.useState('postgres');
  const [dbUser, setDbUser] = React.useState('');
  const [dbPassword, setDbPassword] = React.useState('');
  const [savingSupabase, setSavingSupabase] = React.useState(false);
  const [pushingData, setPushingData] = React.useState(false);
  const [pushDataResult, setPushDataResult] = React.useState<{ success: boolean; message: string; stats?: Record<string,number> } | null>(null);

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
  const [fetchingYt, setFetchingYt] = React.useState(false);

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
    target: 'post_featured' | 'video_thumbnail' | 'perspective_featured' | 'perspective_gallery' | 'perspective_product_gallery' | 'logo_image' | 'footer_logo_image' | 'post_content_editor' | 'softener_slide';
    slideIndex?: number;
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
      fetch('/api/supabase/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setSupabaseConfig(data);
          setDbHost(data.host || '');
          setDbPort(data.port || '5432');
          setDbName(data.database || 'postgres');
          setDbUser(data.user || '');
          setDbPassword(data.hasPassword ? '__SAVED_PASSWORD__' : '');
        })
        .catch(err => console.error("Lỗi tải cấu hình Supabase:", err));
    }
  }, [activeTab]);

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbHost || !dbUser) {
      alert("Vui lòng nhập đầy đủ Host và Username.");
      return;
    }
    setSavingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({
          host: dbHost,
          port: Number(dbPort) || 5432,
          database: dbName || 'postgres',
          user: dbUser,
          password: dbPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSupabaseConfig(data.config);
        setDbPassword(data.config.hasPassword ? '__SAVED_PASSWORD__' : '');
        setSupabaseTestResult({
          success: true,
          message: data.message,
          details: "Cấu hình đã được lưu và tự động đồng bộ hóa toàn bộ cơ sở dữ liệu!"
        });
        triggerToast("Cấu hình PostgreSQL đã được cập nhật thành công!");
      } else {
        setSupabaseTestResult({
          success: false,
          message: data.error || "Không thể lưu cấu hình kết nối."
        });
      }
    } catch (err: any) {
      setSupabaseTestResult({
        success: false,
        message: err.message || "Lỗi khi lưu cấu hình PostgreSQL."
      });
    } finally {
      setSavingSupabase(false);
    }
  };

  const testSupabaseConnection = async () => {
    if (!dbHost || !dbUser) {
      alert("Vui lòng nhập đầy đủ Host và Username để kiểm thử.");
      return;
    }
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await fetch('/api/supabase/test-connection', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({
          host: dbHost,
          port: Number(dbPort) || 5432,
          database: dbName || 'postgres',
          user: dbUser,
          password: dbPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSupabaseTestResult({ success: true, message: data.message, details: data.details });
      } else {
        setSupabaseTestResult({ success: false, message: data.error || "Không thể xác thực kết nối." });
      }
    } catch (err: any) {
      setSupabaseTestResult({ success: false, message: err.message || "Lỗi mạng khi kết nối tới PostgreSQL." });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handlePushData = async () => {
    if (!window.confirm('Bạn có chắc muốn đẩy toàn bộ dữ liệu hiện tại lên Supabase? Thao tác này sẽ ghi đè dữ liệu trên cloud.')) return;
    setPushingData(true);
    setPushDataResult(null);
    try {
      const res = await fetch('/api/supabase/push-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setPushDataResult({ success: true, message: data.message, stats: data.stats });
      } else {
        setPushDataResult({ success: false, message: data.error || 'Lỗi khi đẩy dữ liệu.' });
      }
    } catch (err: any) {
      setPushDataResult({ success: false, message: err.message || 'Lỗi mạng.' });
    } finally {
      setPushingData(false);
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

  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    let cleanUrl = url.trim();
    if (cleanUrl.includes('<iframe')) {
      const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        cleanUrl = srcMatch[1];
      }
    }
    if (cleanUrl.startsWith('//')) {
      cleanUrl = 'https:' + cleanUrl;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleFetchYoutubeInfo = async (silentOnFailure = false) => {
    const videoUrl = videoForm.videoUrl;
    if (!videoUrl) {
      if (!silentOnFailure) setVideoErrorMsg("Vui lòng điền URL video phát trước khi lấy thông tin.");
      return;
    }

    const videoId = extractYoutubeId(videoUrl);
    if (!videoId) {
      if (!silentOnFailure) setVideoErrorMsg("Không thể xác định ID video YouTube từ URL hoặc mã nhúng đã dán. Vui lòng kiểm tra lại đường dẫn.");
      return;
    }

    setFetchingYt(true);
    if (!silentOnFailure) {
      setVideoStatusMsg("");
      setVideoErrorMsg("");
    }

    const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    try {
      let title = "";
      let thumbnail = fallbackThumbnail;

      // 1. Attempt to fetch from YouTube's oEmbed first
      try {
        const ytOembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const res = await fetch(ytOembedUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = data.title;
          if (data.thumbnail_url) thumbnail = data.thumbnail_url;
        }
      } catch (e) {
        console.warn("YouTube oEmbed fetch blocked or failed, trying noembed proxy...", e);
      }

      // 2. If title wasn't fetched, try noembed proxy
      if (!title) {
        try {
          const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
          const res = await fetch(noembedUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.title) title = data.title;
            if (data.thumbnail_url) thumbnail = data.thumbnail_url;
          }
        } catch (e) {
          console.warn("Noembed proxy failed", e);
        }
      }

      setVideoForm(prev => ({
        ...prev,
        title: title || prev.title || "Video YouTube",
        thumbnail: thumbnail
      }));

      setVideoStatusMsg("Đã tự động lấy thông tin tiêu đề và ảnh thumbnail từ YouTube!");
    } catch (err: any) {
      if (!silentOnFailure) {
        setVideoErrorMsg("Lỗi khi tự động lấy thông tin từ YouTube. Bạn vẫn có thể điền thông tin thủ công.");
      }
    } finally {
      setFetchingYt(false);
    }
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
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

  const postFormSnapshot = React.useMemo(() => buildPostFormSnapshot(postForm), [postForm]);
  const isPostFormDirty = React.useMemo(() => {
    if (!editingPostId && !isCreatingNew) return false;
    return postFormSnapshot !== postFormBaseline;
  }, [editingPostId, isCreatingNew, postFormSnapshot, postFormBaseline]);

  const confirmDiscardUnsavedChanges = () => {
    if (!isPostFormDirty) return true;
    return window.confirm('Bạn có thay đổi chưa lưu trong bài viết. Bạn có chắc chắn muốn rời đi và huỷ các thay đổi này?');
  };

  const navigateToTab = (tab: AdminTab) => {
    if (!confirmDiscardUnsavedChanges()) return;
    setActiveTab(tab);
    setIsCreatingNew(false);
    setEditingPostId(null);
  };

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isPostFormDirty) return;
      event.preventDefault();
      event.returnValue = 'Các thay đổi chưa lưu sẽ bị mất nếu bạn rời trang.';
      return event.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPostFormDirty]);

  // TERMS FORM STATES
  const [termForm, setTermForm] = React.useState({ 
    name: '', 
    slug: '', 
    taxonomy: 'category' as 'category' | 'tag' | 'product_cat',
    status: 'publish' as 'publish' | 'hidden'
  });
  const [editingTermId, setEditingTermId] = React.useState<string | null>(null);
  const [selectedInspectTermId, setSelectedInspectTermId] = React.useState<string | null>(null);

  const [brandForm, setBrandForm] = React.useState({
    siteName: 'Pentair Việt Nam',
    tagline: 'Tinh Hoa Lọc Nước Từ Mỹ',
    phone: '1800 8134',
    email: 'pentairvn@gmail.com',
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

  // HEADER & FOOTER MANAGEMENT STATES
  const [headerMenuItems, setHeaderMenuItems] = React.useState<{label: string; url: string}[]>([
    { label: 'Về Pentair', url: '/ve-pentair' },
    { label: 'Sản phẩm', url: '/san-pham' },
    { label: 'Phối cảnh', url: '/phoi-canh' },
    { label: 'Tin tức', url: '/tin-tuc' },
    { label: 'Liên hệ', url: '/lien-he' },
  ]);
  const [headerSettings, setHeaderSettings] = React.useState({
    logoText: 'P',
    logoImageUrl: '',
    topBarHotline: '1800 8134',
    topBarAddress: '90 Đinh Thị Thi, Vạn Phúc City, Thủ Đức',
    topBarTagline: 'Pentair USA - Leading the Water Revolution',
    footerLogoText: 'P',
    footerLogoImageUrl: '',
    footerLogoTextFull: 'PENTAIR VN',
  });
  const [homepageSettings, setHomepageSettings] = React.useState({
    heroTitle: 'GIẢI PHÁP XỬ LÝ NƯỚC HÀNG ĐẦU CHÂU ÂU & BẮC MỸ',
    heroSubtitle: 'Khởi nguồn từ di sản công nghệ hơn nửa thế kỷ, Pentair mang tới đẳng cấp lọc nước tinh khiết vượt trội.',
    heroImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    heroImageTag: 'USA CERTIFIED',
    heroImageTitle: 'Pentair Smart Water System',
    heroImageDesc: 'Kiệt tác nâng tầm giá trị sống dòng biệt thự đơn lập, lâu đài vĩnh cửu.',
    introTitle: 'HƠN 60 NĂM KINH NGHIỆM TRONG NGÀNH XỬ LÝ NƯỚC',
    introBody: 'Pentair là thương hiệu hàng đầu từ Mỹ với hơn 60 năm kinh nghiệm trong lĩnh vực xử lý nước và giải pháp lọc tổng cao cấp. Các sản phẩm của Pentair đều đạt các chứng nhận uy tín về chất lượng và được tin dùng trên toàn thế giới nhờ công nghệ tiên tiến, độ bền vượt trội kết hợp khả năng xử lý nước thông minh mang lại nguồn nước sạch an toàn cho gia đình.',
    introImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    introImageTag: 'Villa Penthouse Integration',
    introImageDesc: 'Tích hợp giải pháp nước tinh khiết chảy qua các không gian bếp hạng sang bậc nhất châu Âu.',
    introFeature1Title: 'Mỹ Quốc',
    introFeature1Desc: 'Sáng lập từ năm 1966 tại Minnesota Hoa Kỳ.',
    introFeature2Title: 'Tiêu chuẩn vàng',
    introFeature2Desc: 'Bộ lọc tối siêu, kiểm định chặt bởi NSF & WQA.',
    introFeature3Title: 'Chăm sóc sâu',
    introFeature3Desc: 'Tái tạo cấu trúc bảo bọc trọn làn da rạng ngời.'
  });
  const [footerPolicies, setFooterPolicies] = React.useState<{title: string; content: string}[]>([
    { title: 'Chính sách giao hàng', content: 'Cam kết tối đa 24h nội thành.' },
    { title: 'Chính sách bảo hành', content: 'Cam kết bảo hành kép 3-5 năm.' },
    { title: 'Chính sách đổi trả', content: 'Đổi mới 1-1 trong 30 ngày.' },
    { title: 'Chính sách bảo mật', content: 'Tuyệt đối an tâm.' },
  ]);
 
  // SOFTENER SLIDES STATE
  interface SoftenerSlide {
    image: string;
    title: string;
    subtitle: string;
    badge: string;
  }
  const defaultSoftenerSlides: SoftenerSlide[] = [
    { image: 'https://images.unsplash.com/photo-1585837575652-267c0ee1228b?auto=format&fit=crop&w=800&q=80', title: 'Giải Pháp Làm Mềm Nước', subtitle: 'Công nghệ trao đổi ion loại bỏ hoàn toàn độ cứng của nước, bảo vệ hệ thống ống nước & thiết bị.', badge: 'CÔNG NGHỆ USA' },
    { image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80', title: 'Bảo Vệ Thiết Bị', subtitle: 'Ngăn ngừa cặn can xi bám vào máy giặt, máy nước nóng và các thiết bị gia dụng quan trọng.', badge: 'TIÊU CHUẨN WQA' },
    { image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80', title: 'Nước Mềm Mại Mỗi Ngày', subtitle: 'Da dẻ mịn màng hơn, tóc óng ả hơn và cảm giác sạch hoàn toàn sau mỗi lần tắm.', badge: 'NSF CERTIFIED' },
  ];
  const [softenerSlides, setSoftenerSlides] = React.useState<SoftenerSlide[]>(defaultSoftenerSlides);
  const [softenerSlideUploading, setSoftenerSlideUploading] = React.useState<number | null>(null);
  const [softenerSaving, setSoftenerSaving] = React.useState(false);
 
  const [hfMenuEditIdx, setHfMenuEditIdx] = React.useState<number | null>(null);
  const [hfMenuEditItem, setHfMenuEditItem] = React.useState({ label: '', url: '' });
  const [hfPolicyEditIdx, setHfPolicyEditIdx] = React.useState<number | null>(null);
  const [hfPolicyEditItem, setHfPolicyEditItem] = React.useState({ title: '', content: '' });
  const [hfShowroomEditIdx, setHfShowroomEditIdx] = React.useState<number | null>(null);
  const [hfShowroomEditItem, setHfShowroomEditItem] = React.useState({ name: '', address: '', phone: '' });
  const [hfSubTab, setHfSubTab] = React.useState<'logo' | 'menu' | 'footer' | 'showrooms'>('logo');
  const [hpSubTab, setHpSubTab] = React.useState<'hero' | 'intro' | 'softener'>('hero');
  const [heroImageUploading, setHeroImageUploading] = React.useState(false);

  const [introImageUploading, setIntroImageUploading] = React.useState(false);
  const [hfSaving, setHfSaving] = React.useState(false);
  const [hfStatusMsg, setHfStatusMsg] = React.useState('');
  const [hfErrorMsg, setHfErrorMsg] = React.useState('');

  // BACKUP CODE-BOX IMPORT
  const [backupJsonText, setBackupJsonText] = React.useState('');

  // INITIATION OPTIONS BIND
  React.useEffect(() => {
    if (options && options.length > 0) {
      const brand = options.find(o => o.optionName === 'brand_settings')?.optionValue || {};
      const seo = options.find(o => o.optionName === 'seo_settings')?.optionValue || {};
      const shows = options.find(o => o.optionName === 'showrooms')?.optionValue || [];
      const hMenu = options.find(o => o.optionName === 'header_menu')?.optionValue;
      const hSettings = options.find(o => o.optionName === 'header_settings')?.optionValue;
      const fPolicies = options.find(o => o.optionName === 'footer_policies')?.optionValue;
      const homeSettings = options.find(o => o.optionName === 'homepage_settings')?.optionValue;
      
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

      if (hMenu && Array.isArray(hMenu)) {
        setHeaderMenuItems(hMenu);
      }
      if (hSettings) {
        setHeaderSettings(prev => ({ ...prev, ...hSettings }));
      }
      if (fPolicies && Array.isArray(fPolicies)) {
        setFooterPolicies(fPolicies);
      }
      if (homeSettings) {
        setHomepageSettings(prev => ({ ...prev, ...homeSettings }));
      }
      const softenerSlidesOpt = options.find(o => o.optionName === 'softener_slides')?.optionValue;
      if (softenerSlidesOpt && Array.isArray(softenerSlidesOpt) && softenerSlidesOpt.length > 0) {
        setSoftenerSlides(softenerSlidesOpt);
      }
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
    if (!confirmDiscardUnsavedChanges()) return;
    setPostForm({ ...p });
    setEditingPostId(p.id);
    setIsCreatingNew(false);
    setPostFormBaseline(buildPostFormSnapshot(p));
  };

  const triggerCreateNewPost = (type: 'post' | 'page' | 'product') => {
    if (!confirmDiscardUnsavedChanges()) return;
    const newForm: Partial<Post> = {
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
    };
    setPostForm(newForm);
    setEditingPostId(null);
    setIsCreatingNew(true);
    setPostFormBaseline(buildPostFormSnapshot(newForm));
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
      // If creating new, switch to edit mode with the returned ID so user stays on form
      if (isCreatingNew && data.id) {
        setIsCreatingNew(false);
        setEditingPostId(data.id);
        setPostForm(prev => ({ ...prev, id: data.id }));
        setPostFormBaseline(buildPostFormSnapshot({ ...postForm, id: data.id }));
      } else {
        // When editing, just update baseline — stay on the same edit page
        setPostFormBaseline(buildPostFormSnapshot(postForm));
      }
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

  // SAVE HOMEPAGE CONFIGS
  const handleSaveHomepageSettings = async () => {
    setHfSaving(true);
    setHfStatusMsg('');
    setHfErrorMsg('');
    try {
      const payload = [
        { id: 'opt-homepage-settings', optionName: 'homepage_settings', optionValue: homepageSettings },
      ];

      const res = await fetch('/api/options', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Lỗi khi lưu cấu hình trang chủ.");
      await onRefreshData();
      triggerToast("Cập nhật Trang chủ thành công.");
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setHfSaving(false);
    }
  };

  // SAVE SOFTENER SLIDES
  const handleSaveSoftenerSlides = async () => {
    setSoftenerSaving(true);
    try {
      const payload = [
        { id: 'opt-softener-slides', optionName: 'softener_slides', optionValue: softenerSlides },
      ];
      const res = await fetch('/api/options', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Lỗi khi lưu danh sách Softener Slides.');
      await onRefreshData();
      triggerToast('Đã cập nhật ảnh Water Softening carousel thành công!');
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setSoftenerSaving(false);
    }
  };

  // UPLOAD SOFTENER SLIDE IMAGE (base64 upload)
  const handleSoftenerSlideUpload = async (slideIdx: number, file: File) => {
    setSoftenerSlideUploading(slideIdx);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64Data = (ev.target?.result as string).split(',')[1];
          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
            },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              base64Data,
              folderId: undefined
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload thất bại.');
          setSoftenerSlides(prev => prev.map((s, i) => i === slideIdx ? { ...s, image: data.url } : s));
          triggerToast('Đã tải lên ảnh slide thành công!');
        } catch (err: any) {
          triggerToast(err.message || 'Lỗi upload ảnh.', true);
        } finally {
          setSoftenerSlideUploading(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      triggerToast(err.message || 'Lỗi đọc file.', true);
      setSoftenerSlideUploading(null);
    }
  };

  // UPLOAD HERO IMAGE
  const handleHeroImageUpload = async (file: File) => {
    setHeroImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64Data = (ev.target?.result as string).split(',')[1];
          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
            },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              base64Data,
              folderId: undefined
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload thất bại.');
          setHomepageSettings(prev => ({ ...prev, heroImage: data.url }));
          triggerToast('Đã tải lên ảnh Hero thành công!');
        } catch (err: any) {
          triggerToast(err.message || 'Lỗi upload ảnh.', true);
        } finally {
          setHeroImageUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      triggerToast(err.message || 'Lỗi đọc file.', true);
      setHeroImageUploading(false);
    }
  };

  // UPLOAD INTRO IMAGE
  const handleIntroImageUpload = async (file: File) => {
    setIntroImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64Data = (ev.target?.result as string).split(',')[1];
          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
            },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              base64Data,
              folderId: undefined
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload thất bại.');
          setHomepageSettings(prev => ({ ...prev, introImage: data.url }));
          triggerToast('Đã tải lên ảnh Intro thành công!');
        } catch (err: any) {
          triggerToast(err.message || 'Lỗi upload ảnh.', true);
        } finally {
          setIntroImageUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      triggerToast(err.message || 'Lỗi đọc file.', true);
      setIntroImageUploading(false);
    }
  };

  // SAVE HEADER & FOOTER CONFIGS
  const handleSaveHeaderFooter = async () => {
    setHfSaving(true);
    setHfStatusMsg('');
    setHfErrorMsg('');
    try {
      const payload = [
        { id: 'opt-header-settings', optionName: 'header_settings', optionValue: headerSettings },
        { id: 'opt-header-menu', optionName: 'header_menu', optionValue: headerMenuItems },
        { id: 'opt-footer-policies', optionName: 'footer_policies', optionValue: footerPolicies },
        { id: 'opt-showrooms', optionName: 'showrooms', optionValue: showroomList },
      ];

      const res = await fetch('/api/options', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Sự cố lưu Header & Footer. Kiểm tra quyền Administrator.');
      await onRefreshData();
      setHfStatusMsg('Đã lưu cấu hình Header & Footer thành công! Thay đổi sẽ hiển thị ngay trên website.');
      setTimeout(() => setHfStatusMsg(''), 5000);
    } catch (err: any) {
      setHfErrorMsg(err.message || 'Lỗi không xác định.');
    } finally {
      setHfSaving(false);
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
              onClick={() => navigateToTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Bảng Tổng Quan
            </button>
            
            <div className="space-y-1" id="posts-nav-group">
              <button 
                onClick={() => navigateToTab('posts')}
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
                    onClick={() => navigateToTab('posts')}
                    className={`w-full flex items-center gap-2.5 py-1.5 px-2 text-[11px] font-semibold rounded-md cursor-pointer transition-all ${activeTab === 'posts' ? 'text-blue-400 bg-blue-950/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'posts' ? 'bg-blue-400' : 'bg-slate-650'}`}></span>
                    Tất cả bài viết
                  </button>
                  <button
                    onClick={() => navigateToTab('categories')}
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
                onClick={() => navigateToTab('pages')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'pages' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <FileCode className="w-4 h-4" />
                Hệ Thống Trang (Pages)
              </button>
            )}

            <button 
              onClick={() => navigateToTab('products')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Quản Trị Sản Phẩm
            </button>

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => navigateToTab('submissions')}
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
                onClick={() => navigateToTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Settings2 className="w-4 h-4" />
                SEO & Brand Cấu Hình
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => navigateToTab('security')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <KeyRound className="w-4 h-4" />
                User & 2FA Trung Tâm
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => navigateToTab('email-settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'email-settings' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Mail className="w-4 h-4" />
                Cấu hình thông báo Email
              </button>
            )}

            <button 
              onClick={() => navigateToTab('videos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'videos' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Video className="w-4 h-4" />
              Quản trị Playlist Video
            </button>

            <button 
              onClick={() => navigateToTab('perspectives')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'perspectives' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <LayoutTemplate className="w-4 h-4" />
              Phối cảnh Không gian
            </button>

            <button 
              onClick={() => navigateToTab('media')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'media' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Image className="w-4 h-4 text-sky-400" />
              Kho Thư Viện Ảnh (Media)
            </button>

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => navigateToTab('backup')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'backup' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Database className="w-4 h-4" />
                Xuất/Nhập Sao Lưu CMS
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => navigateToTab('supabase')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'supabase' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Server className="w-4 h-4 text-emerald-400 animate-pulse" />
                Tích hợp Supabase
              </button>
            )}

            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => navigateToTab('header-footer')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'header-footer' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Layout className="w-4 h-4 text-indigo-400" />
                Giao Diện Header &amp; Footer
              </button>
            )}
            {currentUser.role === 'administrator' && (
              <button 
                onClick={() => navigateToTab('homepage')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg tracking-wide cursor-pointer transition-all ${activeTab === 'homepage' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Layout className="w-4 h-4 text-orange-400" />
                Cài Đặt Trang Chủ
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
                    
                    <RichTextEditor 
                      value={postForm.content}
                      onChange={html => setPostForm({ ...postForm, content: html })}
                      onInsertMediaClick={() => setActiveMediaSelector({ target: 'post_content_editor' })}
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
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Trung Tâm Quản Lý Tích Hợp Supabase (PostgreSQL Session Pooler)</h3>
              </div>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                Đồng bộ hóa dữ liệu CMS trực tiếp với cơ sở dữ liệu cloud Supabase thông qua cơ chế Pooling.
              </p>
            </div>

            {/* Dashboard grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Diagnostics & Connection Status */}
              <div className="lg:col-span-5 space-y-6">
                <form onSubmit={handleSaveSupabaseConfig} className="bg-slate-50 p-6 rounded-2xl border border-gray-200/60 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#062c63] block">Cấu hình kết nối PostgreSQL</span>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 block uppercase">Database Host *</label>
                      <input 
                        type="text"
                        required
                        placeholder="aws-1-ap-[region].pooler.supabase.com"
                        value={dbHost}
                        onChange={e => setDbHost(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none bg-white text-gray-800 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block uppercase">Port *</label>
                        <input 
                          type="text"
                          required
                          placeholder="5432"
                          value={dbPort}
                          onChange={e => setDbPort(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none bg-white text-gray-800 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block uppercase">Database Name *</label>
                        <input 
                          type="text"
                          required
                          placeholder="postgres"
                          value={dbName}
                          onChange={e => setDbName(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none bg-white text-gray-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 block uppercase">Username *</label>
                      <input 
                        type="text"
                        required
                        placeholder="postgres.[ref-id]"
                        value={dbUser}
                        onChange={e => setDbUser(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none bg-white text-gray-800 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 block uppercase">Password *</label>
                      <input 
                        type="password"
                        placeholder={dbPassword === '__SAVED_PASSWORD__' ? "•••••••• (Đã lưu mật khẩu)" : "Nhập mật khẩu database..."}
                        value={dbPassword === '__SAVED_PASSWORD__' ? '' : dbPassword}
                        onChange={e => setDbPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-none bg-white text-gray-800 font-mono"
                      />
                      {dbPassword === '__SAVED_PASSWORD__' && (
                        <p className="text-[10px] text-blue-500 font-sans mt-1">
                          Mật khẩu đã lưu sẽ được giữ lại. Chỉ cần nhập vào đây nếu bạn muốn thay đổi.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={testSupabaseConnection}
                      disabled={testingSupabase || savingSupabase}
                      className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-slate-800 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
                      {testingSupabase ? 'Đang test...' : 'Test kết nối'}
                    </button>

                    <button 
                      type="submit"
                      disabled={savingSupabase || testingSupabase}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                    >
                      {savingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Lưu & Đồng bộ
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

                  {/* Current connection details */}
                  {supabaseConfig && (
                    <div className="pt-2 border-t border-gray-200 space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Database Host:</span>
                        <span className="font-mono text-gray-700 truncate max-w-[180px]" title={supabaseConfig.projectRef}>{supabaseConfig.projectRef}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trạng thái:</span>
                        <span className="font-mono text-emerald-600 font-bold">{supabaseConfig.url ? "Đã cấu hình (Mật khẩu ẩn)" : "Chưa cấu hình"}</span>
                      </div>
                    </div>
                  )}
                </form>

                {/* Guide panel */}
                <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3">
                  <h4 className="text-xs font-black text-blue-900 uppercase font-sans">Lấy thông số kết nối ở đâu?</h4>
                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                    1. Đăng nhập vào trang quản trị <strong>Supabase</strong>.<br />
                    2. Chọn dự án &gt; Nhấn vào biểu tượng <strong>Settings</strong> (Bánh răng) &gt; <strong>Database</strong>.<br />
                    3. Cuộn xuống phần <strong>Connection parameters</strong>.<br />
                    4. Bạn sẽ thấy các trường tương ứng để điền vào form:
                    <ul className="list-disc pl-4 mt-2 space-y-1">
                      <li><strong>Host:</strong> aws-1-ap-...pooler.supabase.com</li>
                      <li><strong>Port:</strong> 5432</li>
                      <li><strong>Database Name:</strong> postgres</li>
                      <li><strong>User:</strong> postgres.[project-ref]</li>
                      <li><strong>Password:</strong> Mật khẩu database của bạn</li>
                    </ul>
                  </p>
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
                  Để lưu trữ dữ liệu CMS đồng bộ lên Supabase, bạn hãy chạy script khởi tạo dưới đây trong <strong className="text-emerald-600 font-semibold font-sans">Supabase SQL Editor</strong> để tạo sẵn các bảng cần thiết:
                </p>

                <textarea 
                  id="supabase-sql-schema"
                  rows={12}
                  readOnly
                  value={`-- Cấu trúc bảng Cấu hình toàn bộ Brand Options & Database Backups\nCREATE TABLE IF NOT EXISTS public.options (\n  id TEXT PRIMARY KEY,\n  option_name TEXT UNIQUE NOT NULL,\n  option_value JSONB DEFAULT '{}'::jsonb\n);\n\n-- (Tùy chọn) Bảng lưu trữ bài viết CMS nếu chạy độc lập\nCREATE TABLE IF NOT EXISTS public.posts (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  slug TEXT UNIQUE NOT NULL,\n  content TEXT,\n  excerpt TEXT,\n  type TEXT,\n  status TEXT,\n  author_id TEXT,\n  featured_image TEXT,\n  menu_order INTEGER DEFAULT 0,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  meta JSONB DEFAULT '{}'::jsonb,\n  terms JSONB DEFAULT '[]'::jsonb\n);`}
                  className="w-full p-4 font-mono text-[10px] text-slate-100 bg-slate-900 border border-gray-150 rounded-2xl leading-relaxed focus:outline-none select-all"
                />

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-[11px] text-amber-850 space-y-1.5 leading-relaxed font-sans">
                  <span className="font-bold uppercase tracking-wide text-amber-900 font-sans block">⚡ TỰ ĐỘNG THIẾT LẬP BẢNG</span>
                  <p className="font-sans">
                    Hệ thống sẽ <strong>tự động tạo đầy đủ tất cả bảng</strong> (posts, terms, users, submissions, videos, perspectives, media_folders, media_items, options) khi bạn nhấn <strong>Lưu &amp; Đồng bộ</strong>.
                    Sau đó nhấn nút bên dưới để đẩy toàn bộ dữ liệu cũ lên các bảng riêng biệt.
                  </p>
                </div>

                {/* Push existing data section */}
                <div className="bg-gradient-to-br from-[#062c63]/5 to-blue-50/50 rounded-2xl border border-blue-200/60 p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#062c63] block">Đẩy Dữ Liệu Cũ Lên Supabase</span>
                    <p className="text-[11px] text-gray-500 font-sans mt-1 leading-relaxed">
                      Đẩy toàn bộ dữ liệu hiện tại (bài viết, sản phẩm, người dùng, liên hệ...) từ máy chủ lên từng bảng riêng biệt trong Supabase. Cần kết nối thành công trước.
                    </p>
                  </div>

                  <button
                    id="btn-push-supabase-data"
                    type="button"
                    onClick={handlePushData}
                    disabled={pushingData}
                    className="w-full py-3 bg-[#062c63] hover:bg-[#0a3d80] disabled:bg-gray-300 text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-sans shadow-md hover:shadow-lg"
                  >
                    {pushingData ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Đang đẩy dữ liệu lên Supabase...</>
                    ) : (
                      <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Đẩy Toàn Bộ Dữ Liệu Lên Supabase</>
                    )}
                  </button>

                  {pushDataResult && (
                    <div className={`p-4 rounded-xl border text-xs space-y-2 ${pushDataResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        {pushDataResult.success ? (
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        )}
                        <span>{pushDataResult.message}</span>
                      </div>
                      {pushDataResult.stats && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {Object.entries(pushDataResult.stats).map(([key, val]) => (
                            <div key={key} className="bg-white/70 rounded-lg p-2 text-center border border-emerald-100">
                              <div className="text-base font-black text-emerald-700">{val}</div>
                              <div className="text-[9px] uppercase font-bold text-gray-500 mt-0.5">{key}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        placeholder="https://www.youtube.com/watch?v=xxx... hoặc embed"
                        value={videoForm.videoUrl}
                        onChange={e => setVideoForm({...videoForm, videoUrl: e.target.value})}
                        onBlur={() => {
                          const vId = extractYoutubeId(videoForm.videoUrl);
                          if (vId && !fetchingYt) {
                            handleFetchYoutubeInfo(true);
                          }
                        }}
                        className="flex-grow px-3 py-2 text-xs border rounded-lg focus:outline-none font-mono"
                        id="input-video-url"
                      />
                      <button
                        type="button"
                        onClick={() => handleFetchYoutubeInfo(false)}
                        disabled={fetchingYt}
                        className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-sm font-sans disabled:opacity-50"
                        title="Tự động lấy tiêu đề và ảnh thumbnail từ YouTube"
                      >
                        {fetchingYt ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
                            Tự động lấy tin
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Ảnh thumbnail đại diện (Image URL) *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
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
                        type="text" 
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
                    <label className="text-[10px] font-bold text-gray-500 block uppercase">Nội dung chi tiết dự án *</label>
                    <RichTextEditor 
                      value={perspectiveForm.content}
                      onChange={html => setPerspectiveForm({...perspectiveForm, content: html})}
                      onInsertMediaClick={() => setActiveMediaSelector({ target: 'post_content_editor' })}
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

        {/* --------------------------------------------------------------------------------------------------------------------------------------
            SUB-PANEL: HEADER & FOOTER MANAGEMENT
            -------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeTab === 'header-footer' && (
          <div className="space-y-6 animate-fadeIn" id="panel-header-footer">

            {/* Header strip */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg">
              <div className="flex items-center gap-3 mb-1">
                <Layout className="w-6 h-6 text-indigo-200" />
                <h2 className="text-lg font-black uppercase tracking-tight">Quản Lý Header &amp; Footer</h2>
              </div>
              <p className="text-indigo-200 text-xs font-sans">Chỉnh sửa logo, thanh top bar, menu điều hướng và các chính sách footer. Mọi thay đổi được lưu vào database và hiển thị ngay trên website.</p>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 pb-0">
              {([
                { key: 'logo', label: 'Logo & Top Bar', icon: <Image className="w-4 h-4" /> },
                { key: 'menu', label: 'Menu Điều Hướng', icon: <Link className="w-4 h-4" /> },
                { key: 'footer', label: 'Chính Sách Footer', icon: <Layout className="w-4 h-4" /> },
                { key: 'showrooms', label: 'Hệ Thống Showroom', icon: <MapPin className="w-4 h-4" /> },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setHfSubTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${hfSubTab === tab.key ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                  id={`btn-hf-tab-${tab.key}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* STATUS MESSAGES */}
            {hfStatusMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {hfStatusMsg}
              </div>
            )}
            {hfErrorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {hfErrorMsg}
              </div>
            )}

            {/* ---- TAB 1: LOGO & TOP BAR ---- */}
            {hfSubTab === 'logo' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                  <h3 className="text-sm font-black uppercase text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Image className="w-4 h-4 text-indigo-500" />
                    Logo &amp; Thanh Top Bar
                  </h3>

                  {/* LOGO HEADER */}
                  <div className="space-y-4 border-b border-gray-100 pb-4">
                    <h4 className="text-xs font-bold uppercase text-indigo-600">Logo Trên Header</h4>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">URL Ảnh Logo Header</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={headerSettings.logoImageUrl}
                          onChange={e => setHeaderSettings(prev => ({ ...prev, logoImageUrl: e.target.value }))}
                          placeholder="https://... (để trống sẽ dùng chữ logo)"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-logo-image-url"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveMediaSelector({ target: 'logo_image' })}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap"
                          id="btn-logo-pick-media"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Thư Viện
                        </button>
                        {headerSettings.logoImageUrl && (
                          <button
                            type="button"
                            onClick={() => setHeaderSettings(prev => ({ ...prev, logoImageUrl: '' }))}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Chữ Logo Header (khi không có ảnh)</label>
                      <input
                        type="text"
                        value={headerSettings.logoText}
                        onChange={e => setHeaderSettings(prev => ({ ...prev, logoText: e.target.value }))}
                        placeholder="P"
                        maxLength={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        id="input-logo-text"
                      />
                    </div>
                  </div>

                  {/* LOGO FOOTER */}
                  <div className="space-y-4 border-b border-gray-100 pb-4 pt-2">
                    <h4 className="text-xs font-bold uppercase text-indigo-600">Logo Dưới Footer</h4>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">URL Ảnh Logo Footer</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={headerSettings.footerLogoImageUrl || ''}
                          onChange={e => setHeaderSettings(prev => ({ ...prev, footerLogoImageUrl: e.target.value }))}
                          placeholder="https://... (để trống sẽ dùng chữ logo)"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-footer-logo-image-url"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveMediaSelector({ target: 'footer_logo_image' })}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap"
                          id="btn-footer-logo-pick-media"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Thư Viện
                        </button>
                        {headerSettings.footerLogoImageUrl && (
                          <button
                            type="button"
                            onClick={() => setHeaderSettings(prev => ({ ...prev, footerLogoImageUrl: '' }))}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Ký tự Logo viết tắt</label>
                        <input
                          type="text"
                          value={headerSettings.footerLogoText || ''}
                          onChange={e => setHeaderSettings(prev => ({ ...prev, footerLogoText: e.target.value }))}
                          placeholder="P"
                          maxLength={3}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-footer-logo-text"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Tên thương hiệu đầy đủ</label>
                        <input
                          type="text"
                          value={headerSettings.footerLogoTextFull || ''}
                          onChange={e => setHeaderSettings(prev => ({ ...prev, footerLogoTextFull: e.target.value }))}
                          placeholder="PENTAIR VN"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-footer-logo-text-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Hotline Top Bar</label>
                    <input
                      type="text"
                      value={headerSettings.topBarHotline}
                      onChange={e => setHeaderSettings(prev => ({ ...prev, topBarHotline: e.target.value }))}
                      placeholder="1800 8134"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      id="input-topbar-hotline"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Địa chỉ Top Bar</label>
                    <input
                      type="text"
                      value={headerSettings.topBarAddress}
                      onChange={e => setHeaderSettings(prev => ({ ...prev, topBarAddress: e.target.value }))}
                      placeholder="90 Đinh Thị Thi, Vạn Phúc City..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      id="input-topbar-address"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Link Google Maps (Iframe SRC)</label>
                    <input
                      type="text"
                      value={headerSettings.mapIframeUrl || ''}
                      onChange={e => setHeaderSettings(prev => ({ ...prev, mapIframeUrl: e.target.value }))}
                      placeholder="https://maps.google.com/maps?..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      id="input-map-iframe"
                    />
                    <p className="text-[10px] text-gray-400">Dán trực tiếp URL thẻ src="" khi bạn lấy mã nhúng từ Google Maps (bỏ các thẻ &lt;iframe&gt;).</p>
                  </div>

                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase text-gray-500 border-b pb-2">Xem trước Header</h3>
                    {/* Top bar preview */}
                    <div className="bg-[#0C3471] text-white text-[10px] px-3 py-2 rounded-lg flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span>📞 Hotline: <strong>{headerSettings.topBarHotline || '1800 8134'}</strong></span>
                        <span className="hidden sm:block">📍 {headerSettings.topBarAddress || 'Địa chỉ'}</span>
                      </div>
                    </div>
                    {/* Main bar preview */}
                    <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
                      {headerSettings.logoImageUrl ? (
                        <img src={headerSettings.logoImageUrl} alt="Logo" className="h-8 object-contain" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#0C3471] flex items-center justify-center text-white font-extrabold text-base shadow-md">
                          {headerSettings.logoText || 'P'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-sans">
                    <strong className="block text-[11px] uppercase mb-1">💡 Hướng dẫn:</strong>
                    Sau khi nhập URL ảnh logo, nhấn Save để lưu. Logo mới sẽ hiển thị ngay trên website công cộng sau khi tải lại trang.
                  </div>
                </div>
              </div>
            )}

            {/* ---- TAB 2: MENU ITEMS ---- */}
            {hfSubTab === 'menu' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Menu list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-sm font-black uppercase text-gray-800 flex items-center gap-2">
                      <Link className="w-4 h-4 text-indigo-500" />
                      Danh Sách Menu ({headerMenuItems.length} mục)
                    </h3>
                    <button
                      onClick={() => {
                        setHfMenuEditIdx(headerMenuItems.length);
                        setHfMenuEditItem({ label: '', url: '/' });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer"
                      id="btn-hf-add-menu"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm mục
                    </button>
                  </div>

                  <div className="space-y-2">
                    {headerMenuItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-800 truncate">{item.label}</div>
                          <div className="text-[10px] text-gray-400 font-mono truncate">{item.url}</div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setHfMenuEditIdx(idx);
                              setHfMenuEditItem({ label: item.label, url: item.url });
                            }}
                            className="p-1 text-indigo-500 hover:bg-indigo-50 rounded cursor-pointer"
                            title="Sửa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Xóa mục menu "${item.label}"?`)) {
                                setHeaderMenuItems(prev => prev.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (idx > 0) {
                                const next = [...headerMenuItems];
                                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                setHeaderMenuItems(next);
                              }
                            }}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
                            title="Lên"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (idx < headerMenuItems.length - 1) {
                                const next = [...headerMenuItems];
                                [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                setHeaderMenuItems(next);
                              }
                            }}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
                            title="Xuống"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {headerMenuItems.length === 0 && (
                      <p className="text-xs text-center text-gray-400 py-6">Chưa có mục menu nào. Nhấn "Thêm mục" để bắt đầu.</p>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                <div className="space-y-4">
                  {hfMenuEditIdx !== null ? (
                    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase text-indigo-700 border-b pb-2">
                        {hfMenuEditIdx === headerMenuItems.length ? '➕ Thêm mục menu mới' : `✏️ Sửa mục #${hfMenuEditIdx + 1}`}
                      </h3>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Tên hiển thị *</label>
                        <input
                          type="text"
                          value={hfMenuEditItem.label}
                          onChange={e => setHfMenuEditItem(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="Ví dụ: Về Pentair"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-menu-label"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Đường dẫn URL *</label>
                        <input
                          type="text"
                          value={hfMenuEditItem.url}
                          onChange={e => setHfMenuEditItem(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="Ví dụ: /ve-pentair"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-menu-url"
                        />
                        <p className="text-[10px] text-gray-400">URL nội bộ bắt đầu bằng "/" hoặc URL ngoài dạng "https://..."</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!hfMenuEditItem.label.trim() || !hfMenuEditItem.url.trim()) return;
                            const next = [...headerMenuItems];
                            if (hfMenuEditIdx === headerMenuItems.length) {
                              next.push(hfMenuEditItem);
                            } else {
                              next[hfMenuEditIdx] = hfMenuEditItem;
                            }
                            setHeaderMenuItems(next);
                            setHfMenuEditIdx(null);
                            setHfMenuEditItem({ label: '', url: '' });
                          }}
                          className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                          id="btn-hf-save-menu-item"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {hfMenuEditIdx === headerMenuItems.length ? 'Thêm vào danh sách' : 'Cập nhật mục'}
                        </button>
                        <button
                          onClick={() => { setHfMenuEditIdx(null); setHfMenuEditItem({ label: '', url: '' }); }}
                          className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-xs text-indigo-700 font-sans space-y-2">
                      <strong className="block text-[11px] uppercase">💡 Hướng dẫn Menu:</strong>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Nhấn nút <strong>Sửa (bút)</strong> bên cạnh từng mục để chỉnh sửa.</li>
                        <li>Nhấn <strong>Lên/Xuống</strong> để sắp xếp lại thứ tự hiển thị.</li>
                        <li>Nhấn <strong>Xóa (thùng rác)</strong> để xóa mục menu.</li>
                        <li>Sau khi điều chỉnh, nhấn <strong>Lưu tất cả thay đổi</strong> phía dưới để áp dụng.</li>
                      </ul>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                    <h4 className="text-[11px] font-black uppercase text-gray-400">Xem trước menu navigation</h4>
                    <div className="flex flex-wrap gap-2">
                      {headerMenuItems.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-full">
                          {item.label}
                        </span>
                      ))}
                      {headerMenuItems.length === 0 && <span className="text-[11px] text-gray-300">Chưa có mục menu</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- TAB 3: FOOTER POLICIES ---- */}
            {hfSubTab === 'footer' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Policies list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-sm font-black uppercase text-gray-800 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-indigo-500" />
                      Chính Sách ({footerPolicies.length} mục)
                    </h3>
                    <button
                      onClick={() => {
                        setHfPolicyEditIdx(footerPolicies.length);
                        setHfPolicyEditItem({ title: '', content: '' });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer"
                      id="btn-hf-add-policy"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm chính sách
                    </button>
                  </div>

                  <div className="space-y-2">
                    {footerPolicies.map((policy, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-800">{policy.title}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{policy.content}</div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setHfPolicyEditIdx(idx);
                                setHfPolicyEditItem({ title: policy.title, content: policy.content });
                              }}
                              className="p-1 text-indigo-500 hover:bg-indigo-50 rounded cursor-pointer"
                              title="Sửa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Xóa chính sách "${policy.title}"?`)) {
                                  setFooterPolicies(prev => prev.filter((_, i) => i !== idx));
                                }
                              }}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {footerPolicies.length === 0 && (
                      <p className="text-xs text-center text-gray-400 py-6">Chưa có chính sách nào.</p>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                <div className="space-y-4">
                  {hfPolicyEditIdx !== null ? (
                    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase text-indigo-700 border-b pb-2">
                        {hfPolicyEditIdx === footerPolicies.length ? '➕ Thêm chính sách mới' : `✏️ Sửa chính sách #${hfPolicyEditIdx + 1}`}
                      </h3>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Tiêu đề chính sách *</label>
                        <input
                          type="text"
                          value={hfPolicyEditItem.title}
                          onChange={e => setHfPolicyEditItem(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ví dụ: Chính sách giao hàng"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-policy-title"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Nội dung chi tiết *</label>
                        <textarea
                          value={hfPolicyEditItem.content}
                          onChange={e => setHfPolicyEditItem(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Mô tả chi tiết nội dung chính sách..."
                          rows={5}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          id="input-policy-content"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!hfPolicyEditItem.title.trim() || !hfPolicyEditItem.content.trim()) return;
                            const next = [...footerPolicies];
                            if (hfPolicyEditIdx === footerPolicies.length) {
                              next.push(hfPolicyEditItem);
                            } else {
                              next[hfPolicyEditIdx] = hfPolicyEditItem;
                            }
                            setFooterPolicies(next);
                            setHfPolicyEditIdx(null);
                            setHfPolicyEditItem({ title: '', content: '' });
                          }}
                          className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                          id="btn-hf-save-policy-item"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {hfPolicyEditIdx === footerPolicies.length ? 'Thêm chính sách' : 'Cập nhật'}
                        </button>
                        <button
                          onClick={() => { setHfPolicyEditIdx(null); setHfPolicyEditItem({ title: '', content: '' }); }}
                          className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0C3471]/5 border border-[#0C3471]/10 rounded-2xl p-5 text-xs text-[#0C3471] font-sans space-y-2">
                      <strong className="block text-[11px] uppercase">💡 Footer Policies:</strong>
                      <p>Các chính sách này hiển thị trong cột "Chính Sách Khách Hàng" ở footer website. Khi khách nhấn vào, sẽ hiện popup với nội dung chi tiết.</p>
                    </div>
                  )}

                  {/* Footer preview */}
                  <div className="bg-[#0C3471] rounded-2xl p-4 space-y-2">
                    <h4 className="text-[11px] font-black uppercase text-blue-300">Xem trước Footer Policies</h4>
                    <div className="space-y-1">
                      {footerPolicies.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 text-[11px]">
                          <span className="text-blue-100 font-medium">{p.title}</span>
                          <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-blue-200">Chi tiết</span>
                        </div>
                      ))}
                      {footerPolicies.length === 0 && <p className="text-blue-300/50 text-[11px]">Chưa có chính sách</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- TAB 4: SHOWROOMS ---- */}
            {hfSubTab === 'showrooms' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Showroom list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                   <div className="flex justify-between items-center border-b pb-3">
                     <h3 className="text-sm font-black uppercase text-gray-800 flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-indigo-500" />
                       Hệ Thống Showroom ({showroomList.length} showroom)
                     </h3>
                     <button
                       onClick={() => {
                         setHfShowroomEditIdx(showroomList.length);
                         setHfShowroomEditItem({ name: '', address: '', phone: '' });
                       }}
                       className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer"
                       id="btn-hf-add-showroom"
                     >
                       <Plus className="w-3.5 h-3.5" />
                       Thêm Showroom
                     </button>
                   </div>

                   <div className="space-y-2">
                     {showroomList.map((show, idx) => (
                       <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                         <div className="flex items-start justify-between gap-2">
                           <div className="flex-1 min-w-0">
                             <div className="text-xs font-bold text-gray-800">{show.name}</div>
                             <div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{show.address}</div>
                             <div className="text-[10px] text-indigo-600 mt-0.5 font-semibold">📞 SĐT: {show.phone}</div>
                           </div>
                           <div className="flex gap-1 shrink-0">
                             <button
                               onClick={() => {
                                 setHfShowroomEditIdx(idx);
                                 setHfShowroomEditItem({ name: show.name || '', address: show.address || '', phone: show.phone || '' });
                               }}
                               className="p-1 text-indigo-500 hover:bg-indigo-50 rounded cursor-pointer"
                               title="Sửa"
                             >
                               <Pencil className="w-3.5 h-3.5" />
                             </button>
                             <button
                               onClick={() => {
                                 if (window.confirm(`Xóa showroom "${show.name}"?`)) {
                                   setShowroomList(prev => prev.filter((_, i) => i !== idx));
                                 }
                               }}
                               className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                               title="Xóa"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         </div>
                       </div>
                     ))}
                     {showroomList.length === 0 && (
                       <p className="text-xs text-center text-gray-400 py-6">Chưa có showroom nào.</p>
                     )}
                   </div>
                </div>

                {/* Edit form */}
                <div className="space-y-4">
                  {hfShowroomEditIdx !== null ? (
                    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase text-indigo-700 border-b pb-2">
                        {hfShowroomEditIdx === showroomList.length ? '➕ Thêm showroom mới' : `✏️ Sửa showroom #${hfShowroomEditIdx + 1}`}
                      </h3>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Tên Showroom *</label>
                        <input
                          type="text"
                          value={hfShowroomEditItem.name}
                          onChange={e => setHfShowroomEditItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ví dụ: Showroom Thủ Đức (Vạn Phúc City)"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-showroom-name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Địa chỉ Showroom *</label>
                        <input
                          type="text"
                          value={hfShowroomEditItem.address}
                          onChange={e => setHfShowroomEditItem(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Ví dụ: 90 Đ. Đinh Thị Thi, Khu đô thị Vạn Phúc..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-showroom-address"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Số điện thoại *</label>
                        <input
                          type="text"
                          value={hfShowroomEditItem.phone}
                          onChange={e => setHfShowroomEditItem(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Ví dụ: 1800 8134"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          id="input-showroom-phone"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!hfShowroomEditItem.name.trim() || !hfShowroomEditItem.address.trim() || !hfShowroomEditItem.phone.trim()) return;
                            const next = [...showroomList];
                            if (hfShowroomEditIdx === showroomList.length) {
                              next.push(hfShowroomEditItem);
                            } else {
                              next[hfShowroomEditIdx] = hfShowroomEditItem;
                            }
                            setShowroomList(next);
                            setHfShowroomEditIdx(null);
                            setHfShowroomEditItem({ name: '', address: '', phone: '' });
                          }}
                          className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                          id="btn-hf-save-showroom-item"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {hfShowroomEditIdx === showroomList.length ? 'Thêm Showroom' : 'Cập nhật'}
                        </button>
                        <button
                          onClick={() => { setHfShowroomEditIdx(null); setHfShowroomEditItem({ name: '', address: '', phone: '' }); }}
                          className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0C3471]/5 border border-[#0C3471]/10 rounded-2xl p-5 text-xs text-[#0C3471] font-sans space-y-2">
                      <strong className="block text-[11px] uppercase">💡 Quản lý Showroom:</strong>
                      <p>Hệ thống showroom sẽ hiển thị ở chân trang (Footer) và các trang liên quan để Khách hàng tiện theo dõi, liên hệ.</p>
                    </div>
                  )}

                  {/* Footer showroom preview */}
                  <div className="bg-[#0C3471] rounded-2xl p-4 space-y-2 text-white">
                    <h4 className="text-[11px] font-black uppercase text-blue-300">Xem trước Footer Showrooms</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {showroomList.map((show, idx) => (
                        <div key={idx} className="bg-white/5 p-2 rounded border border-white/5 text-[10px]">
                          <div className="font-bold text-white">{show.name}</div>
                          <div className="text-blue-200 mt-0.5 line-clamp-1">{show.address}</div>
                          <div className="text-blue-100 font-semibold mt-0.5">SĐT: {show.phone}</div>
                        </div>
                      ))}
                      {showroomList.length === 0 && <p className="text-blue-300/50 text-[11px] col-span-2">Chưa có showroom</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SAVE BUTTON */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-gray-500 font-sans">
                <strong className="text-gray-700">Lưu ý:</strong> Nhấn nút lưu để áp dụng tất cả thay đổi (logo, menu, chính sách) vào database. Website sẽ cập nhật ngay sau đó.
              </div>
              <button
                onClick={handleSaveHeaderFooter}
                disabled={hfSaving}
                className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md ${hfSaving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
                id="btn-save-header-footer"
              >
                {hfSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {hfSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi Header & Footer'}
              </button>
            </div>

          </div>
        )}

        {/* ==========================================
            HOMEPAGE SETTINGS PANEL (Water Softening Carousel)
            ========================================== */}
        {activeTab === 'homepage' && (
          <div className="space-y-6 animate-fadeIn" id="panel-homepage-settings">

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 rounded-2xl text-white shadow-lg">
              <div className="flex items-center gap-3 mb-1">
                <Image className="w-6 h-6 text-orange-200" />
                <h2 className="text-lg font-black uppercase tracking-tight">Cài Đặt Trang Chủ</h2>
              </div>
              <p className="text-orange-100 text-xs font-sans">Quản lý hình ảnh, nội dung cho Banner chính (Hero), phần Giới thiệu (Intro) và phần Water Softening Solution trên trang chủ.</p>
            </div>

            {/* Sub-tab Selection */}
            <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-xs gap-1">
              <button
                type="button"
                onClick={() => setHpSubTab('hero')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer text-center ${
                  hpSubTab === 'hero'
                    ? 'border-orange-600 text-orange-600 font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Hero Banner (Ảnh & Chữ đầu trang)
              </button>
              <button
                type="button"
                onClick={() => setHpSubTab('intro')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer text-center ${
                  hpSubTab === 'intro'
                    ? 'border-orange-600 text-orange-600 font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Giới thiệu (Ảnh & Chữ phần thân)
              </button>
              <button
                type="button"
                onClick={() => setHpSubTab('softener')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer text-center ${
                  hpSubTab === 'softener'
                    ? 'border-orange-600 text-orange-600 font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Làm mềm nước (Softener Carousel)
              </button>
            </div>

            {/* HERO BANNER TAB */}
            {hpSubTab === 'hero' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-sm font-black uppercase text-gray-800 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-500" />
                    Cấu Hình Hero Banner (Bên Phải Là Hình Ảnh Vòi Nước/Phòng Tắm)
                  </h3>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">Thay đổi nội dung tiêu đề, phụ đề và hình ảnh đại diện nổi bật phía bên phải của Banner trang chủ.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: text inputs */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 block">Tiêu đề Hero chính</label>
                      <input
                        type="text"
                        value={homepageSettings.heroTitle}
                        onChange={e => setHomepageSettings(prev => ({ ...prev, heroTitle: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="GIẢI PHÁP XỬ LÝ NƯỚC HÀNG ĐẦU CHÂU ÂU & BẮC MỸ"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 block">Tiêu đề phụ / Subtitle</label>
                      <textarea
                        rows={3}
                        value={homepageSettings.heroSubtitle}
                        onChange={e => setHomepageSettings(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                        placeholder="Khởi nguồn từ di sản công nghệ..."
                      />
                    </div>

                    <div className="border-t pt-4 mt-4 space-y-4">
                      <h4 className="text-xs font-black uppercase text-gray-650">Thông tin thẻ thông tin đè lên ảnh (Card Info overlay)</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 block">Nhãn thẻ (VD: "USA CERTIFIED")</label>
                          <input
                            type="text"
                            value={homepageSettings.heroImageTag}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, heroImageTag: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 block">Tiêu đề thẻ (VD: "Pentair Smart...")</label>
                          <input
                            type="text"
                            value={homepageSettings.heroImageTitle}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, heroImageTitle: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500 block">Mô tả ngắn của thẻ</label>
                        <textarea
                          rows={2}
                          value={homepageSettings.heroImageDesc}
                          onChange={e => setHomepageSettings(prev => ({ ...prev, heroImageDesc: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: image settings */}
                  <div className="md:col-span-5 space-y-4">
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">Hình ảnh Banner bên phải</label>
                    
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-100 group flex items-center justify-center">
                      {homepageSettings.heroImage ? (
                        <>
                          <img 
                            src={homepageSettings.heroImage} 
                            alt="Hero preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label 
                              className="px-3 py-1.5 bg-white text-gray-800 text-[11px] font-bold rounded-lg cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                              htmlFor="hero-image-file-input"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Đổi ảnh
                            </label>
                            <button
                              type="button"
                              onClick={() => setActiveMediaSelector({ target: 'homepage_hero_image' })}
                              className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                            >
                              <Image className="w-3.5 h-3.5" />
                              Media
                            </button>
                          </div>
                        </>
                      ) : (
                        <label 
                          htmlFor="hero-image-file-input"
                          className="flex flex-col items-center justify-center h-full gap-2 cursor-pointer hover:bg-gray-150 transition-colors p-4"
                        >
                          {heroImageUploading ? (
                            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-300" />
                              <span className="text-[11px] text-gray-400 font-sans text-center">Tải ảnh lên hoặc chọn từ thư viện</span>
                            </>
                          )}
                        </label>
                      )}
                      {heroImageUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      id="hero-image-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleHeroImageUpload(file);
                        e.target.value = '';
                      }}
                    />

                    <div className="flex gap-2">
                      <label
                        htmlFor="hero-image-file-input"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Tải ảnh lên
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveMediaSelector({ target: 'homepage_hero_image' })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        <Image className="w-3.5 h-3.5" />
                        Thư viện ảnh
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-gray-400 block">Địa chỉ liên kết ảnh (URL)</label>
                      <input
                        type="text"
                        value={homepageSettings.heroImage || ''}
                        onChange={e => setHomepageSettings(prev => ({ ...prev, heroImage: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <p className="text-[11px] text-gray-400 font-sans">Sau khi lưu, thay đổi của bạn sẽ được hiển thị ngay lập tức trên trang chủ ở đầu trang.</p>
                  <button
                    type="button"
                    onClick={handleSaveHomepageSettings}
                    disabled={hfSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md ${hfSaving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'}`}
                  >
                    {hfSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {hfSaving ? 'Đang lưu...' : 'Lưu cài đặt Hero Banner'}
                  </button>
                </div>
              </div>
            )}

            {/* INTRO SECTION TAB */}
            {hpSubTab === 'intro' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-sm font-black uppercase text-gray-800 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-500" />
                    Cấu Hình Phần Giới Thiệu (Thân Trang Chủ)
                  </h3>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">Quản lý tiêu đề, mô tả và hình ảnh giới thiệu công nghệ lọc nước Pentair Hoa Kỳ.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: text inputs */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 block">Tiêu đề chính giới thiệu</label>
                      <input
                        type="text"
                        value={homepageSettings.introTitle}
                        onChange={e => setHomepageSettings(prev => ({ ...prev, introTitle: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="HƠN 60 NĂM KINH NGHIỆM TRONG NGÀNH XỬ LÝ NƯỚC"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 block">Nội dung giới thiệu chi tiết</label>
                      <textarea
                        rows={5}
                        value={homepageSettings.introBody}
                        onChange={e => setHomepageSettings(prev => ({ ...prev, introBody: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y"
                        placeholder="Pentair là thương hiệu hàng đầu từ Mỹ..."
                      />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-xs font-black uppercase text-gray-650">Thẻ mô tả đè lên ảnh giới thiệu</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 block">Nhãn thẻ (VD: "Villa Penthouse Integration")</label>
                          <input
                            type="text"
                            value={homepageSettings.introImageTag}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, introImageTag: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 block">Mô tả thẻ</label>
                          <input
                            type="text"
                            value={homepageSettings.introImageDesc}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, introImageDesc: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Features section (3 items) */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-xs font-black uppercase text-gray-650">3 Đặc Điểm Nổi Bật Nhanh (Dưới đoạn mô tả)</h4>
                      
                      {/* Feature 1 */}
                      <div className="p-3 bg-gray-55 rounded-xl border border-gray-150 space-y-2">
                        <span className="text-[9px] font-mono uppercase text-orange-600 font-bold">Đặc điểm #1</span>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={homepageSettings.introFeature1Title}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, introFeature1Title: e.target.value }))}
                            className="col-span-1 border border-gray-200 rounded-lg px-2 py-1 text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Mỹ Quốc"
                          />
                          <input
                            type="text"
                            value={homepageSettings.introFeature1Desc}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, introFeature1Desc: e.target.value }))}
                            className="col-span-2 border border-gray-200 rounded-lg px-2 py-1 text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Sáng lập từ năm 1966 tại Minnesota..."
                          />
                        </div>
                      </div>

                      {/* Feature 2 */}
                      <div className="p-3 bg-gray-55 rounded-xl border border-gray-150 space-y-2">
                        <span className="text-[9px] font-mono uppercase text-orange-600 font-bold">Đặc điểm #2</span>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={homepageSettings.introFeature2Title}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, introFeature2Title: e.target.value }))}
                            className="col-span-1 border border-gray-200 rounded-lg px-2 py-1 text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Tiêu chuẩn"
                          />
                          <input
                            type="text"
                            value={homepageSettings.introFeature2Desc}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, introFeature2Desc: e.target.value }))}
                            className="col-span-2 border border-gray-200 rounded-lg px-2 py-1 text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Đạt kiểm định NSF & WQA..."
                          />
                        </div>
                      </div>

                      {/* Feature 3 */}
                      <div className="p-3 bg-gray-55 rounded-xl border border-gray-150 space-y-2">
                        <span className="text-[9px] font-mono uppercase text-orange-600 font-bold">Đặc điểm #3</span>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={homepageSettings.introFeature3Title}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, introFeature3Title: e.target.value }))}
                            className="col-span-1 border border-gray-200 rounded-lg px-2 py-1 text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Chăm sóc sâu"
                          />
                          <input
                            type="text"
                            value={homepageSettings.introFeature3Desc}
                            onChange={e => setHomepageSettings(prev => ({ ...prev, introFeature3Desc: e.target.value }))}
                            className="col-span-2 border border-gray-200 rounded-lg px-2 py-1 text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Tái tạo cấu trúc bảo vệ da tóc..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: image settings */}
                  <div className="md:col-span-5 space-y-4">
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">Hình ảnh giới thiệu</label>
                    
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-100 group flex items-center justify-center">
                      {homepageSettings.introImage ? (
                        <>
                          <img 
                            src={homepageSettings.introImage} 
                            alt="Intro preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label 
                              className="px-3 py-1.5 bg-white text-gray-800 text-[11px] font-bold rounded-lg cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                              htmlFor="intro-image-file-input"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Đổi ảnh
                            </label>
                            <button
                              type="button"
                              onClick={() => setActiveMediaSelector({ target: 'homepage_intro_image' })}
                              className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                            >
                              <Image className="w-3.5 h-3.5" />
                              Media
                            </button>
                          </div>
                        </>
                      ) : (
                        <label 
                          htmlFor="intro-image-file-input"
                          className="flex flex-col items-center justify-center h-full gap-2 cursor-pointer hover:bg-gray-150 transition-colors p-4"
                        >
                          {introImageUploading ? (
                            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-300" />
                              <span className="text-[11px] text-gray-400 font-sans text-center">Tải ảnh lên hoặc chọn từ thư viện</span>
                            </>
                          )}
                        </label>
                      )}
                      {introImageUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      id="intro-image-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleIntroImageUpload(file);
                        e.target.value = '';
                      }}
                    />

                    <div className="flex gap-2">
                      <label
                        htmlFor="intro-image-file-input"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Tải ảnh lên
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveMediaSelector({ target: 'homepage_intro_image' })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        <Image className="w-3.5 h-3.5" />
                        Thư viện ảnh
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-gray-400 block">Địa chỉ liên kết ảnh (URL)</label>
                      <input
                        type="text"
                        value={homepageSettings.introImage || ''}
                        onChange={e => setHomepageSettings(prev => ({ ...prev, introImage: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <p className="text-[11px] text-gray-400 font-sans">Sau khi lưu, thay đổi của bạn sẽ được hiển thị ngay lập tức trên phần giới thiệu giới thiệu ở trang chủ.</p>
                  <button
                    type="button"
                    onClick={handleSaveHomepageSettings}
                    disabled={hfSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md ${hfSaving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'}`}
                  >
                    {hfSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {hfSaving ? 'Đang lưu...' : 'Lưu cài đặt Giới Thiệu'}
                  </button>
                </div>
              </div>
            )}

            {/* SOFTENER SLIDES MANAGER */}
            {hpSubTab === 'softener' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-gray-800 flex items-center gap-2">
                    <Image className="w-4 h-4 text-orange-500" />
                    Carousel Ảnh "Water Softening Solution" ({softenerSlides.length} slides)
                  </h3>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">Mỗi slide hiển thị một hình ảnh, tiêu đề, phụ đề và nhãn badge. Click "Chọn Ảnh" hoặc kéo thả file để tải lên.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSoftenerSlides(prev => [...prev, { image: '', title: 'Tiêu đề slide mới', subtitle: 'Mô tả ngắn về tính năng của sản phẩm Pentair.', badge: 'PENTAIR USA' }])}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-[11px] font-bold rounded-lg hover:bg-orange-700 transition-all cursor-pointer"
                  id="btn-add-softener-slide"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm slide
                </button>
              </div>

              <div className="space-y-6">
                {softenerSlides.map((slide, idx) => (
                  <div key={idx} className="border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/50">
                    {/* Slide header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100/70 border-b border-gray-150">
                      <span className="text-[11px] font-black uppercase text-gray-600 tracking-wider">Slide #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Xóa slide #${idx + 1}?`)) return;
                          setSoftenerSlides(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Xóa slide này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
                      {/* Image preview + upload */}
                      <div className="md:col-span-5 space-y-3">
                        <label className="text-[10px] font-bold uppercase text-gray-500 block">Hình ảnh slide</label>
                        
                        {/* Image preview */}
                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-100 group">
                          {slide.image ? (
                            <>
                              <img 
                                src={slide.image} 
                                alt={`Slide ${idx + 1}`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label 
                                  className="px-3 py-1.5 bg-white text-gray-800 text-[11px] font-bold rounded-lg cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                                  htmlFor={`softener-upload-${idx}`}
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  Đổi ảnh
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setActiveMediaSelector({ target: 'softener_slide', slideIndex: idx })}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                >
                                  <Image className="w-3.5 h-3.5" />
                                  Media
                                </button>
                              </div>
                            </>
                          ) : (
                            <label 
                              htmlFor={`softener-upload-${idx}`}
                              className="flex flex-col items-center justify-center h-full gap-2 cursor-pointer hover:bg-gray-150 transition-colors"
                            >
                              {softenerSlideUploading === idx ? (
                                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-gray-300" />
                                  <span className="text-[11px] text-gray-400 font-sans text-center px-4">Nhấn để chọn ảnh hoặc kéo thả file vào đây</span>
                                  <span className="text-[10px] text-gray-300 font-sans">JPG, PNG, WEBP &lt;5MB</span>
                                </>
                              )}
                            </label>
                          )}
                          {softenerSlideUploading === idx && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                              <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Hidden file input */}
                        <input
                          type="file"
                          id={`softener-upload-${idx}`}
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleSoftenerSlideUpload(idx, file);
                            e.target.value = '';
                          }}
                        />

                        {/* Upload actions */}
                        <div className="flex gap-2">
                          <label
                            htmlFor={`softener-upload-${idx}`}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Tải ảnh lên
                          </label>
                          <button
                            type="button"
                            onClick={() => setActiveMediaSelector({ target: 'softener_slide', slideIndex: idx })}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            <Image className="w-3.5 h-3.5" />
                            Thư viện ảnh
                          </button>
                        </div>

                        {slide.image && (
                          <div className="text-[9px] text-gray-400 font-mono truncate bg-white border border-gray-100 rounded px-2 py-1.5" title={slide.image}>
                            📎 {slide.image.length > 50 ? slide.image.slice(0, 50) + '...' : slide.image}
                          </div>
                        )}
                      </div>

                      {/* Text fields */}
                      <div className="md:col-span-7 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 block">Badge / Nhãn (VD: "CÔNG NGHỆ USA")</label>
                          <input
                            type="text"
                            value={slide.badge}
                            onChange={e => setSoftenerSlides(prev => prev.map((s, i) => i === idx ? { ...s, badge: e.target.value } : s))}
                            placeholder="CÔNG NGHỆ USA"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 block">Tiêu đề chính</label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={e => setSoftenerSlides(prev => prev.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
                            placeholder="Giải Pháp Làm Mềm Nước"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 block">Phụ đề / Mô tả</label>
                          <textarea
                            rows={3}
                            value={slide.subtitle}
                            onChange={e => setSoftenerSlides(prev => prev.map((s, i) => i === idx ? { ...s, subtitle: e.target.value } : s))}
                            placeholder="Mô tả ngắn về tính năng..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                          />
                        </div>

                        {/* Preview badge */}
                        <div className="bg-gradient-to-br from-[#0C3471] to-blue-900 rounded-xl p-3 text-white text-xs space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-200">Xem trước:</span>
                          <div className="inline-block px-2 py-0.5 bg-white/20 text-white rounded-full text-[9px] font-bold uppercase">{slide.badge || 'BADGE'}</div>
                          <div className="font-black text-sm leading-tight">{slide.title || 'Tiêu đề slide'}</div>
                          <div className="text-blue-200 text-[10px] font-sans leading-snug line-clamp-2">{slide.subtitle || 'Mô tả...'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {softenerSlides.length === 0 && (
                  <div className="text-center py-10 text-gray-400 font-sans text-sm border-2 border-dashed border-gray-150 rounded-2xl">
                    Chưa có slide nào. Nhấn "Thêm slide" ở trên để bắt đầu.
                  </div>
                )}
              </div>

              {/* Save button */}
              <div className="pt-4 border-t flex items-center justify-between">
                <p className="text-[11px] text-gray-400 font-sans">Sau khi lưu, ảnh mới sẽ hiển thị ngay trên website công cộng tại phần <strong>Water Softening Solution</strong>.</p>
                <button
                  type="button"
                  onClick={handleSaveSoftenerSlides}
                  disabled={softenerSaving}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md ${softenerSaving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'}`}
                  id="btn-save-softener-slides"
                >
                  {softenerSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {softenerSaving ? 'Đang lưu...' : 'Lưu thay đổi Carousel'}
                </button>
              </div>
            </div>
            )}

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

                  <div className="border-t pt-4">
                    {(() => {
                      const text = previewItem.data.content || 'Nội dung bài viết chưa được nhập.';
                      const trimmed = text.trim();
                      const isHtml = (trimmed.startsWith('<') && trimmed.endsWith('>')) || /<[a-z][\s\S]*>/i.test(trimmed);
                      if (isHtml) {
                        return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: text }} />;
                      }
                      return <div className="prose max-w-none text-xs sm:text-sm text-gray-750 leading-relaxed font-sans whitespace-pre-line">{text}</div>;
                    })()}
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
                    <div>
                      {(() => {
                        const text = previewItem.data.content || "Nội dung sản phẩm chưa được thiết lập.";
                        const trimmed = text.trim();
                        const isHtml = (trimmed.startsWith('<') && trimmed.endsWith('>')) || /<[a-z][\s\S]*>/i.test(trimmed);
                        if (isHtml) {
                          return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: text }} />;
                        }
                        return <div className="prose max-w-none text-xs sm:text-sm text-gray-750 font-sans whitespace-pre-line leading-relaxed">{text}</div>;
                      })()}
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
                  } else if (target === 'logo_image') {
                    setHeaderSettings(prev => ({ ...prev, logoImageUrl: url }));
                  } else if (target === 'footer_logo_image') {
                    setHeaderSettings(prev => ({ ...prev, footerLogoImageUrl: url }));
                  } else if (target === 'softener_slide') {
                    const slideIdx = activeMediaSelector?.slideIndex;
                    if (slideIdx !== undefined) {
                      setSoftenerSlides(prev => prev.map((s, i) => i === slideIdx ? { ...s, image: url } : s));
                    }
                  } else if (target === 'homepage_hero_image') {
                    setHomepageSettings(prev => ({ ...prev, heroImage: url }));
                  } else if (target === 'homepage_intro_image') {
                    setHomepageSettings(prev => ({ ...prev, introImage: url }));
                  } else if (target === 'post_content_editor') {
                    if ((window as any).onPostContentEditorImageSelect) {
                      (window as any).onPostContentEditorImageSelect(url);
                    }
                    return; // keep the media modal open so editors can insert multiple images consecutively
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
