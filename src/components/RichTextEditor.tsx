import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table, Link, Link2Off, Image, 
  Minus, Type, Highlighter, Undo2, Redo2, Code, Eye, 
  Maximize2, Minimize2, Trash2, ChevronDown, Sparkles,
  AlignLeft as ImgLeft, AlignCenter as ImgCenter, AlignRight as ImgRight,
  MessageSquare, X
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onInsertMediaClick?: () => void;
  placeholder?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  onInsertMediaClick,
  placeholder = "Nhập nội dung bài soạn thảo chuyên nghiệp tại đây..." 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastSelectionRef = useRef<Range | null>(null);
  const [toolbarFixed, setToolbarFixed] = useState(false);
  const [toolbarLeft, setToolbarLeft] = useState(0);
  const [toolbarWidth, setToolbarWidth] = useState(0);

  // Image context toolbar
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgToolbarPos, setImgToolbarPos] = useState({ top: 0, left: 0 });
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [captionValue, setCaptionValue] = useState('');
  
  // Popover menus state
  const [activeMenu, setActiveMenu] = useState<'heading' | 'textColor' | 'bgColor' | 'table' | null>(null);
  
  // Custom Color Palettes
  const textColors = [
    { name: 'Pentair Blue', color: '#0C3471' },
    { name: 'Vibrant Blue', color: '#3B82F6' },
    { name: 'Deep Slate', color: '#1E293B' },
    { name: 'Soft Gray', color: '#64748B' },
    { name: 'Rose Red', color: '#E11D48' },
    { name: 'Emerald', color: '#10B981' },
    { name: 'Amber Orange', color: '#F59E0B' },
    { name: 'Luxury Violet', color: '#8B5CF6' }
  ];

  const bgColors = [
    { name: 'Vàng nhạt', color: '#FEF08A' },
    { name: 'Xanh lá nhạt', color: '#BBF7D0' },
    { name: 'Xanh lam nhạt', color: '#BFDBFE' },
    { name: 'Hồng nhạt', color: '#FBCFE8' },
    { name: 'Cam nhạt', color: '#FED7AA' },
    { name: 'Tím nhạt', color: '#E9D5FF' },
    { name: 'Xoá màu nền', color: 'transparent' }
  ];

  // Grid hover dimensions for table selector
  const [hoverGrid, setHoverGrid] = useState({ r: 0, c: 0 });

  // ─── Sticky toolbar via scroll listener ─────────────────────────────────────
  // Works with any scroll container (the <main> in AdminCMS or window)
  useEffect(() => {
    const updateToolbar = () => {
      if (!wrapperRef.current || !toolbarRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      if (rect.top < 0 && rect.bottom > 56) {
        setToolbarFixed(true);
        setToolbarLeft(rect.left);
        setToolbarWidth(rect.width);
      } else {
        setToolbarFixed(false);
      }
    };

    // Listen on scroll of main admin canvas or window
    const scrollTarget = document.getElementById('cms-canvas') || window;
    scrollTarget.addEventListener('scroll', updateToolbar, { passive: true });
    window.addEventListener('resize', updateToolbar, { passive: true });
    return () => {
      scrollTarget.removeEventListener('scroll', updateToolbar);
      window.removeEventListener('resize', updateToolbar);
    };
  }, []);

  // Sync React prop to editor only when it changes externally
  useEffect(() => {
    if (editorRef.current) {
      const editorHtml = editorRef.current.innerHTML;
      const initialVal = value || `<p><br></p>`;
      if (editorHtml !== value && editorHtml !== initialVal) {
        editorRef.current.innerHTML = initialVal;
      }
    }
  }, [value]);

  // Handle key inputs and change events
  const handleInput = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;
      if (html === '' || html === '<br>') {
        html = '<p><br></p>';
        editorRef.current.innerHTML = html;
      }
      onChange(html);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.rte-popover-trigger') && !target.closest('.rte-popover')) {
        setActiveMenu(null);
      }
      // Close image toolbar if clicking outside editor and img toolbar
      if (!target.closest('.rte-img-toolbar') && !target.closest('[data-rte-editor]')) {
        setSelectedImg(null);
        setShowCaptionInput(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Window callback listener for media library integrations — inserts directly
  useEffect(() => {
    (window as any).onPostContentEditorImageSelect = (url: string) => {
      // Restore saved selection so image appears at cursor
      if (lastSelectionRef.current) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(lastSelectionRef.current);
      } else {
        editorRef.current?.focus();
      }
      // Wrap image in a block-level <p> so justifyLeft/Center/Right works
      const imgHtml = `<p style="text-align:left;"><img src="${url}" alt="Hình ảnh Pentair" style="max-width:100%; height:auto; border-radius:12px; display:block; filter:brightness(0.98); box-shadow:0 4px 12px rgba(0,0,0,0.05);" referrerpolicy="no-referrer" /></p><p><br></p>`;
      insertHtmlAtCursor(imgHtml);
    };

    return () => {
      delete (window as any).onPostContentEditorImageSelect;
    };
  }, [onChange]);

  // Execute native editor command
  const execCmd = (command: string, val: string = '') => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  // Save cursor/selection position
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      lastSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  // Show context toolbar on image click
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showCode) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      const editorRect = editorRef.current!.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      setSelectedImg(img);
      setImgToolbarPos({
        top: imgRect.top - editorRect.top - 44,
        left: Math.max(0, imgRect.left - editorRect.left)
      });
      // Save selection around the image
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNode(img);
        sel.removeAllRanges();
        sel.addRange(range);
        lastSelectionRef.current = range.cloneRange();
      }
    } else {
      setSelectedImg(null);
      setShowCaptionInput(false);
    }
  };

  // Align the selected image by setting text-align on its parent block
  const alignImage = (align: 'left' | 'center' | 'right') => {
    if (!selectedImg) return;
    const parent = selectedImg.parentElement;
    if (parent) {
      parent.style.textAlign = align;
      if (align === 'center') {
        selectedImg.style.marginLeft = 'auto';
        selectedImg.style.marginRight = 'auto';
      } else if (align === 'left') {
        selectedImg.style.marginLeft = '0';
        selectedImg.style.marginRight = 'auto';
        selectedImg.style.float = 'left';
        selectedImg.style.marginRight = '16px';
      } else {
        selectedImg.style.marginLeft = 'auto';
        selectedImg.style.marginRight = '0';
        selectedImg.style.float = 'right';
        selectedImg.style.marginLeft = '16px';
      }
    }
    handleInput();
  };

  // Remove float from image
  const resetImageAlign = () => {
    if (!selectedImg) return;
    selectedImg.style.float = '';
    selectedImg.style.marginLeft = 'auto';
    selectedImg.style.marginRight = 'auto';
    const parent = selectedImg.parentElement;
    if (parent) parent.style.textAlign = 'center';
    handleInput();
  };

  // Add/update caption below the image
  const applyCaption = () => {
    if (!selectedImg || !captionValue.trim()) {
      setShowCaptionInput(false);
      return;
    }
    const parent = selectedImg.parentElement;
    if (parent) {
      // Check if sibling is already a caption
      let caption = parent.nextElementSibling as HTMLElement;
      if (caption && caption.classList.contains('rte-img-caption')) {
        caption.textContent = captionValue;
      } else {
        caption = document.createElement('p');
        caption.className = 'rte-img-caption';
        caption.style.cssText = 'text-align:center; font-size:12px; color:#64748b; font-style:italic; margin:-8px 0 16px;';
        caption.textContent = captionValue;
        parent.insertAdjacentElement('afterend', caption);
      }
    }
    handleInput();
    setShowCaptionInput(false);
    setCaptionValue('');
  };

  // Remove selected image
  const removeImage = () => {
    if (!selectedImg) return;
    selectedImg.parentElement?.remove();
    setSelectedImg(null);
    handleInput();
  };

  // Wrap cursor or selection in safe HTML element
  const formatBlock = (tag: string) => {
    execCmd('formatBlock', `<${tag}>`);
    setActiveMenu(null);
  };

  // Helper to insert arbitrary HTML at caret position
  const insertHtmlAtCursor = (html: string) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.getRangeAt && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let lastNode: ChildNode | undefined;
      while (el.firstChild) {
        lastNode = frag.appendChild(el.firstChild);
      }
      range.insertNode(frag);
      if (lastNode) {
        const r2 = range.cloneRange();
        r2.setStartAfter(lastNode);
        r2.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r2);
      }
    }
    handleInput();
  };

  // Insert Link
  const handleInsertLink = () => {
    saveSelection();
    const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
    if (lastSelectionRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(lastSelectionRef.current);
    } else {
      editorRef.current?.focus();
    }
    if (url === null) return;
    if (url.trim() === '') {
      execCmd('unlink');
    } else {
      execCmd('createLink', url);
    }
  };

  // Insert Table
  const handleInsertTable = (rows: number, cols: number) => {
    let tableHtml = '<div style="overflow-x:auto; margin: 16px 0;"><table style="width: 100%; border-collapse: collapse; min-width: 400px; font-family: sans-serif; font-size: 13px;">';
    tableHtml += '<thead><tr>';
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; font-weight: bold; text-align: left; color: #0C3471;">Tiêu đề ${c + 1}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 0; r < rows; r++) {
      tableHtml += `<tr style="${r % 2 === 1 ? 'background-color: #f8fafc;' : ''}">`;
      for (let c = 0; c < cols; c++) {
        tableHtml += '<td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #334155;">Dữ liệu ô</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div><p><br></p>';
    insertHtmlAtCursor(tableHtml);
    setActiveMenu(null);
  };

  // Prompt Insert Image Link
  const handleInsertImageLink = () => {
    saveSelection();
    const url = prompt('Nhập địa chỉ liên kết (URL) của hình ảnh:', 'https://');
    if (!url) return;
    if (lastSelectionRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(lastSelectionRef.current);
    } else {
      editorRef.current?.focus();
    }
    const imgHtml = `<p style="text-align:left;"><img src="${url}" alt="hình ảnh" style="max-width:100%; height:auto; border-radius:12px; display:block; filter:brightness(0.98); box-shadow:0 4px 12px rgba(0,0,0,0.05);" referrerpolicy="no-referrer" /></p><p><br></p>`;
    insertHtmlAtCursor(imgHtml);
  };

  // Toggle active toolbar menu popover
  const toggleMenu = (menuName: 'heading' | 'textColor' | 'bgColor' | 'table') => {
    setActiveMenu(prev => prev === menuName ? null : menuName);
  };

  // Toolbar content (shared between fixed and normal)
  const ToolbarContent = () => (
    <>
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1 shrink-0">
        <button type="button" onClick={() => execCmd('undo')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title="Hoàn tác (Undo)"><Undo2 className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('redo')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title="Lặp lại (Redo)"><Redo2 className="w-3.5 h-3.5" /></button>
      </div>

      {/* Headings dropdown */}
      <div className="relative shrink-0">
        <button type="button" onClick={() => toggleMenu('heading')} className="rte-popover-trigger px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-gray-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 shadow-sm transition-all cursor-pointer" title="Tiêu đề & Khung văn bản">
          Kiểu chữ <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
        {activeMenu === 'heading' && (
          <div className="rte-popover absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-[200] p-1 flex flex-col font-sans py-1.5">
            <button type="button" onClick={() => formatBlock('p')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-normal text-slate-700">Văn bản thường (Paragraph)</button>
            <button type="button" onClick={() => formatBlock('h2')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-sm font-bold text-[#0C3471]">Tiêu đề lớn (Heading 2)</button>
            <button type="button" onClick={() => formatBlock('h3')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-extrabold text-slate-800">Tiêu đề vừa (Heading 3)</button>
            <button type="button" onClick={() => formatBlock('h4')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700">Tiêu đề nhỏ (Heading 4)</button>
            <button type="button" onClick={() => formatBlock('blockquote')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-500 italic border-t border-slate-100 mt-1 pt-1.5">Khối trích dẫn (Blockquote)</button>
          </div>
        )}
      </div>

      {/* Text styling */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1 shrink-0">
        <button type="button" onClick={() => execCmd('bold')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 font-extrabold transition-colors cursor-pointer" title="In đậm (Bold)"><Bold className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('italic')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="In nghiêng (Italic)"><Italic className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('underline')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Gạch chân (Underline)"><Underline className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('strikeThrough')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Gạch ngang (Strikethrough)"><Strikethrough className="w-3.5 h-3.5" /></button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-1.5 mr-1 shrink-0 relative">
        <button type="button" onClick={() => toggleMenu('textColor')} className="rte-popover-trigger p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer flex items-center gap-0.5" title="Màu chữ">
          <Type className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full border" style={{ backgroundColor: textColors[0].color }}></span>
        </button>
        {activeMenu === 'textColor' && (
          <div className="rte-popover absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-[200] p-2.5 grid grid-cols-4 gap-1.5">
            {textColors.map((color) => (
              <button key={color.color} type="button" onClick={() => { execCmd('foreColor', color.color); setActiveMenu(null); }} className="w-7 h-7 rounded-lg border border-gray-100 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative group" style={{ backgroundColor: color.color }} title={color.name}>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none mb-1">{color.name}</span>
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => toggleMenu('bgColor')} className="rte-popover-trigger p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer flex items-center gap-0.5" title="Màu nền chữ">
          <Highlighter className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-200 border"></span>
        </button>
        {activeMenu === 'bgColor' && (
          <div className="rte-popover absolute left-8 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-[200] p-2.5 grid grid-cols-4 gap-1.5">
            {bgColors.map((color) => (
              <button key={color.color} type="button" onClick={() => { execCmd('hiliteColor', color.color); setActiveMenu(null); }} className="w-7 h-7 rounded-lg border border-gray-200 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative group flex items-center justify-center" style={{ backgroundColor: color.color }} title={color.name}>
                {color.color === 'transparent' && <span className="text-[10px] text-slate-400 font-mono">✕</span>}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none mb-1">{color.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1 shrink-0">
        <button type="button" onClick={() => execCmd('justifyLeft')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Căn lề trái"><AlignLeft className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('justifyCenter')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Căn lề giữa"><AlignCenter className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('justifyRight')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Căn lề phải"><AlignRight className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('justifyFull')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Căn lề đều"><AlignJustify className="w-3.5 h-3.5" /></button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1 shrink-0">
        <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Danh sách mục tròn"><List className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Danh sách số"><ListOrdered className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('insertHorizontalRule')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Dòng kẻ ngang"><Minus className="w-3.5 h-3.5" /></button>
      </div>

      {/* Table */}
      <div className="relative shrink-0">
        <button type="button" onClick={() => toggleMenu('table')} className="rte-popover-trigger p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-0.5" title="Chèn bảng biểu">
          <Table className="w-3.5 h-3.5" />
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>
        {activeMenu === 'table' && (
          <div className="rte-popover absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[200] p-3.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2 select-none">Chọn kích thước bảng:</span>
            <div className="grid grid-cols-5 gap-1 select-none">
              {Array.from({ length: 5 }).map((_, rIdx) => (
                <div key={rIdx} className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, cIdx) => {
                    const r = rIdx + 1; const c = cIdx + 1;
                    const isHighlighted = r <= hoverGrid.r && c <= hoverGrid.c;
                    return (
                      <div key={cIdx} onMouseEnter={() => setHoverGrid({ r, c })} onClick={() => handleInsertTable(r, c)}
                        className={`w-6 h-6 border rounded cursor-pointer transition-all ${isHighlighted ? 'bg-blue-100 border-blue-400 scale-[1.08]' : 'bg-slate-50 border-gray-200'}`} />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="text-center text-[10px] text-blue-600 font-black mt-3 border-t pt-2">
              {hoverGrid.r > 0 && hoverGrid.c > 0 ? `${hoverGrid.r} dòng × ${hoverGrid.c} cột` : 'Di chuột để chọn'}
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1 shrink-0">
        <button type="button" onClick={handleInsertLink} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer" title="Chèn liên kết"><Link className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => execCmd('unlink')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title="Xoá liên kết"><Link2Off className="w-3.5 h-3.5" /></button>
      </div>

      {/* Image — single button, clicks directly open media library */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1 shrink-0">
        {onInsertMediaClick && (
          <button
            type="button"
            onClick={() => { saveSelection(); onInsertMediaClick(); }}
            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="Chèn ảnh từ thư viện"
          >
            <Image className="w-3.5 h-3.5" /> Chèn ảnh
          </button>
        )}
        <button type="button" onClick={handleInsertImageLink} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title="Dán URL ảnh">
          🔗
        </button>
      </div>

      {/* Remove format */}
      <button type="button" onClick={() => execCmd('removeFormat')} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors cursor-pointer shrink-0" title="Xoá định dạng đang chọn">
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* HTML toggle */}
      <button type="button" onClick={() => setShowCode(!showCode)}
        className={`p-1.5 px-2.5 border rounded-lg text-[10px] font-bold uppercase transition-colors shrink-0 flex items-center gap-1 cursor-pointer ml-auto shadow-sm ${showCode ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600' : 'bg-white hover:bg-slate-100 text-slate-600 border-gray-200'}`}
        title={showCode ? "Quay lại chế độ trực quan" : "Chuyển sang mã HTML"}>
        {showCode ? <><Eye className="w-3.5 h-3.5" /> Trực quan</> : <><Code className="w-3.5 h-3.5" /> Xem mã HTML</>}
      </button>

      {/* Fullscreen */}
      <button type="button" onClick={() => setIsFullscreen(!isFullscreen)}
        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 border border-gray-200 bg-white shadow-sm transition-colors shrink-0 flex items-center justify-center cursor-pointer ml-1"
        title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}>
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </>
  );

  const toolbarClasses = "flex flex-wrap items-center gap-1.5 p-2 bg-slate-50/95 backdrop-blur-sm border-b border-gray-200 select-none";

  return (
    <div ref={wrapperRef} className={`flex flex-col border border-gray-200 rounded-2xl shadow-sm transition-all bg-white relative ${
      isFullscreen ? 'fixed inset-0 z-[99999] rounded-none w-screen h-screen' : 'w-full'
    }`}>
      
      {/* FLOATING FIXED TOOLBAR — appears when scrolled past original toolbar position */}
      {toolbarFixed && !isFullscreen && (
        <div
          className={`${toolbarClasses} fixed z-[9999] shadow-md border border-gray-200 rounded-xl`}
          style={{ top: 0, left: toolbarLeft, width: toolbarWidth }}
        >
          <ToolbarContent />
        </div>
      )}

      {/* TOOLBAR SECTION — always in DOM for layout reference */}
      <div ref={toolbarRef} className={`${toolbarClasses} rounded-t-2xl ${toolbarFixed && !isFullscreen ? 'invisible' : ''}`}>
        <ToolbarContent />
      </div>

      {/* EDITOR INPUT VIEWPORT */}
      <div className={`flex-1 relative bg-white rounded-b-2xl ${isFullscreen ? 'overflow-y-auto rounded-none' : ''}`}>
        
        {/* Image context toolbar */}
        {selectedImg && (
          <div
            className="rte-img-toolbar absolute z-50 flex items-center gap-1 bg-slate-900 text-white rounded-lg px-2 py-1 shadow-xl"
            style={{ top: Math.max(4, imgToolbarPos.top), left: imgToolbarPos.left }}
          >
            <button type="button" onClick={() => alignImage('left')} className="p-1 hover:bg-slate-700 rounded text-xs flex items-center gap-0.5 cursor-pointer" title="Căn trái"><ImgLeft className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => alignImage('center')} className="p-1 hover:bg-slate-700 rounded text-xs flex items-center gap-0.5 cursor-pointer" title="Căn giữa"><ImgCenter className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => alignImage('right')} className="p-1 hover:bg-slate-700 rounded text-xs flex items-center gap-0.5 cursor-pointer" title="Căn phải"><ImgRight className="w-3.5 h-3.5" /></button>
            <div className="w-px h-4 bg-slate-600 mx-0.5" />
            <button
              type="button"
              onClick={() => { setShowCaptionInput(v => !v); setCaptionValue(''); }}
              className="p-1 hover:bg-slate-700 rounded text-xs cursor-pointer flex items-center gap-0.5"
              title="Thêm chú thích"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-600 mx-0.5" />
            <button type="button" onClick={removeImage} className="p-1 hover:bg-rose-600 rounded text-xs cursor-pointer" title="Xóa ảnh">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Caption input box */}
        {showCaptionInput && selectedImg && (
          <div className="rte-img-toolbar absolute z-50 flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-lg px-2 py-1.5"
            style={{ top: Math.max(4, imgToolbarPos.top) + 40, left: imgToolbarPos.left }}>
            <input
              autoFocus
              type="text"
              value={captionValue}
              onChange={e => setCaptionValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyCaption(); if (e.key === 'Escape') setShowCaptionInput(false); }}
              placeholder="Nhập chú thích ảnh..."
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none w-52"
            />
            <button type="button" onClick={applyCaption} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg cursor-pointer font-bold">OK</button>
            <button type="button" onClick={() => setShowCaptionInput(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-3 h-3 text-gray-500" /></button>
          </div>
        )}

        {/* VISUAL EDITING DIV */}
        <div
          ref={editorRef}
          data-rte-editor="true"
          contentEditable={!showCode}
          onClick={handleEditorClick}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onInput={handleInput}
          onBlur={() => { handleInput(); saveSelection(); }}
          className={`rich-text-content focus:outline-none w-full p-6 font-sans leading-relaxed text-slate-700 min-h-[350px] overflow-y-auto ${
            showCode ? 'hidden' : 'block'
          } ${isFullscreen ? 'min-h-[calc(100vh-65px)] px-12 py-10 max-w-4xl mx-auto border-x border-slate-100 shadow-sm' : ''}`}
          placeholder={placeholder}
          style={{ wordBreak: 'break-word', outline: 'none' }}
        />

        {/* RAW HTML CODE TEXTAREA */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-5 font-mono text-[11px] leading-relaxed text-emerald-400 bg-slate-950 min-h-[350px] focus:outline-none border-t-0 resize-y block ${
            showCode ? 'block' : 'hidden'
          } ${isFullscreen ? 'min-h-[calc(100vh-65px)] h-[calc(100vh-65px)] resize-none' : ''}`}
          placeholder="Viết hoặc chỉnh sửa mã HTML thô tại đây..."
        />

        {/* Subtle premium hint */}
        {!isFullscreen && (
          <div className="px-3.5 py-1 bg-slate-50 border-t border-gray-100 text-[9px] text-[#0C3471] font-semibold font-mono text-right flex items-center justify-end gap-1 select-none">
            <Sparkles className="w-3 h-3 text-amber-500" /> Trình soạn thảo văn bản thông minh Pentair - Chuẩn Word & Tương thích 4K
          </div>
        )}
      </div>
    </div>
  );
}
