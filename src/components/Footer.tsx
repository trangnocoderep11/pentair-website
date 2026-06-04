/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, Phone, MapPin, Youtube, Facebook, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface FooterProps {
  brandSettings: {
    siteName: string;
    tagline: string;
    email: string;
    phone: string;
    address: string;
    facebook: string;
    youtube: string;
  };
  policies: { title: string; content: string }[];
  showrooms: { name: string; address: string; phone: string }[];
  onNavigate: (url: string) => void;
  onOpenAdmin?: () => void;
  logoText?: string;
  logoImageUrl?: string;
  logoTextFull?: string;
}

export default function Footer({ 
  brandSettings, 
  policies, 
  showrooms, 
  onNavigate, 
  onOpenAdmin,
  logoText = 'P',
  logoImageUrl = '',
  logoTextFull = 'PENTAIR VN'
}: FooterProps) {
  const [activePolicyIdx, setActivePolicyIdx] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredShowrooms = React.useMemo(() => {
    if (!searchQuery.trim()) return showrooms;
    const query = searchQuery.toLowerCase().trim();
    return showrooms.filter(show => 
      (show.name && show.name.toLowerCase().includes(query)) ||
      (show.address && show.address.toLowerCase().includes(query)) ||
      (show.phone && show.phone.includes(query))
    );
  }, [showrooms, searchQuery]);

  return (
    <footer className="bg-pentair text-white font-sans mt-auto border-t-4 border-pentair-light" id="main-footer">
      {/* Top Banner Contact Strip */}
      <div className="border-b border-white/10 bg-pentair-dark/40 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-lg font-bold text-white tracking-tight uppercase">Liên hệ Pentair Việt Nam</h4>
            <p className="text-xs text-blue-200 mt-1">Đại diện chính hãng máy lọc nước toàn nhà Pentair nhập khẩu Hoa Kỳ.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a 
              href={brandSettings.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
            >
              <Facebook className="w-4 h-4 text-blue-400" />
              Fanpage Facebook
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <a 
              href={brandSettings.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
            >
              <Youtube className="w-4 h-4 text-red-500" />
              Kênh YouTube Official
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            {logoImageUrl ? (
              <img 
                src={logoImageUrl} 
                alt={logoTextFull || brandSettings.siteName} 
                className="h-8 object-contain brightness-0 invert" 
              />
            ) : (
              <div className="w-8 h-8 rounded bg-white text-pentair flex items-center justify-center font-black text-base">
                {logoText}
              </div>
            )}
            <span className="text-xl font-bold tracking-tight uppercase">{logoTextFull}</span>
          </div>
          <p className="text-xs text-blue-200 leading-relaxed">
            Pentair mang giải pháp lọc tổng thông minh chuẩn Mỹ. Kiến tạo sức mạnh lọc nước đỉnh cao bảo vệ trọn vẹn gia đình từ 1966.
          </p>
          <div className="space-y-2 text-xs text-blue-100">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
              <span>{brandSettings.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-300 shrink-0" />
              <span>Hotline: {brandSettings.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-300 shrink-0" />
              <span>Email: {brandSettings.email}</span>
            </div>
          </div>
        </div>

        {/* Showroom Columns */}
        <div className="space-y-4 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-2">
            <h5 className="text-sm font-bold tracking-wider uppercase text-blue-300">
              Hệ Thống Showroom Ủy Quyền ({filteredShowrooms.length})
            </h5>
            {/* Search Input Box */}
            <div className="relative w-full sm:w-56 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm showroom, tỉnh thành..."
                className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1 text-[11px] text-white placeholder-blue-200/40 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white text-xs font-bold font-sans"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Scrollable grid container */}
          <div 
            className="max-h-[300px] overflow-y-auto pr-1 space-y-3 mt-2 scrollbar-thin"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent' 
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredShowrooms.map((show, idx) => (
                <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                  <h6 className="text-xs font-bold text-white flex items-start gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                    <span>{show.name}</span>
                  </h6>
                  <p className="text-[10px] text-blue-200/90 leading-relaxed min-h-[30px]">{show.address}</p>
                  <p className="text-[10px] text-blue-100 font-semibold flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3 text-blue-300 shrink-0" />
                    SĐT: {show.phone}
                  </p>
                </div>
              ))}
            </div>
            {filteredShowrooms.length === 0 && (
              <p className="text-xs text-center text-blue-300/40 py-8 italic font-sans">Không tìm thấy showroom phù hợp.</p>
            )}
          </div>
        </div>

        {/* Policies Quick Access Column */}
        <div className="space-y-4">
          <h5 className="text-sm font-bold tracking-wider uppercase border-b border-white/10 pb-2 text-blue-300">
            Chính Sách Khách Hàng
          </h5>
          <div className="flex flex-col gap-2">
            {policies.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActivePolicyIdx(activePolicyIdx === idx ? null : idx)}
                className="text-left py-1 text-xs text-blue-100 hover:text-white transition-colors flex justify-between items-center w-full group cursor-pointer"
                id={`btn-policy-foot-${idx}`}
              >
                <span className="font-medium group-hover:translate-x-0.5 transition-transform">{p.title}</span>
                <span className="text-[10px] bg-white/10 px-1 py-0.5 rounded group-hover:bg-white/20">Chi tiết</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Policy Modal Overlay */}
      {activePolicyIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" id="policy-overlay-modal">
          <div className="bg-white text-gray-800 rounded-xl max-w-lg w-full p-6 relative shadow-2xl border border-gray-100 animate-slideUp">
            <h4 className="text-lg font-bold text-pentair uppercase mb-3 flex items-center gap-1.5 border-b pb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {policies[activePolicyIdx].title}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 whitespace-pre-line">
              {policies[activePolicyIdx].content}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setActivePolicyIdx(null)}
                className="px-4 py-2 text-xs font-semibold uppercase text-white bg-pentair rounded-lg hover:bg-pentair-light transition-all cursor-pointer"
                id="btn-close-policy-modal"
              >
                Đã hiểu & Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar Credit */}
      <div className="bg-pentair-dark py-4 text-center text-xs text-blue-300/60 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              © 2026 Pentair PLC. Bản quyền thương hiệu và giải pháp thuộc về Pentair Inc. Hoa Kỳ.
            </span>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-blue-200 hover:text-white transition-colors duration-150 flex items-center gap-1 font-semibold text-xs py-0.5 px-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 cursor-pointer"
                id="btn-footer-admin-portal"
              >
                <span>⚙ Cổng Quản Trị (CMS Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
