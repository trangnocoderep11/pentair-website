/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  items: { label: string; url?: string }[];
  onNavigate: (url: string) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 py-4 px-4 bg-gray-50/50 rounded-lg mb-6 border border-gray-100" aria-label="Breadcrumb">
      <button 
        onClick={() => onNavigate('/')}
        className="flex items-center gap-1 hover:text-pentair transition-colors font-medium cursor-pointer"
        id="btn-breadcrumb-home"
      >
        <Home className="w-4 h-4" />
        <span>Trang chủ</span>
      </button>
      
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={idx} className="flex items-center space-x-2">
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            {isLast || !item.url ? (
              <span className="text-gray-900 font-semibold truncate max-w-[200px] md:max-w-xs">{item.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(item.url!)}
                className="hover:text-pentair transition-colors font-medium cursor-pointer"
                id={`btn-breadcrumb-${idx}`}
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
