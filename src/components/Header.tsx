/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Phone, MapPin, User, LogOut, Menu, X, ShieldCheck, ShoppingBag } from 'lucide-react';

interface HeaderProps {
  siteName: string;
  tagline: string;
  menuItems: { label: string; url: string }[];
  currentPath: string;
  onNavigate: (url: string) => void;
  currentUser: any;
  onLogout: () => void;
  onOpenAdmin: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export default function Header({ 
  siteName, 
  tagline, 
  menuItems, 
  currentPath, 
  onNavigate, 
  currentUser, 
  onLogout,
  onOpenAdmin,
  cartCount = 0,
  onOpenCart = () => {}
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" id="main-header">
      {/* Top Bar info */}
      <div className="bg-pentair text-white/90 text-xs py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-sans">
              <Phone className="w-3.5 h-3.5 text-blue-300" />
              Hotline miễn cước: <strong className="text-white hover:underline transition-all">1800 8134</strong>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-300" />
              Trụ sở: 90 Đinh Thị Thi, Vạn Phúc City, Thủ Đức
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-200 uppercase tracking-widest text-[10px] font-mono leading-none">
              Pentair USA - Leading the Water Revolution
            </span>
            {currentUser && (
              <span className="flex items-center gap-1 text-[11px] bg-white/10 px-2 py-0.5 rounded text-blue-100 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {currentUser.role === 'administrator' ? 'ADMIN' : 'EDITOR'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Bar Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo Branding */}
        <div 
          onClick={() => { onNavigate('/'); setMobileMenuOpen(false); }}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          id="logo-branding-container"
        >
          <div 
            className="w-10 h-10 rounded-lg bg-pentair flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-950/20 group-hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Sản phẩm lọc tổng cao cấp Pentair Mỹ"
          >
            P
          </div>
          <div>
            <h1 className="text-pentair text-xl md:text-2xl font-bold tracking-tight uppercase leading-none font-sans group-hover:text-pentair-light transition-colors">
              PENTAIR
            </h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase leading-none mt-1">
              {tagline || "Tinh Hoa Lọc Nước Từ Mỹ"}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          {menuItems.map((item, idx) => {
            const isActive = currentPath === item.url || (item.url !== '/' && currentPath.startsWith(item.url));
            return (
              <button
                key={idx}
                onClick={() => onNavigate(item.url)}
                className={`text-sm tracking-wide font-semibold uppercase transition-colors cursor-pointer relative py-2 ${
                  isActive 
                    ? 'text-pentair font-bold' 
                    : 'text-gray-600 hover:text-pentair'
                }`}
                id={`nav-item-${idx}`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pentair rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="hidden lg:flex items-center space-x-4">
          <button
            onClick={onOpenCart}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50/50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold tracking-wide transition-all border border-rose-100/40 uppercase relative cursor-pointer"
            id="btn-desktop-cart"
          >
            <ShoppingBag className="w-4 h-4 text-rose-500 shrink-0" />
            Giỏ hàng
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-sans font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-white shadow animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase text-pentair border border-pentair/30 rounded-lg hover:bg-pentair/5 transition-all cursor-pointer"
                id="btn-nav-admin"
              >
                <User className="w-3.5 h-3.5" />
                CMS Dashboard
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                id="btn-nav-logout"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onOpenCart}
            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 border border-rose-100 cursor-pointer relative"
            id="btn-mobile-cart"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-sans font-semibold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white shadow">
                {cartCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <button
              onClick={onOpenAdmin}
              className="p-1 px-2 border border-pentair/30 rounded text-xs font-semibold text-pentair bg-pentair/5"
            >
              CMS
            </button>
          ) : null}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-700 hover:text-pentair rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            id="mobile-menu-toggle"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 animate-fadeIn" id="mobile-drawer">
          <div className="px-4 pt-3 pb-6 space-y-3">
            {menuItems.map((item, idx) => {
              const isActive = currentPath === item.url || (item.url !== '/' && currentPath.startsWith(item.url));
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onNavigate(item.url);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm font-semibold uppercase rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-50/70 text-pentair font-bold' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  id={`mobile-nav-item-${idx}`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="border-t border-gray-100 pt-4 px-4 flex flex-col gap-3">
              {currentUser ? (
                <>
                  <button
                    onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold uppercase text-pentair border border-pentair/30 rounded-lg text-center"
                    id="btn-mobile-cms"
                  >
                    <User className="w-4 h-4" />
                    Bảng điều khiển CMS
                  </button>
                  <button
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg text-center"
                    id="btn-mobile-logout"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất khỏi Admin
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
