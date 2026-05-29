/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'administrator' | 'editor';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

export type PostType = 'post' | 'page' | 'product' | 'showroom';
export type PostStatus = 'publish' | 'published' | 'active' | 'draft';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: PostType;
  status: PostStatus;
  published_at?: string;
  authorId: string;
  featuredImage: string;
  parentId?: string;
  menuOrder: number;
  createdAt: string;
  updatedAt: string;
  // Custom metadata mapped directly for convenience, saving extensive joins
  meta: Record<string, any>;
  terms: { id: string; name: string; slug: string; taxonomy: 'category' | 'tag' | 'product_cat' }[];
}

export interface Term {
  id: string;
  name: string;
  slug: string;
  taxonomy: 'category' | 'tag' | 'product_cat';
  parentId?: string;
  status?: 'publish' | 'hidden';
}

export interface Option {
  id: string;
  optionName: string;
  optionValue: any;
}

export interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  productInterest?: string;
  productQuantity?: string;
  address?: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  sourceUrl?: string;
  formName?: string;
}

export interface CartItem {
  id: string; // Unique identifier for the cart item (usually product.id)
  product: Post;
  quantity: number;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsTxt: string;
  googleAnalyticsId?: string;
  ogImage?: string;
}

// Full WordPress-like database backup format for Import/Export
export interface CMSBackup {
  users: Omit<User, 'twoFactorSecret'>[];
  posts: Post[];
  terms: Term[];
  options: Option[];
  submissions: FormSubmission[];
  exportedAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string; // id of the parent folder (supports multi-level nesting)
  createdAt: string;
}

export interface MediaItem {
  id: string;
  title: string;
  url: string; // can be /uploads/... or absolute external url
  altText?: string;
  description?: string;
  folderId?: string; // which folder it belongs to
  fileSize?: number; // size in bytes
  mimeType?: string; // image/jpeg, image/png, etc
  createdAt: string;
  updatedAt: string;
}
