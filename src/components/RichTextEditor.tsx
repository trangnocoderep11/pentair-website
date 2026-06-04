import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table, Link, Link2Off, Image, 
  Minus, Type, Highlighter, Undo2, Redo2, Code, Eye, 
  Maximize2, Minimize2, Trash2, ChevronDown, Sparkles 
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
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Popover menus state
  const [activeMenu, setActiveMenu] = useState<'heading' | 'textColor' | 'bgColor' | 'table' | 'image' | null>(null);
  
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

  // Sync React prop to editor only when it changes externally
  useEffect(() => {
    if (editorRef.current) {
      const editorHtml = editorRef.current.innerHTML;
      // Initialize with paragraph if empty to ensure clean block tagging
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
      // If editor becomes completely empty, re-inject paragraph wrapper
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
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Window callback listener for media library integrations
  useEffect(() => {
    (window as any).onPostContentEditorImageSelect = (url: string) => {
      editorRef.current?.focus();
      // Insert standard image tag with responsive style
      const imgHtml = `<p><img src="${url}" alt="Hình ảnh Pentair" style="max-width:100%; height:auto; border-radius:12px; margin:16px auto; display:block; filter:brightness(0.98); box-shadow:0 4px 12px rgba(0,0,0,0.05);" referrerpolicy="no-referrer" /></p><p><br></p>`;
      insertHtmlAtCursor(imgHtml);
      setActiveMenu(null);
    };

    return () => {
      delete (window as any).onPostContentEditorImageSelect;
    };
  }, [onChange]);

  // Execute native editor command
  const execCmd = (command: string, value: string = '') => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleEditorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showCode) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      const img = target as HTMLImageElement;
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNode(img);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      editorRef.current?.focus();
    }
  };

  // Wrap cursor or selection in safe HTML element
  const formatBlock = (tag: string) => {
    execCmd('formatBlock', `<${tag}>`);
    setActiveMenu(null);
  };

  // Helper to insert arbitrary HTML at caret position
  const insertHtmlAtCursor = (html: string) => {
    editorRef.current?.focus();
    let sel, range;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel && sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        const el = document.createElement("div");
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);

        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
    handleInput();
  };

  // Insert Link
  const handleInsertLink = () => {
    const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
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
    const url = prompt('Nhập địa chỉ liên kết (URL) của hình ảnh:', 'https://');
    if (!url) return;
    const alt = prompt('Nhập chú thích miêu tả ảnh:', 'Mô tả hình ảnh Pentair');
    const imgHtml = `<p><img src="${url}" alt="${alt || 'hình ảnh'}" style="max-width:100%; height:auto; border-radius:12px; margin:16px auto; display:block; filter:brightness(0.98); box-shadow:0 4px 12px rgba(0,0,0,0.05);" referrerpolicy="no-referrer" /></p><p><br></p>`;
    insertHtmlAtCursor(imgHtml);
    setActiveMenu(null);
  };

  // Toggle active toolbar menu popover
  const toggleMenu = (menuName: 'heading' | 'textColor' | 'bgColor' | 'table' | 'image') => {
    setActiveMenu(prev => prev === menuName ? null : menuName);
  };

  return (
    <div className={`flex flex-col border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition-all bg-white ${
      isFullscreen ? 'fixed inset-0 z-[99999] rounded-none w-screen h-screen' : 'w-full'
    }`}>
      
      {/* TOOLBAR SECTION */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border-b border-gray-200 select-none">
        
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-gray-250 pr-1.5 mr-1 shrink-0">
          <button
            type="button"
            onClick={() => execCmd('undo')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Hoàn tác (Undo)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('redo')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Lặp lại (Redo)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings / Block format dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => toggleMenu('heading')}
            className="rte-popover-trigger px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-gray-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Tiêu đề & Khung văn bản"
          >
            Kiểu chữ <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {activeMenu === 'heading' && (
            <div className="rte-popover absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 flex flex-col font-sans py-1.5 animate-slideUp">
              <button
                type="button"
                onClick={() => formatBlock('p')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-normal text-slate-750"
              >
                Văn bản thường (Paragraph)
              </button>
              <button
                type="button"
                onClick={() => formatBlock('h2')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-sm font-bold text-[#0C3471]"
              >
                Tiêu đề lớn (Heading 2)
              </button>
              <button
                type="button"
                onClick={() => formatBlock('h3')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-extrabold text-slate-800"
              >
                Tiêu đề vừa (Heading 3)
              </button>
              <button
                type="button"
                onClick={() => formatBlock('h4')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
              >
                Tiêu đề nhỏ (Heading 4)
              </button>
              <button
                type="button"
                onClick={() => formatBlock('blockquote')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-500 italic border-t border-slate-100 mt-1 pt-1.5"
              >
                Khối trích dẫn (Blockquote)
              </button>
            </div>
          )}
        </div>

        {/* Text styling group */}
        <div className="flex items-center gap-0.5 border-r border-gray-250 pr-1.5 mr-1 shrink-0">
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 font-extrabold transition-colors cursor-pointer"
            title="In đậm (Bold)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="In nghiêng (Italic)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Gạch chân (Underline)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Gạch ngang (Strikethrough)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Colors selector */}
        <div className="flex items-center gap-1 border-r border-gray-250 pr-1.5 mr-1 shrink-0 relative">
          {/* Font Color */}
          <button
            type="button"
            onClick={() => toggleMenu('textColor')}
            className="rte-popover-trigger p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-0.5"
            title="Màu chữ (Text Color)"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 -mt-0.5 border" style={{ backgroundColor: textColors[0].color }}></span>
          </button>
          {activeMenu === 'textColor' && (
            <div className="rte-popover absolute left-0 mt-8 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2.5 grid grid-cols-4 gap-1.5 animate-slideUp">
              {textColors.map((color) => (
                <button
                  key={color.color}
                  type="button"
                  onClick={() => { execCmd('foreColor', color.color); setActiveMenu(null); }}
                  className="w-7 h-7 rounded-lg border border-gray-100 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative group"
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                >
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-[8px] text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none mb-1 font-sans">{color.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Highlight Color */}
          <button
            type="button"
            onClick={() => toggleMenu('bgColor')}
            className="rte-popover-trigger p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-0.5"
            title="Màu nền chữ (Text Highlight)"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-200 -mt-0.5 border"></span>
          </button>
          {activeMenu === 'bgColor' && (
            <div className="rte-popover absolute left-8 mt-8 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2.5 grid grid-cols-4 gap-1.5 animate-slideUp">
              {bgColors.map((color) => (
                <button
                  key={color.color}
                  type="button"
                  onClick={() => { execCmd('hiliteColor', color.color); setActiveMenu(null); }}
                  className="w-7 h-7 rounded-lg border border-gray-150 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative group flex items-center justify-center bg-white"
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                >
                  {color.color === 'transparent' && <span className="text-[10px] text-slate-400 font-mono">✕</span>}
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-[8px] text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none mb-1 font-sans">{color.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alignment group */}
        <div className="flex items-center gap-0.5 border-r border-gray-250 pr-1.5 mr-1 shrink-0">
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Căn lề trái"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Căn lề giữa"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Căn lề phải"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyFull')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Căn lề đều hai bên"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Line break */}
        <div className="flex items-center gap-0.5 border-r border-gray-250 pr-1.5 mr-1 shrink-0">
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Danh sách mục tròn (Bullets)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Danh sách số (Ordered List)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertHorizontalRule')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Dòng kẻ ngang phân cách"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tables Integration */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => toggleMenu('table')}
            className="rte-popover-trigger p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-0.5"
            title="Chèn bảng biểu Word (Table)"
          >
            <Table className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>
          {activeMenu === 'table' && (
            <div className="rte-popover absolute left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3.5 animate-slideUp">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2 font-sans select-none">Chọn kích thước bảng:</span>
              <div className="grid grid-cols-5 gap-1 select-none">
                {Array.from({ length: 5 }).map((_, rIdx) => (
                  <div key={rIdx} className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, cIdx) => {
                      const r = rIdx + 1;
                      const c = cIdx + 1;
                      const isHighlighted = r <= hoverGrid.r && c <= hoverGrid.c;
                      return (
                        <div
                          key={cIdx}
                          onMouseEnter={() => setHoverGrid({ r, c })}
                          onClick={() => handleInsertTable(r, c)}
                          className={`w-6 h-6 border rounded cursor-pointer transition-all ${
                            isHighlighted 
                              ? 'bg-blue-100 border-blue-400 scale-[1.08] shadow-3xs' 
                              : 'bg-slate-50 border-gray-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="text-center text-[10px] text-blue-600 font-black font-sans mt-3 border-t pt-2">
                {hoverGrid.r > 0 && hoverGrid.c > 0 ? `${hoverGrid.r} dòng × ${hoverGrid.c} cột` : 'Di chuột để chọn'}
              </div>
            </div>
          )}
        </div>

        {/* Links & Media */}
        <div className="flex items-center gap-1 border-r border-gray-250 pr-1.5 mr-1 shrink-0 relative">
          {/* Link */}
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Chèn liên kết web (Hyperlink)"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('unlink')}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Xoá liên kết"
          >
            <Link2Off className="w-3.5 h-3.5" />
          </button>

          {/* Image Select options */}
          <button
            type="button"
            onClick={() => toggleMenu('image')}
            className="rte-popover-trigger p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-0.5"
            title="Chèn hình ảnh (Media)"
          >
            <Image className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>
          {activeMenu === 'image' && (
            <div className="rte-popover absolute left-8 mt-8 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1.5 flex flex-col font-sans gap-0.5 animate-slideUp">
              {onInsertMediaClick && (
                <button
                  type="button"
                  onClick={() => { onInsertMediaClick(); setActiveMenu(null); }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  📁 Chọn từ thư viện ảnh
                </button>
              )}
              <button
                type="button"
                onClick={handleInsertImageLink}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 border-t border-slate-100"
              >
                🔗 Dán liên kết ảnh URL
              </button>
            </div>
          )}
        </div>

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() => execCmd('removeFormat')}
          className="p-1.5 hover:bg-slate-200 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
          title="Xoá toàn bộ định dạng đang chọn"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Dynamic code viewer / Visual Editor toggle */}
        <button
          type="button"
          onClick={() => setShowCode(!showCode)}
          className={`p-1.5 px-2.5 border rounded-lg text-[10px] font-bold uppercase transition-colors shrink-0 flex items-center gap-1 cursor-pointer select-none ml-auto shadow-2xs ${
            showCode 
              ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600' 
              : 'bg-white hover:bg-slate-100 text-slate-600 border-gray-200'
          }`}
          title={showCode ? "Quay lại chế độ trực quan (WYSIWYG)" : "Chuyển sang soạn thảo mã HTML"}
        >
          {showCode ? (
            <>
              <Eye className="w-3.5 h-3.5" /> Trực quan
            </>
          ) : (
            <>
              <Code className="w-3.5 h-3.5" /> Xem mã HTML
            </>
          )}
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 border border-gray-200 bg-white shadow-2xs hover:shadow-xs transition-colors shrink-0 flex items-center justify-center cursor-pointer ml-1"
          title={isFullscreen ? "Thu nhỏ cửa sổ soạn thảo" : "Bật chế độ soạn thảo toàn màn hình"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

      </div>

      {/* EDITOR INPUT VIEWPORT */}
      <div className={`flex-1 relative bg-white ${isFullscreen ? 'overflow-y-auto' : ''}`}>
        
        {/* VISUAL EDITING DIV */}
        <div
          ref={editorRef}
          contentEditable={!showCode}
          onMouseDown={handleEditorMouseDown}
          onInput={handleInput}
          onBlur={handleInput}
          className={`rich-text-content focus:outline-none w-full p-6 font-sans leading-relaxed text-slate-700 min-h-[350px] overflow-y-auto ${
            showCode ? 'hidden' : 'block'
          } ${isFullscreen ? 'min-h-[calc(100vh-65px)] px-12 py-10 max-w-4xl mx-auto border-x border-slate-100 shadow-sm' : ''}`}
          placeholder={placeholder}
          style={{
            wordBreak: 'break-word',
            outline: 'none'
          }}
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
