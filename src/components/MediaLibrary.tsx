import React from 'react';
import { 
  Folder, FolderPlus, Image, UploadCloud, X, Edit2, Trash2, 
  Download, Copy, Check, ChevronRight, CornerDownRight, Search, 
  Plus, Loader2, AlertCircle, Eye, ArrowLeft, FileText, ChevronDown
} from 'lucide-react';
import { MediaFolder, MediaItem } from '../types';

export default function MediaLibrary({
  onSelect,
  selectButtonText = 'Chọn hình ảnh này'
}: {
  onSelect?: (url: string) => void;
  selectButtonText?: string;
} = {}) {
  const [folders, setFolders] = React.useState<MediaFolder[]>([]);
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = React.useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState('');

  // UI States (Modals)
  const [showFolderModal, setShowFolderModal] = React.useState(false);
  const [folderForm, setFolderForm] = React.useState({ name: '', parentId: '' });
  const [editingFolder, setEditingFolder] = React.useState<MediaFolder | null>(null);

  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [uploadType, setUploadType] = React.useState<'local' | 'url'>('local');
  const [urlForm, setUrlForm] = React.useState({ url: '', filename: '' });
  const [uploading, setUploading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState<MediaItem | null>(null);
  const [itemEditForm, setItemEditForm] = React.useState({ title: '', altText: '', description: '', folderId: '' });
  const [savingItem, setSavingItem] = React.useState(false);

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Custom states for dialogs (avoids window.confirm in sandbox)
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; type: 'folder' | 'item'; name: string } | null>(null);
  const [lightboxItem, setLightboxItem] = React.useState<MediaItem | null>(null);

  // Load Data
  const loadMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/media', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tải dữ liệu thư viện ảnh.');

      setFolders(data.folders || []);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadMedia();
  }, []);

  // Format currency or decimals
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Hierarchy Utilities
  const getSubfoldersOf = (parentId: string | undefined) => {
    return folders.filter(f => f.parentId === parentId);
  };

  const getItemsOf = (folderId: string | undefined) => {
    return items.filter(item => {
      // If folderId is undefined, show items without folderId, or match folderId
      if (folderId === undefined) {
        return !item.folderId;
      }
      return item.folderId === folderId;
    });
  };

  const getBreadcrumbs = () => {
    const crumbs: MediaFolder[] = [];
    let current = folders.find(f => f.id === currentFolderId);
    while (current) {
      crumbs.unshift(current);
      current = current.parentId ? folders.find(f => f.id === current.parentId) : undefined;
    }
    return crumbs;
  };

  // Generate recursive folder tree view for dropdowns
  const getFolderTreeOptions = (parentId: string | undefined = undefined, depth = 0): { folder: MediaFolder; depth: number }[] => {
    let result: { folder: MediaFolder; depth: number }[] = [];
    const levelFolders = folders.filter(f => f.parentId === parentId);
    levelFolders.forEach(folder => {
      // Prevent self parenting if editing
      if (editingFolder && folder.id === editingFolder.id) return;
      result.push({ folder, depth });
      result = [...result, ...getFolderTreeOptions(folder.id, depth + 1)];
    });
    return result;
  };

  // Folder Actions
  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name.trim()) return;

    try {
      const url = editingFolder ? `/api/admin/media/folders/${editingFolder.id}` : '/api/admin/media/folders';
      const method = editingFolder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({
          name: folderForm.name,
          parentId: folderForm.parentId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu thư mục.');

      if (editingFolder) {
        setFolders(prev => prev.map(f => f.id === editingFolder.id ? data : f));
      } else {
        setFolders(prev => [...prev, data]);
        // Open the newly created folder right away
        setCurrentFolderId(data.id);
      }

      setShowFolderModal(false);
      setEditingFolder(null);
      setFolderForm({ name: '', parentId: '' });
    } catch (err: any) {
      alert(err.message || 'Lỗi thao tác.');
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    setDeleteConfirm({
      id: folderId,
      type: 'folder',
      name: folder ? folder.name : 'Thư mục này'
    });
  };

  const executeDeleteFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/admin/media/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Không thể xóa thư mục.');
      }

      const deletedFolder = folders.find(f => f.id === folderId);
      const targetParent = deletedFolder?.parentId || undefined;

      // Update state local
      setFolders(prev => prev.filter(f => f.id !== folderId).map(f => f.parentId === folderId ? { ...f, parentId: targetParent } : f));
      setItems(prev => prev.map(item => item.folderId === folderId ? { ...item, folderId: targetParent } : item));
      
      if (currentFolderId === folderId) {
        setCurrentFolderId(targetParent);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi thao tác xóa.');
    }
  };

  // Upload Actions
  const uploadBase64File = async (base64Data: string, filename: string, mimeType: string) => {
    setUploading(true);
    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({
          filename,
          mimeType,
          base64Data,
          folderId: currentFolderId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi upload ảnh.');

      setItems(prev => [data, ...prev]);
      setShowUploadModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi file lên máy chủ.');
    } finally {
      setUploading(false);
    }
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadBase64File(base64, file.name, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        uploadBase64File(base64, file.name, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlForm.url.trim()) return;

    setUploading(true);
    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({
          url: urlForm.url,
          filename: urlForm.filename.trim() || undefined,
          folderId: currentFolderId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm ảnh từ url.');

      setItems(prev => [data, ...prev]);
      setUrlForm({ url: '', filename: '' });
      setShowUploadModal(false);
    } catch (err: any) {
      alert(err.message || 'Không thể lấy ảnh từ URL.');
    } finally {
      setUploading(false);
    }
  };

  // Item detail actions
  const handleSelectItem = (item: MediaItem) => {
    setSelectedItem(item);
    setItemEditForm({
      title: item.title,
      altText: item.altText || '',
      description: item.description || '',
      folderId: item.folderId || ''
    });
  };

  const handleSaveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSavingItem(true);
    try {
      const res = await fetch(`/api/admin/media/items/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({
          title: itemEditForm.title,
          altText: itemEditForm.altText,
          description: itemEditForm.description,
          folderId: itemEditForm.folderId || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật ảnh.');

      setItems(prev => prev.map(i => i.id === selectedItem.id ? data : i));
      setSelectedItem(data); // update selection cache
      alert('Đã cập nhật chi tiết hình ảnh thành công.');
    } catch (err: any) {
      alert(err.message || 'Thao tác lưu lỗi.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    setDeleteConfirm({
      id: itemId,
      type: 'item',
      name: item ? item.title : 'Hình ảnh này'
    });
  };

  const executeDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/admin/media/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi xóa ảnh.');
      }

      setItems(prev => prev.filter(i => i.id !== itemId));
      setSelectedItem(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa tệp tin.');
    }
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const localUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = item.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(localUrl);
    } catch (err) {
      // fallback
      window.open(item.url, '_blank');
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    // Resolve absolute path if local
    const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Filter & Search items
  const activeSubfolders = getSubfoldersOf(currentFolderId);
  const rawActiveItems = getItemsOf(currentFolderId);

  const activeItems = rawActiveItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      (item.altText && item.altText.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  const parentFolderOfCurrent = currentFolderId 
    ? folders.find(f => f.id === currentFolderId)?.parentId 
    : undefined;

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[550px] md:h-[650px]">
      
      {/* Title Header with Buttons */}
      <div className="p-5 border-b border-slate-850 bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 font-mono">Bảng Điều Khiển Quản Trị</span>
          <h2 className="text-lg font-black text-white font-sans flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-500" />
            KHO LƯU TRỮ HÌNH ẢNH & MEDIA PENTAIR
          </h2>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingFolder(null);
              setFolderForm({ name: '', parentId: currentFolderId || '' });
              setShowFolderModal(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 select-none cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-emerald-500" />
            Tạo thư mục
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md select-none cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Tải lên hình ảnh
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden h-full">
        
        {/* Left Sidebar - Folder Navigation Tree */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-850 bg-slate-950/40 p-4 overflow-y-auto flex-shrink-0">
          <div className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-blue-500" />
            Cấu Trúc Thư Mục
          </div>

          <div className="space-y-1">
            {/* Root item */}
            <button
              onClick={() => {
                setCurrentFolderId(undefined);
                setSelectedItem(null);
              }}
              className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 text-xs rounded-lg transition-all font-sans cursor-pointer ${currentFolderId === undefined ? 'bg-blue-600/10 text-blue-400 font-bold border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
            >
              <span className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5" />
                <span>[Thư mục Gốc]</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">{items.filter(i => !i.folderId).length} ảnh</span>
            </button>

            {/* Tree hierarchy */}
            {getFolderTreeOptions().map(({ folder, depth }) => {
              const fileCount = items.filter(i => i.folderId === folder.id).length;
              const isSelected = currentFolderId === folder.id;

              return (
                <div 
                  key={folder.id} 
                  style={{ paddingLeft: `${depth * 14}px` }}
                  className="group relative"
                >
                  <div className={`w-full flex items-center justify-between text-left rounded-lg transition-all text-xs font-sans mt-0.5 cursor-pointer border ${isSelected ? 'bg-blue-600/10 text-blue-400 font-bold border-blue-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-transparent'}`}>
                    <button
                      onClick={() => {
                        setCurrentFolderId(folder.id);
                        setSelectedItem(null);
                      }}
                      className="flex-grow flex items-center gap-1.5 px-2 py-1.5 text-left"
                    >
                      {depth > 0 ? (
                        <CornerDownRight className="w-3 h-3 text-slate-600 shrink-0" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                      <span className="truncate" title={folder.name}>{folder.name}</span>
                    </button>

                    <div className="flex items-center gap-1.5 pr-2 shrink-0">
                      <span className="text-[9px] font-mono text-slate-500">{fileCount}</span>
                      
                      {/* Folder settings edit/delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(folder);
                          setFolderForm({ name: folder.name, parentId: folder.parentId || '' });
                          setShowFolderModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-750 rounded text-slate-400 hover:text-white transition-opacity shrink-0"
                        title="Đổi tên / Di chuyển thư mục"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-755 rounded text-slate-500 hover:text-red-400 transition-opacity shrink-0"
                        title="Xóa thư mục"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Central Gallery Zone */}
        <div className="flex-grow flex flex-col p-5 overflow-y-auto bg-slate-900/60">
          
          {/* Toolbar & Breadcrumbs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            
            {/* Dynamic Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-sans">
              <button
                onClick={() => {
                  setCurrentFolderId(undefined);
                  setSelectedItem(null);
                }}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                Kho ảnh gốc
              </button>
              
              {getBreadcrumbs().map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <button
                    onClick={() => {
                      setCurrentFolderId(crumb.id);
                      setSelectedItem(null);
                    }}
                    className="hover:text-blue-400 transition-colors font-semibold text-slate-200 cursor-pointer"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Inline search bar */}
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm hình ảnh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-xs font-mono font-bold tracking-widest text-[10px] uppercase">Đang đồng bộ cơ sở dữ liệu ảnh...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Back to Parent Directory button */}
              {currentFolderId && (
                <button
                  onClick={() => {
                    setCurrentFolderId(parentFolderOfCurrent);
                    setSelectedItem(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/40 hover:bg-slate-800 text-slate-300 text-xs rounded-lg transition-all hover:text-white border border-slate-800 select-none cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                  Lên một cấp thư mục
                </button>
              )}

              {/* Grid of Sub-folders inside main area */}
              {activeSubfolders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">Thư mục con ở tầng này:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeSubfolders.map((folder) => {
                      const nestedFiles = items.filter(i => i.folderId === folder.id).length;
                      return (
                        <div
                          key={folder.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/30 border border-slate-850 hover:border-slate-700 transition-all group"
                        >
                          <button
                            onClick={() => {
                              setCurrentFolderId(folder.id);
                              setSelectedItem(null);
                            }}
                            className="flex items-center gap-3 text-left focus:outline-none flex-grow"
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-650/10 text-blue-400 flex items-center justify-center">
                              <Folder className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">{folder.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{nestedFiles} tệp tin</div>
                            </div>
                          </button>

                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingFolder(folder);
                                setFolderForm({ name: folder.name, parentId: folder.parentId || '' });
                                setShowFolderModal(true);
                              }}
                              className="p-1 px-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
                              title="Chỉnh sửa thư mục"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="p-1 px-1.5 hover:bg-red-950/20 rounded-lg text-slate-550 hover:text-red-400 text-[10px] flex items-center gap-1"
                              title="Xóa thư mục"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid of images in the current level */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">
                  {currentFolderId 
                    ? `Danh sách hình ảnh trong "${folders.find(f => f.id === currentFolderId)?.name}" (${activeItems.length})`
                    : `Danh sách hình ảnh ở thư mục gốc (${activeItems.length})`}
                </h4>

                {activeItems.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800/50 text-slate-500 flex items-center justify-center">
                      <Image className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-350 font-sans">Không tìm thấy hình ảnh nào</p>
                      <p className="text-[10px] text-slate-500 font-sans max-w-xs mx-auto">
                        Tải lên hình ảnh từ thiết bị hoặc dán URL hình ảnh từ internet để làm giàu kho tư liệu tiếp thị Pentair Vietnam.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg tracking-wide transition-all uppercase"
                    >
                      Tải lên Ngay
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {activeItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={`group relative rounded-xl border overflow-hidden cursor-pointer bg-slate-950/40 transition-all flex flex-col ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[0.98]' : 'border-slate-800 hover:border-slate-700'}`}
                        >
                          {/* Image box */}
                          <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                            <img
                              src={item.url}
                              alt={item.altText || item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // fallback if broken url
                                (e.target as any).src = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80";
                              }}
                            />

                            {/* Info Hover Badge */}
                            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxItem(item);
                                }}
                                className="p-1 px-1.5 bg-slate-950/80 text-white rounded-lg hover:bg-slate-900 border border-slate-700/50 flex items-center gap-1"
                                title="Xem phóng to & Chú thích"
                              >
                                <Eye className="w-3 h-3 text-blue-400" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(item);
                                }}
                                className="p-1 px-1.5 bg-slate-950/80 text-white rounded-lg hover:bg-slate-900 border border-slate-700/50"
                                title="Tải hình ảnh về máy"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(item.url, item.id);
                                }}
                                className="p-1 px-1.5 bg-slate-950/80 text-white rounded-lg hover:bg-slate-900 border border-slate-700/50 flex items-center gap-1"
                                title="Sao chép đường dẫn ảnh"
                              >
                                {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>

                              {onSelect && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(item.url);
                                  }}
                                  className="p-1 px-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 border border-emerald-500 flex items-center gap-1"
                                  title={selectButtonText}
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* MIME type label */}
                            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-slate-950/60 rounded text-[8px] font-mono text-slate-350">
                              {item.mimeType?.split('/')[1]?.toUpperCase() || 'IMG'}
                            </div>
                          </div>

                          {/* Detail footer text */}
                          <div className="p-2.5 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-200 line-clamp-1" title={item.title}>
                                {item.title}
                              </div>
                              {item.description && (
                                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-850">
                              <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Mới'}</span>
                              <span>{formatBytes(item.fileSize)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

        {/* Right Sidebar - Selection Metadata/Edit (If active image selected) */}
        {selectedItem && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-850 bg-slate-950 p-5 overflow-y-auto flex-shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 font-mono">Chi Tiết Hình Ảnh</span>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Preview Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center mb-5">
              <img
                src={selectedItem.url}
                alt={selectedItem.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedItem)}
                  className="bg-slate-950/80 hover:bg-slate-950 text-white rounded-lg p-1.5 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" /> Tải về
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedItem.url, selectedItem.id)}
                  className="bg-slate-950/80 hover:bg-slate-950 text-white rounded-lg p-1.5 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === selectedItem.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" /> Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>

            {onSelect && (
              <button
                type="button"
                onClick={() => onSelect(selectedItem.url)}
                className="w-full py-2.5 mb-4 bg-emerald-600 hover:bg-emerald-505 text-white rounded-xl text-xs font-bold transition-all shadow-md select-none cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-500"
              >
                <Check className="w-4 h-4 text-emerald-200" />
                {selectButtonText}
              </button>
            )}

            {/* Editing attributes details */}
            <form onSubmit={handleSaveItemEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Tên tệp tin / Tiêu đề *</label>
                <input
                  type="text"
                  required
                  value={itemEditForm.title}
                  onChange={(e) => setItemEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Thẻ Alt (Từ khóa SEO)</label>
                <input
                  type="text"
                  value={itemEditForm.altText}
                  onChange={(e) => setItemEditForm(prev => ({ ...prev, altText: e.target.value }))}
                  placeholder="Mô tả tóm tắt cho Google Image Search"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Chú thích hình ảnh (Hiển thị cho khách hàng)</label>
                <textarea
                  value={itemEditForm.description}
                  onChange={(e) => setItemEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Nhập chú thích hoặc ghi chú mô tả của bức ảnh này để khách hàng dễ hiểu ý nghĩa / nguồn gốc / thông số..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                />
              </div>

              {/* Move folder option */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Di chuyển tới thư mục</label>
                <select
                  value={itemEditForm.folderId}
                  onChange={(e) => setItemEditForm(prev => ({ ...prev, folderId: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="">[Trực thuộc thư mục gốc]</option>
                  {getFolderTreeOptions().map(({ folder, depth }) => (
                    <option key={folder.id} value={folder.id}>
                      {"— ".repeat(depth) + folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 space-y-1.5 text-[10px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>URL máy chủ:</span>
                  <span className="text-slate-320 select-all truncate max-w-40" title={selectedItem.url}>{selectedItem.url}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khổ ảnh MIME:</span>
                  <span>{selectedItem.mimeType || 'Không rõ'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cập nhật lúc:</span>
                  <span>{selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString('vi-VN') : '—'}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={savingItem}
                  className="flex-grow py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md select-none cursor-pointer"
                >
                  {savingItem ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="px-3.5 py-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 rounded-lg text-xs font-bold border border-red-900/20 select-none cursor-pointer"
                  title="Xóa vĩnh viễn hình ảnh này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* CREATE / EDIT FOLDER MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-100">
                {editingFolder ? 'Chỉnh sửa đổi tên thư mục' : 'Tạo thư mục mới'}
              </h3>
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setEditingFolder(null);
                }}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tên thư mục *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hình ảnh lắp đặt biệt thự"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Thư mục cha (Cấp bậc)</label>
                <select
                  value={folderForm.parentId}
                  onChange={(e) => setFolderForm(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="">[Thư mục Gốc — Không có cha]</option>
                  {getFolderTreeOptions().map(({ folder, depth }) => (
                    <option key={folder.id} value={folder.id}>
                      {"— ".repeat(depth) + folder.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 font-sans mt-1">
                  Chọn thư mục chứa thư mục này để phân loại theo dạng phân cấp hình ảnh (cha và con).
                </p>
              </div>

              <div className="pt-2 border-t border-slate-850 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderModal(false);
                    setEditingFolder(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD / URL MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-100 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-500" />
                Tải lên / Thêm hình ảnh mới
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Choice tab type */}
            <div className="m-5 mt-4 border-b border-slate-800 flex gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setUploadType('local')}
                className={`pb-2.5 px-1 border-b-2 hover:text-slate-100 ${uploadType === 'local' ? 'border-blue-500 text-white' : 'border-transparent text-slate-450'}`}
              >
                Tệp từ máy tính
              </button>
              <button
                type="button"
                onClick={() => setUploadType('url')}
                className={`pb-2.5 px-1 border-b-2 hover:text-slate-100 ${uploadType === 'url' ? 'border-blue-500 text-white' : 'border-transparent text-slate-450'}`}
              >
                Dán URL liên kết
              </button>
            </div>

            <div className="p-5 pt-0">
              {uploadType === 'local' ? (
                /* Drag and drop panel */
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 transition-all relative ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'}`}
                >
                  <UploadCloud className={`w-12 h-12 transition-colors ${dragActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-300">Kéo thả bức ảnh của bạn vào đây</p>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Chấp nhận tệp ảnh png, jpeg, webp, gif dưới 15MB.<br />
                      Tệp sẽ được phân loại trực tiếp dưới thư mục: <strong>{currentFolderId ? folders.find(f => f.id === currentFolderId)?.name : '[Thư mục Gốc]'}</strong>
                    </p>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 select-none cursor-pointer"
                    >
                      Chọn tệp từ máy
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLocalFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 bg-slate-900/90 rounded-2xl flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-xs font-mono font-bold tracking-widest text-slate-300 text-[10px]">ĐANG LƯU TỆP SANG BỘ NHỚ CỤC BỘ...</p>
                    </div>
                  )}
                </div>
              ) : (
                /* URL adder panel */
                <form onSubmit={handleUrlUploadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Địa chỉ URL ảnh *</label>
                    <input
                      type="url"
                      required
                      placeholder="Nhập đường dẫn trực tiếp: https://example.com/item.jpg"
                      value={urlForm.url}
                      onChange={(e) => setUrlForm(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tên hiển thị (Tự chọn)</label>
                    <input
                      type="text"
                      placeholder="Nếu bỏ trống, hệ thống tự động trích xuất"
                      value={urlForm.filename}
                      onChange={(e) => setUrlForm(prev => ({ ...prev, filename: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      disabled={uploading}
                    />
                  </div>

                  <div className="bg-slate-900/40 p-3.5 border border-slate-800 rounded-2xl flex items-start gap-2 text-[10px] text-slate-500">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Hộ chiếu liên kết hình ảnh theo URL giúp ghi chép nhanh ảnh từ Unsplash hoặc Flickr mà không cần tải file về ổ đĩa cứng của bạn. Ảnh cũng được xếp vào thư mục hiện hoạt: <strong>{currentFolderId ? folders.find(f => f.id === currentFolderId)?.name : '[Thư mục gốc]'}</strong>.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-850 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold"
                      disabled={uploading}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Thêm bức ảnh
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE DIALOG MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="w-6 h-6 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider font-sans">Xác nhận xóa vĩnh viễn</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Bạn có chắc chắn muốn xóa vĩnh viễn <span className="font-extrabold text-white text-xs bg-slate-950 px-2 py-1 rounded inline-block my-1 break-all">"{deleteConfirm.name}"</span>?
            </p>
            <p className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 p-3 rounded-xl leading-normal font-sans">
              {deleteConfirm.type === 'folder' 
                ? 'Lưu ý cực kỳ quan trọng: Thư mục con và các hình ảnh bên trong sẽ được tự động di chuyển trực tiếp ra thư mục cha bên ngoài chứ không bị tước bỏ tệp tin.' 
                : 'Thao tác này sẽ xóa vĩnh viễn tệp hình ảnh khỏi hệ thống máy chủ và không tài nào có thể khôi phục lại.'}
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { id, type } = deleteConfirm;
                  setDeleteConfirm(null);
                  if (type === 'folder') {
                    await executeDeleteFolder(id);
                  } else {
                    await executeDeleteItem(id);
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-red-900/20 select-none cursor-pointer shrink-0"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {lightboxItem && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn" onClick={() => setLightboxItem(null)}>
          <div className="relative max-w-4xl w-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute -top-12 right-0 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-full transition-colors leading-none cursor-pointer"
              title="Đóng bản xem trước"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main Image View */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 overflow-hidden shadow-2xl max-h-[75vh] flex items-center justify-center">
              <img
                src={lightboxItem.url}
                alt={lightboxItem.altText || lightboxItem.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl select-none"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Annotation caption box */}
            <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 text-center text-slate-200 shadow-xl space-y-1.5 max-w-2xl">
              <span className="text-[9px] font-mono font-bold text-blue-400 tracking-widest uppercase block">
                IMAGE ANNOTATION & CAPTION
              </span>
              <h4 className="text-xs font-black uppercase text-white tracking-tight break-all">{lightboxItem.title}</h4>
              <div className="w-8 h-[2px] bg-blue-500 mx-auto my-1" />
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-xl mx-auto italic">
                {lightboxItem.description ? `“ ${lightboxItem.description} ”` : "Chưa có văn bản chú thích nào cho bức ảnh này. Quý quản trị có thể thêm mô tả chú thích tại cửa sổ biên tập bên phải thư viện."}
              </p>
              
              <div className="text-[10px] text-slate-500 font-mono pt-1">
                Kích thước: {lightboxItem.fileSize ? `${Math.round(lightboxItem.fileSize / 1024)} KB` : 'Liên kết ngoài'} • Định dạng: {lightboxItem.mimeType || 'image/jpeg'}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
