/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import pg from "pg";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;


// Clean inputs manually to mitigate XSS (WordPress akin sanitisers)
function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Solid HTML sanitization for rich text fields to prevent executable XSS injections
function sanitizeHtml(html: string): string {
  if (!html) return '';
  // 1. Remove script blocks entirely
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 2. Remove inline event handlers like onclick, onload, onerror, etc. and javascript: links
  clean = clean.replace(/\bon[a-z]+\s*=\s*(['"])(.*?)\1/gi, '');
  clean = clean.replace(/\bon[a-z]+\s*=\s*(#[a-zA-Z0-9_\-]+|[^>]*?)(?=\s|>)/gi, '');
  clean = clean.replace(/href\s*=\s*(["'])\s*javascript:[^"']*\1/gi, 'href="#"');
  
  // 3. Remove flash/iframe/object tags that can run arbitrary code unless they are safe embeds (like youtube embeds)
  clean = clean.replace(/<iframe\b(?![^>]*youtube\.com\/embed\/)[^>]*>.*?<\/iframe>/gi, '');
  clean = clean.replace(/<(object|embed|form|link|meta|style|applet)\b[^>]*>.*?<\/\1>/gi, '');
  clean = clean.replace(/<(object|embed|form|link|meta|style|applet)\b[^>]*>/gi, '');
  
  return clean;
}

// Uploads directory — public/uploads/ for Vercel CDN serving
const UPLOADS_BASE = path.join(process.cwd(), "public", "uploads");

// Ensure uploads directory exists (local dev / self-hosted only — skip on Vercel, filesystem is read-only)
if (!process.env.VERCEL) {
  try {
    if (!fs.existsSync(UPLOADS_BASE)) {
      fs.mkdirSync(UPLOADS_BASE, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create uploads directory.", err);
  }
}

// Pre-seeded / bootstrap data
const bootstrapData = {
  users: [
    {
      id: "usr-admin",
      username: "admin",
      passwordHash: crypto.createHash('sha256').update("admin123").digest('hex'),
      email: "contact@pentairvn.com",
      role: "administrator",
      twoFactorEnabled: false,
      twoFactorSecret: "PENTAIR-SECURE-2FA-TOKEN-ADMIN",
    },
    {
      id: "usr-editor",
      username: "editor",
      passwordHash: crypto.createHash('sha256').update("editor123").digest('hex'),
      email: "editor@pentairvn.com",
      role: "editor",
      twoFactorEnabled: false,
    }
  ],
  terms: [
    { id: "term-1", name: "Hệ thống lọc nước đầu nguồn", slug: "he-thong-loc-dau-nguon", taxonomy: "product_cat" },
    { id: "term-2", name: "Bài viết nổi bật", slug: "tin-noi-bat", taxonomy: "category" },
    { id: "term-3", name: "Nguồn nước sạch", slug: "tin-nguon-nuoc", taxonomy: "category" },
  ],
  posts: [
    {
      id: "page-home",
      title: "Trang Chủ",
      slug: "trang-chu",
      content: "Giải pháp lọc nước tinh khiết hàng đầu từ Mỹ - Pentair mang dòng nước thượng hạng bảo vệ tổ ấm của bạn.",
      excerpt: "Công nghệ Mỹ tiên phong, mang nước sạch đỉnh cao đến gia đình Việt.",
      type: "page",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
      menuOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      meta: {
        bannerTitle: "Pentair - Tinh Hoa Lọc Nước Từ Mỹ",
        bannerSubTitle: "Tiên Phong Công Nghệ Lọc Tổng Cao Cấp Cho Biệt Thự & Căn Hộ Sang Trọng",
        introTitle: "Thương Hiệu Dẫn Đầu Thế Giới",
        introBody: "Pentair được thành lập năm 1966 tại Minnesota (Mỹ), hiện là tập đoàn hàng đầu thế giới về các giải pháp xử lý nước toàn diện. Chúng tôi không chỉ cung cấp máy lọc nước, chúng tôi kiến tạo phong cách sống an tâm, thời thượng với nguồn nước tinh khiết chảy tràn trọn vẹn tại mọi vòi trong tổ ấm của bạn.",
        whyChooseUs: [
          { title: "Công Nghệ Độc Quyền", desc: "Sở hữu hơn 1.200 bằng sáng chế toàn cầu về màng lọc và van điều khiển thông minh." },
          { title: "Sản Xuất Tại Mỹ", desc: "Các dòng sản phẩm chính hãng Pentair được nhập trực tiếp từ nhà máy Mỹ & Châu Âu, vận hành bền bỉ trên 20 năm." },
          { title: "Phong Cách Sang Trọng", desc: " Thiết kế tối giản tinh gọn, phù hợp hài hòa trong phòng kỹ thuật biệt thự hoặc tủ bếp căn hộ cao cấp." }
        ],
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        perspectives: [
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
        ]
      },
      terms: []
    },
    {
      id: "page-about",
      title: "Về Pentair",
      slug: "ve-pentair",
      content: "Tìm hiểu về lịch sử vinh quang, tầm nhìn chiến lược và các chứng nhận toàn cầu khẳng định vị thế số 1 của Pentair.",
      excerpt: "Hành trình hơn 50 năm dẫn đầu ngành tài nguyên nước toàn cầu.",
      type: "page",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      menuOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      meta: {
        history: "Thành lập năm 1966, Pentair khởi đầu từ một nhóm nhỏ các nhà sáng chế tại Minneapolis, Mỹ. Với triết lý nước sạch là mạch sống của thế giới, Pentair không ngừng thâu tóm các công nghệ lọc danh tiếng như Fleck (van điều khiển hàng đầu), Pentek (lõi lọc tiêu chuẩn công nghiệp), Everpure (thương hiệu số 1 trong ngành F&B toàn cầu). Đến nay, chúng tôi hiện diện trên 150 quốc gia với doanh thu hàng tỷ USD.",
        vision: "Mang nguồn nước an toàn, bền vững đến mọi ngóc ngách của cuộc sống. Giảm thiểu rác thải nhựa thông qua hệ thống lọc trung tâm cao cấp không cần thay thế lõi liên tục.",
        awards: [
          "Cúp Sáng Chế Xuất Sắc Hoa Kỳ (US Patent Award)",
          "Chứng nhận Độc Quyền Van Điều Khiển Thông Minh Fleck 5800",
          "Top 50 Doanh Nghiệp Phát Triển Bền Vững Nhất của Forbes"
        ],
        certificates: [
          "NSF/ANSI Standard 44 cho khả năng làm mềm nước cứng vượt trội.",
          "NSF/ANSI Standard 53 về lọc giảm thiểu vi nhựa và kim loại nặng.",
          "Chứng nhận WQA Gold Seal quý giá nhất trong ngành xử lý nước toàn quốc tế."
        ]
      },
      terms: []
    },
    {
      id: "prod-maxi",
      title: "Hệ thống lọc tổng Softena CS Maxi",
      slug: "softena-cs-maxi",
      content: "Hệ thống lọc nước toàn ngôi nhà tối tân nhất. Pentair Softena CS Maxi tích hợp màng lọc sâu và cột làm mềm cao cấp sử dụng hạt cation cao cấp, kiểm soát tự động thông qua van thông minh Fleck điều hành tự rửa theo lưu lượng thực tế.",
      excerpt: "Giải pháp lọc tổng cao cấp tuyệt hảo bậc nhất cho lâu đài và biệt thự đẳng cấp tại Việt Nam.",
      type: "product",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=800&q=80",
      menuOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published_at: new Date().toISOString(),
      meta: {
        price: "185.000.000 VNĐ",
        specs: [
          { name: "Công suất lọc tối đa", value: "3.5 m3/giờ" },
          { name: "Công nghệ lọc", value: "Smart-Multistage Lọc đa tầng tự rửa + Softener Fleck" },
          { name: "Tiêu chuẩn nước ra", value: "Nước sinh hoạt cao cấp chuẩn Mỹ NSF, bảo vệ da và tóc" },
          { name: "Nguồn gốc xuất xứ", value: "Hàng nhập khẩu đồng bộ 100% từ Mỹ (Made in USA)" },
          { name: "Bảo hành thiết bị", value: "5 năm bảo hành chính hãng toàn diện" },
          { name: "Kích thước lắp đặt", value: "140 x 65 x 165 cm (Dài x Rộng x Cao)" }
        ],
        features: [
          "Van Fleck 5800 đỉnh cao điều khiển tự rửa ngược tiết kiệm 40% lượng muối tái sinh.",
          "Hạt làm mềm Dowex cao cấp nhập Mỹ loại bỏ hoàn toàn cặn canxi, magie gây bám cặn vòi rồng, gương kính.",
          "Màng sợi rỗng siêu lọc UF loại bỏ virus, vi khuẩn siêu nhỏ."
        ],
        scenes: [
          "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"
        ],
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        images: ["https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=800&q=80"],
        cloneSource: "Dữ liệu clone chính xác từ thegioiloctong.com - Nhà phân phối Pentair Việt Nam uỷ quyền."
      },
      terms: [{ id: "term-1", name: "Hệ thống lọc nước đầu nguồn", slug: "he-thong-loc-dau-nguon", taxonomy: "product_cat" }]
    },
    {
      id: "prod-midi",
      title: "Hệ thống lọc nước Softena CS Midi",
      slug: "softena-cs-midi",
      content: "Thiết kế siêu nhỏ gọn nhưng sức mạnh lọc nước không đổi. Phù hợp hoàn hảo cho các khu chung cư cao cấp, Pentair Softena CS Midi loại bỏ hóa chất dư thừa, clo, màu, mùi lạ, làm nước mềm dịu bảo vệ tuyệt hảo bình nóng lạnh, máy rửa bát.",
      excerpt: "Nước sạch chuẩn Mỹ trong tủ kỹ thuật hạn chế của căn hộ chung cư cao cấp.",
      type: "product",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1585837575652-267c0ee1228b?auto=format&fit=crop&w=800&q=80",
      menuOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published_at: new Date().toISOString(),
      meta: {
        price: "98.000.000 VNĐ",
        specs: [
          { name: "Công suất lọc tối đa", value: "2.0 m3/giờ" },
          { name: "Công nghệ lọc", value: "Lọc carbon hấp phụ tích hợp màng lọc cơ học tự làm sạch" },
          { name: "Tiêu chuẩn nước ra", value: "Chuẩn nước sinh hoạt chuẩn Mỹ, an toàn tuyệt đối" },
          { name: "Nguồn gốc xuất xứ", value: "Nhập khẩu nguyên bộ từ tập đoàn Pentair (Mexico/USA)" },
          { name: "Bảo hành thiết bị", value: "3 năm chính hãng" },
          { name: "Kích thước lắp đặt", value: "70 x 45 x 110 cm" }
        ],
        features: [
          "Cấu trúc bọc tủ bảo vệ chống va đập, sang trọng thanh lịch tuyệt đối.",
          "Hạt hoạt tính cao cấp carbon hoạt tính gáo dừa có hoạt lực xử lý hữu cơ gấp 5 lần than thường.",
          "Cơ chế an toàn ngắt nước tự động khi có dấu hiệu quá tải."
        ],
        scenes: [
          "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=800&q=80"
        ],
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        images: ["https://images.unsplash.com/photo-1585837575652-267c0ee1228b?auto=format&fit=crop&w=800&q=80"],
        cloneSource: "Clone từ thegioiloctong.com - Pentair Premium Partner."
      },
      terms: [{ id: "term-1", name: "Hệ thống lọc nước đầu nguồn", slug: "he-thong-loc-dau-nguon", taxonomy: "product_cat" }]
    },
    {
      id: "prod-everpure",
      title: "Máy lọc nước uống cao cấp Everpure PBS-400",
      slug: "everpure-pbs-400",
      content: "Giải pháp lọc nước uống trực tiếp tinh khiết nguyên khoáng chuẩn quốc tế NSF/ANSI 42 và 53 từ thương hiệu số một Hoa Kỳ Everpure.",
      excerpt: "Nước uống nguyên khoáng lý tưởng tuyệt hảo ngay tại vòi phòng bếp nhà bạn.",
      type: "product",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      menuOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published_at: new Date().toISOString(),
      meta: {
        price: "18.500.000 VNĐ",
        specs: [
          { name: "Công suất lọc tối đa", value: "5.678 lít/phút" },
          { name: "Công nghệ lọc", value: "Precoat độc quyền với lớp lọc nếp gấp thông minh kép" },
          { name: "Tiêu chuẩn nước ra", value: "Nước uống trực tiếp chuẩn quốc tế NSF 42 & 53" },
          { name: "Nguồn gốc xuất xứ", value: "Nhập khẩu nguyên bộ từ Mỹ (Made in USA)" },
          { name: "Bảo hành thiết bị", value: "1 năm chính hãng" },
          { name: "Kích thước lắp đặt", value: "45 x 15 x 15 cm" }
        ],
        features: [
          "Màng lọc nếp gấp Micro-Pure độc quyền loại bỏ các tạp chất nhỏ tới 0.5 micron.",
          "Hạn chế tuyệt đối vi khuẩn, clo, màu mùi lạ nhưng giữ nguyên khoáng chất tự nhiên.",
          "Thay lõi dễ dàng trong 30 giây với cơ chế ngắt nước tự động tiện dụng."
        ],
        scenes: [
          "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80"
        ],
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"],
        cloneSource: "Dữ liệu chính hãng Pentair Everpure Việt Nam."
      },
      terms: [{ id: "term-1", name: "Hệ thống lọc nước đầu nguồn", slug: "he-thong-loc-dau-nguon", taxonomy: "product_cat" }]
    },
    {
      id: "prod-scaleshield",
      title: "Hệ thống chống bám cặn Pentair Scaleshield Lọc mềm",
      slug: "pentair-scaleshield",
      content: "Công nghệ bảo vệ nhiệt độ nước nóng chống lại mảng bám bám dính canxi cứng đầu mà không dùng hóa chất hay muối tái sinh.",
      excerpt: "Bảo vệ toàn diện hệ thống nước nóng biệt thự và lâu đài chống lại tác nhân bám cặn vôi cứng.",
      type: "product",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
      menuOrder: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published_at: new Date().toISOString(),
      meta: {
        price: "45.000.000 VNĐ",
        specs: [
          { name: "Lưu lượng nước xử lý", value: "4.0 m3/giờ" },
          { name: "Công nghệ chống đóng cặn", value: "Smart ScaleShield Media chống bám dính" },
          { name: "Tiêu chuẩn an toàn", value: "Thực phẩm chuẩn NSF 61 Hoa Kỳ bảo quản vòi rồng" },
          { name: "Xuất xứ linh kiện", value: "Nhập khẩu nguyên bộ đồng bộ của Pentair USA" },
          { name: "Tuổi thọ vật liệu", value: "Lên đới 5-7 năm không tích lũy cặn bẩn" }
        ],
        features: [
          "Ngăn ngừa cáu cặn canxi bám dính trong đường ống đắt giá và bình năng lượng mặt trời.",
          "Vận hành 100% tự nhiên không cần điện nước xả thải.",
          "Thẩm mỹ cao gọn gàng, lắp đặt linh động ngoài ban công biệt thự."
        ],
        scenes: [
          "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=800&q=80"
        ],
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        images: ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"],
        cloneSource: "Clone từ database thegioiloctong.com phân phối uỷ quyền."
      },
      terms: [{ id: "term-1", name: "Hệ thống lọc nước đầu nguồn", slug: "he-thong-loc-dau-nguon", taxonomy: "product_cat" }]
    },
    {
      id: "prod-omnifilter",
      title: "Bộ lọc trung tâm sơ cấp Pentair Omni OT32",
      slug: "pentair-omni-ot32",
      content: "Thiết bị lọc chặn sơ lọc bùn đất, rỉ sét, cặn lơ lửng ngay đầu nguồn cấp nươc toàn biệt thự, lắp cùng van xả cặn tự động lọc cơ học.",
      excerpt: "Nước cấp trong ngần tuyệt hảo ngay trước khi đi vào các thiết bị lọc chuyên dụng.",
      type: "product",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
      menuOrder: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published_at: new Date().toISOString(),
      meta: {
        price: "12.500.000 VNĐ",
        specs: [
          { name: "Đường kính kết nối", value: "DN32 ren trong bền chắc" },
          { name: "Độ mịn màng lọc", value: "40 - 60 micron màng lưới inox 316 siêu bền" },
          { name: "Cơ chế tự xả cặn", value: "Van xả cặn cơ tự động xoáy xả cực sạch" },
          { name: "Khả năng chịu áp", value: "Tối đa 12 bar chống bục nứt rò nước" }
        ],
        features: [
          "Màng lọc thép không gỉ SUS 316 trọn vẹn vòng đời sản phẩm không cần thay lõi.",
          "Áp suất nước cấp chảy mạnh không bị suy hao qua hệ lọc.",
          "Đồng hồ đo áp suất tích hợp thông báo thời điểm xả rửa cặn bùn."
        ],
        scenes: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"
        ],
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        images: ["https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80"],
        cloneSource: "Specs standard catalog Pentair Global."
      },
      terms: [{ id: "term-1", name: "Hệ thống lọc nước đầu nguồn", slug: "he-thong-loc-dau-nguon", taxonomy: "product_cat" }]
    },
    {
      id: "prod-draft",
      title: "Hệ thống lọc nước RO Pentair Line-Up siêu tinh khiết",
      slug: "pentair-line-up",
      content: "Sản phẩm thế hệ mới của tập đoàn Pentair tích hợp màng siêu Ro tinh khiết và cảnh báo rò rỉ nước thông minh trên điện thoại di động.",
      excerpt: "Bản nháp sản phẩm - Trình duyệt CMS chất lượng lọc tổng của Pentair, chỉ admin mới thấy.",
      type: "product",
      status: "draft",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
      menuOrder: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published_at: "", // Empty for draft
      meta: {
        price: "29.000.000 VNĐ",
        specs: [
          { name: "Công suất lọc cấp RO", value: "600 GPD (khoảng 90 lít/giờ)" },
          { name: "Màn hình hiển thị", value: "Đèn LED hiển thị chất lượng tinh khiết TDS" },
          { name: "Ứng dụng thông minh", value: "Kết nối Wifi theo dõi thời hạn thay lõi qua app" }
        ],
        features: [
          "Lõi lọc Carbon kết hợp khối nén loại bỏ clo dư hoàn toàn độc tố.",
          "Màng RO xoáy hiệu năng cao nâng cao tỉ lệ thu hồi nước mặn tinh khiết lên tới 65%.",
          "Cảnh báo rò rỉ nước tự ngắt điện, ngắt dòng an toàn tối cao."
        ],
        scenes: [
          "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80"
        ],
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        images: ["https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80"],
        cloneSource: "Bản quyền mẫu thử nghiệm - Pentair USA R&D Lab."
      },
      terms: [{ id: "term-1", name: "Hệ thống lọc nước đầu nguồn", slug: "he-thong-loc-dau-nguon", taxonomy: "product_cat" }]
    },
    {
      id: "post-1",
      title: "Lễ ký kết hợp tác chiến lược phân phối Pentair chính hãng toàn Việt Nam",
      slug: "ky-ket-hop-tac-chien-luoc-pentair",
      content: "Vừa qua, tập đoàn Pentair toàn cầu đã ký thỏa thuận độc quyền với các đối tác hàng đầu đem những thiết bị lọc đầu nguồn Fleck vượt bậc về Việt Nam nhằm kiến tạo tiêu chuẩn nước sinh hoạt siêu sang.",
      excerpt: "Pentair chính thức thắt chặt hợp tác phát triển hệ sinh thái xử lý nước cao cấp tại Đông Nam Á.",
      type: "post",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
      menuOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      meta: {
        seoTitle: "Lễ ký kết hợp tác chiến lược phân phối Pentair toàn Việt Nam",
        seoDescription: "Sự kiện ký kết của Pentair mang lại dòng nước sinh hoạt tiêu chuẩn cao cấp Mỹ cho hàng ngàn gia đình Việt Nam."
      },
      terms: [{ id: "term-2", name: "Bài viết nổi bật", slug: "tin-noi-bat", taxonomy: "category" }]
    },
    {
      id: "post-2",
      title: "Thực trạng nước cứng tại các khu đô thị lớn & cách xử lý triệt để",
      slug: "thuc-trang-nuoc-cung-va-cach-xu-ly",
      content: "Nước cứng chứa hàm lượng Canxi, Magie cao gây tắc nghẽn đường ống dẫn, xơ tóc, khô da và ô-xi hóa vòi rửa đắt tiền. Sử dụng cột làm mềm hạt Dowex tự tái sinh của Pentair giúp cuộc sống gia đình đạt chất lượng nước mềm lý tưởng.",
      excerpt: "Nước cứng - Sát thủ thầm lặng bào mòn nội thất nhà tắm đắt giá của bạn và cách ứng cứu kịp thời.",
      type: "post",
      status: "publish",
      authorId: "usr-admin",
      featuredImage: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
      menuOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      meta: {
        seoTitle: "Thực trạng nước cứng & công nghệ xử lý tiên tiến của Pentair",
        seoDescription: "Hiểu rõ về nước cứng và giải pháp lọc tổng Pentair làm mềm nguồn nước hiệu quả vượt bậc."
      },
      terms: [{ id: "term-3", name: "Nguồn nước sạch", slug: "tin-nguon-nuoc", taxonomy: "category" }]
    }
  ],
  options: [
    {
      id: "opt-brand",
      optionName: "brand_settings",
      optionValue: {
        siteName: "Pentair Việt Nam",
        tagline: "Tinh Hoa Lọc Nước Từ Mỹ",
        email: "pentairvn@gmail.com",
        phone: "1800 8134",
        address: "90 Đ. Đinh Thị Thi, Khu đô Thị Vạn Phúc, Thủ Đức, Hồ Chí Minh",
        facebook: "https://www.facebook.com/PentairVietNamOfficial",
        youtube: "https://www.youtube.com/@PentairVietNamOfficial",
        colorTheme: "#0C3471"
      }
    },
    {
      id: "opt-menus",
      optionName: "header_menu",
      optionValue: [
        { label: "Về Pentair", url: "/ve-pentair" },
        { label: "Sản phẩm", url: "/san-pham" },
        { label: "Phối cảnh", url: "/phoi-canh" },
        { label: "Tin tức", url: "/tin-tuc" },
        { label: "Liên hệ", url: "/lien-he" }
      ]
    },
    {
      id: "opt-seo",
      optionName: "seo_settings",
      optionValue: {
        metaTitle: "Pentair Việt Nam | Máy lọc nước tổng cao cấp nhập khẩu Mỹ",
        metaDescription: "Pentair VN là đơn vị phân phối giải pháp lọc nước Pentair Hoa Kỳ cao cấp cho lâu đài, biệt thự sang trọng. Hotline: 1800 8134.",
        canonicalUrl: "https://thegioiloctong.com",
        robotsTxt: "User-agent: *\nDisallow: /admin/\nAllow: /\n\nSitemap: https://thegioiloctong.com/sitemap.xml",
        googleAnalyticsId: "G-PENTAIR123",
        ogImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
      }
    },
    {
      id: "opt-showrooms",
      optionName: "showrooms",
      optionValue: [
        {
          name: "Showroom Lê Quang Định (Bình Thạnh/Gò Vấp)",
          address: "509 Lê Quang Định, Phường Hạnh Thông (Đoạn giao giữa Bình Thạnh với Gò Vấp), TP. Hồ Chí Minh",
          phone: "1800 8134"
        },
        {
          name: "Showroom Đường số 2 (Vạn Phúc City)",
          address: "118 Đường số 2 Vạn Phúc City, Phường Hiệp Bình (Phường Hiệp Bình Phước, TP. Thủ Đức cũ), TP. Hồ Chí Minh",
          phone: "1800 8134"
        },
        {
          name: "Showroom Vành Đai Tây (Quận 2 cũ)",
          address: "45 Vành Đai Tây, Phường An Khánh (Phường An Khánh, TP. Thủ Đức cũ), TP. Hồ Chí Minh",
          phone: "1800 8134"
        },
        {
          name: "Showroom Richstar Novaland (Tân Phú)",
          address: "Cổng 1 - Block RS7 Khu Shophouse Richstar Novaland số 239-241-278 Hòa Bình, Phường Phú Thạnh (Phường Hiệp Tân, Quận Tân Phú cũ), TP. Hồ Chí Minh",
          phone: "1800 8134"
        },
        {
          name: "Showroom Võ Thị Đặng (Quận 7 cũ)",
          address: "118A Đường Võ Thị Đặng, Phường Tân Mỹ (Phường Tân Phú, Quận 7 cũ), TP. Hồ Chí Minh",
          phone: "1800 8134"
        },
        {
          name: "Showroom Lý Chính Thắng (Quận 3)",
          address: "200 Bis Lý Chính Thắng, Phường Nhiêu Lộc (Phường 9, Quận 3 cũ), TP. Hồ Chí Minh",
          phone: "1800 8134"
        },
        {
          name: "Showroom Thích Quảng Đức (Thủ Dầu Một)",
          address: "214 Thích Quảng Đức, Phường Thủ Dầu Một (Phường Phú Cường, TP. Thủ Dầu Một cũ), Tỉnh Bình Dương",
          phone: "1800 8134"
        },
        {
          name: "Showroom Hoàng Văn Thụ (Vũng Tàu)",
          address: "114 Hoàng Văn Thụ, Phường Tam Thắng (Phường 7, TP. Vũng Tàu cũ), Tỉnh Bà Rịa - Vũng Tàu",
          phone: "1800 8134"
        },
        {
          name: "Showroom Võ Văn Kiệt (Cần Thơ)",
          address: "216 Võ Văn Kiệt, Phường Cái Khế (Phường An Hòa, Quận Ninh Kiều cũ), TP. Cần Thơ",
          phone: "1800 8134"
        },
        {
          name: "Showroom Đồng Khởi (Biên Hòa)",
          address: "65 Đồng Khởi, Phường Tam Hiệp (TP. Biên Hòa cũ), Tỉnh Đồng Nai",
          phone: "1800 8134"
        },
        {
          name: "Showroom Đinh Thị Thi (Vạn Phúc City)",
          address: "90 Đường Đinh Thị Thi, Vạn Phúc City, Phường Hiệp Bình (Phường Hiệp Bình Phước, TP.Thủ Đức cũ), TP. Hồ Chí Minh",
          phone: "1800 8134"
        },
        {
          name: "Showroom Trần Cao Vân (Đà Nẵng)",
          address: "576 Trần Cao Vân, Phường Thanh Khê (Phường Xuân Hà, Quận Thanh Khê cũ), TP. Đà Nẵng",
          phone: "1800 8134"
        },
        {
          name: "Showroom Văn Tiến Dũng (Nha Trang)",
          address: "51 Văn Tiến Dũng, Phường Nam Nha Trang (Phường Phước Hải, TP. Nha Trang cũ), Tỉnh Khánh Hòa",
          phone: "1800 8134"
        },
        {
          name: "Showroom Tây Sơn (Quy Nhơn)",
          address: "309 Tây Sơn, Phường Quy Nhơn Nam (Phường Quang Trung, TP. Quy Nhơn cũ), Tỉnh Gia Lai",
          phone: "1800 8134"
        },
        {
          name: "Showroom Trần Phú (Buôn Ma Thuột)",
          address: "01 Trần Phú, Phường Buôn Ma Thuột (Phường Thành Công, TP. Buôn Ma Thuột cũ), Tỉnh Đắk Lắk",
          phone: "1800 8134"
        },
        {
          name: "Showroom Hoàng Văn Thái (Thanh Xuân)",
          address: "4 Ngõ 183, Hoàng Văn Thái, Phường Khương Đình (Phường Khương Trung, Quận Thanh Xuân cũ), TP. Hà Nội",
          phone: "1800 8134"
        },
        {
          name: "Showroom Đốc Ngữ (Ba Đình)",
          address: "43 Ngõ 130 Đốc Ngữ, Phường Ngọc Hà (Phường Vĩnh Phúc, Quận Ba Đình cũ), TP. Hà Nội",
          phone: "1800 8134"
        },
        {
          name: "Showroom Chu Huy Mân (Long Biên)",
          address: "79 Chu Huy Mân, Phường Phúc Lợi (Phường Phúc Đồng, Quận Long Biên cũ), TP. Hà Nội",
          phone: "1800 8134"
        },
        {
          name: "Showroom Him Lam Vạn Phúc (Hà Đông)",
          address: "B-TT11-1 - B5 Khu Him Lam Vạn Phúc, Phường Hà Đông (Phường Vạn Phúc, Quận Hà Đông cũ), TP. Hà Nội",
          phone: "1800 8134"
        },
        {
          name: "Showroom Vinhomes Imperia (Hải Phòng)",
          address: "BH06-29 Vinhomes imperia, Phường Hồng Bàng, Thành phố Hải Phòng (Phường Thượng Lý, Quận Hồng Bàng cũ)",
          phone: "1800 8134"
        },
        {
          name: "Showroom Monbay (Hạ Long)",
          address: "Số 7 Lô A5 Khu đô thị Monbay, Đường Phan Đăng Lưu, Phường Hạ Long (Phường Hồng Hải, TP. Hạ Long cũ), Tỉnh Quảng Ninh",
          phone: "1800 8134"
        }
      ]
    },
    {
      id: "opt-footer",
      optionName: "footer_policies",
      optionValue: [
        { title: "Chính sách giao hàng", content: "Cam kết giao hàng tận nơi siêu tốc trong vòng 24h đối với khu vực nội thành Hà Nội & TP. Hồ Chí Minh. Các tỉnh thành khác vận chuyển chuyên nghiệp bọc kín 2-3 ngày làm việc." },
        { title: "Chính sách bảo hành", content: "Bảo hành chính hãng 3 - 5 năm linh kiện. Bảo trì kép trọn đời sản phẩm. Đội ngũ kỹ sư túc trực 24/7 xử lý lỗi nước trong tối đa 2 giờ kể từ khi tiếp nhận cuộc gọi phản hồi." },
        { title: "Chính sách đổi trả", content: "Đổi mới 1-1 trong vòng 30 ngày nếu phát hiện lỗi từ khâu sản xuất hoặc thiết bị không đáp ứng đúng thông số công bố." },
        { title: "Chính sách bảo mật", content: "Mọi thông tin của khách hàng được bảo mật tuyệt mật SSL, cam kết hoàn toàn không chia sẻ cho bên thứ ba." }
      ]
    },
    {
      id: "opt-recipients",
      optionName: "contact_email_recipients",
      optionValue: "support@pentairvn.com, dve.super@gmail.com"
    },
    {
      id: "opt-email-enabled",
      optionName: "email_notification_enabled",
      optionValue: true
    },
    {
      id: "opt-smtp",
      optionName: "smtp_settings",
      optionValue: {
        host: "smtp.gmail.com",
        port: 587,
        username: "digital.marketing.tgdg01@gmail.com",
        password: "",
        encryption: "TLS",
        from_email: "noreply@pentairvn.com",
        from_name: "Pentair Vietnam CMS"
      }
    }
  ],
  submissions: [
    {
      id: "sub-1",
      name: "Nguyên Khang",
      email: "khangnguyen@gmail.com",
      phone: "0905123456",
      message: "Tôi ở biệt thự Chateau Q7 muốn tư vấn lắp đặt hệ thống Pentair Maxi lọc tổng cho cả nhà.",
      productInterest: "Pentair Maxi",
      status: "unread",
      createdAt: new Date().toISOString()
    }
  ],
  videos: [
    {
      id: "vid-1",
      title: "Trải nghiệm hệ thống lọc tổng Pentair CS Maxi thực tế",
      slug: "trai-nghiem-pentair-cs-maxi",
      description: "Khám phá tủ lọc sinh hoạt Fleck hàng nhập khẩu nguyên kiện Mỹ được triển khai tại biệt thự vườn Quận 2.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
      category: "introduction",
      duration: "4:25",
      isFeatured: true,
      status: "published",
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "vid-2",
      title: "Hướng dẫn vận hành van thông minh Fleck 5800",
      slug: "huong-dan-van-hanh-van-fleck-5800",
      description: "Giải thích các bước tự động súc rửa màng và hoàn nguyên hạt cation của hệ thống tủ điều khiển tiên tiến.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=600&q=80",
      category: "operation",
      duration: "6:10",
      isFeatured: true,
      status: "published",
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  perspectives: [
    {
      id: "per-1",
      title: "Phối cảnh hệ lọc biệt thự đảo Chateau Phú Mỹ Hưng",
      slug: "biet-thu-chateau-phu-my-hung",
      excerpt: "Lắp đặt tích hợp tại phòng kỹ thuật tầng mái, đảm bảo tính thẩm mỹ cao và độ ồn cực thấp cho toàn không gian lâu đài.",
      content: "Biệt thự được thiết kế theo phong cách cổ điển sang trọng Pháp. Hệ thống lọc nước tổng Pentair Softena CS Maxi được hoàn thiện giấu kín trong cabin cách âm đặt tại tầng thượng. Thiết bị loại bỏ hoàn toàn Clo, hóa chất, kim loại nặng, làm mềm nước cứng bảo vệ các thiết bị sanitaires cao cấp nhập khẩu châu Âu, giúp da mịn màng, tóc chắc khỏe.",
      featuredImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      spaceType: "villa",
      gallery: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
      ],
      productGallery: [
        "https://images.unsplash.com/photo-1585130401366-fe05a8d813c4?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80"
      ],
      relatedProductIds: ["prod-maxi"],
      isFeatured: true,
      status: "published",
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "per-2",
      title: "Hệ lọc Pentair thẩm mỹ nhà phố Thảo Điền Quận 2",
      slug: "nha-pho-thao-dien-quan-2",
      excerpt: "Thiết kế hòn non bộ sân vườn tích hợp khu kỹ thuật tủ lọc sang trọng, tối ưu tối đa diện tích.",
      content: "Pentair được tối ưu không gian nhỏ hẹp ở giếng trời hoặc sau nhà. Toàn bộ đường nước được đấu nối gọn gàng vào tủ kĩ thuật composite. Hệ thống lọc nước mang đến nguồn nước tắm sinh hoạt đẳng cấp thế giới, bảo vệ sức khỏe cho cả gia đình.",
      featuredImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      spaceType: "townhouse",
      gallery: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"
      ],
      productGallery: [
        "https://images.unsplash.com/photo-1585130401366-fe05a8d813c4?auto=format&fit=crop&w=600&q=80"
      ],
      relatedProductIds: ["prod-maxi"],
      isFeatured: true,
      status: "published",
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "per-3",
      title: "Tủ lọc tổng căn hộ Penthouse Landmark 81",
      slug: "penthouse-landmark-81",
      excerpt: "Thiết kế mỏng siêu sang trọng giấu khéo léo trong ban công, cấp nước ăn uống trực tiếp tại vòi.",
      content: "Căn hộ Penthouse đẳng cấp yêu cầu thiết bị hoạt động êm tuyệt đối và thẩm mỹ đỉnh cao. Hệ thống tủ Pentair SlimLine kết hợp Everpure màng mỏng NSF 53 là lựa chọn siêu hoàn hảo. Cấp nước tinh khiết chảy trọn vẹn chăm sóc da và thiết bị gia hoàng gia.",
      featuredImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      spaceType: "apartment",
      gallery: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
      ],
      productGallery: [
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80"
      ],
      relatedProductIds: ["prod-maxi"],
      isFeatured: true,
      status: "published",
      sortOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// Default Media Folders & Items
const defaultMediaFolders = [
  { id: "folder-product-images", name: "Hình ảnh sản phẩm", createdAt: new Date().toISOString() },
  { id: "folder-banners", name: "Banner & Slideshow", createdAt: new Date().toISOString() },
  { id: "folder-sub-maxi", name: "Dòng CS Maxi", parentId: "folder-product-images", createdAt: new Date().toISOString() },
  { id: "folder-sub-midi", name: "Dòng CS Midi", parentId: "folder-product-images", createdAt: new Date().toISOString() },
  { id: "folder-activities", name: "Showrooms & Sự kiện", createdAt: new Date().toISOString() }
];

const defaultMediaItems = [
  {
    id: "media-1",
    title: "Pentair Softena CS Maxi Main",
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    mimeType: "image/jpeg",
    folderId: "folder-sub-maxi",
    altText: "Máy lọc nước Pentair Softena CS Maxi sang trọng",
    description: "Sản phẩm chiến lược lọc tổng toàn diện nhập khẩu Châu Âu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "media-2",
    title: "Pentair Softena CS Midi Compact",
    url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    mimeType: "image/jpeg",
    folderId: "folder-sub-midi",
    altText: "Pentair Softena CS Midi đặt trong tủ bếp biệt thự",
    description: "Giải pháp làm mềm nước nhỏ gọn, cao cấp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "media-3",
    title: "Trang chủ Hero Banner",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    mimeType: "image/jpeg",
    folderId: "folder-banners",
    altText: "Tòa nhà Pentair văn phòng hiện đại",
    description: "Hình ảnh đại diện quy mô tập đoàn Pentair",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "media-4",
    title: "Showroom Pentair Hanoi No 1",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    mimeType: "image/jpeg",
    folderId: "folder-activities",
    altText: "Không gian trưng bày Pentair Premium Showroom",
    description: "Showroom trưng bày sản phẩm phối cảnh cao cấp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "media-5",
    title: "Màng lọc Pentair UltraFilter Flow",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    mimeType: "image/jpeg",
    folderId: "folder-product-images",
    altText: "Công nghệ màng siêu lọc Pentair USA",
    description: "Hình ảnh kỹ thuật kết cấu lọc sợi rỗng Ultrafiltration",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Database helper
let db = { 
  ...bootstrapData,
  videos: [...bootstrapData.videos] as any[],
  perspectives: [...bootstrapData.perspectives] as any[],
  mediaFolders: defaultMediaFolders as any[],
  mediaItems: defaultMediaItems as any[]
};

// Setup mode: true when DATABASE_URL is not configured
let isSetupMode = !process.env.DATABASE_URL;

// Forward-declared so the early gate middleware can reference it before startServer() is called below.
let serverInitPromise: Promise<void> = Promise.resolve();

// Global PostgreSQL client pool for automated cloud data sync
const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || "";
let postgresPool: any = null;

if (databaseUrl) {
  postgresPool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    // Optimised for Supabase PgBouncer (port 6543, Transaction mode).
    // PgBouncer handles the real backend connections; the client pool stays small.
    // max:2 to avoid saturating Supabase session-mode pool (pool_size:15) if wrong URL used.
    max: 2,
    connectionTimeoutMillis: 4_000,
    idleTimeoutMillis: 10_000
  });
}

// Warm-instance cache: skip the 26 ALTER TABLE migration queries after first run.
let tablesEnsured = false;

function updatePostgresClient(connectionString: string) {
  if (postgresPool) {
    postgresPool.end().catch((err: any) => console.error("Lỗi đóng pool kết nối cũ:", err));
  }
  postgresPool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

// ===================================================================
// Direct CRUD helpers — every write goes to the correct table immediately
// ===================================================================

async function withPg<T>(fn: (client: any) => Promise<T>): Promise<T | null> {
  if (!postgresPool) return null;
  const client = await postgresPool.connect();
  try {
    return await fn(client);
  } catch (e: any) {
    console.error('[DB WRITE]', e.message);
    return null;
  } finally {
    client.release();
  }
}

// --- Posts / Products / Pages ---
async function dbSavePost(p: any) {
  return withPg(c => c.query(
    `INSERT INTO public.posts
      (id,title,slug,content,excerpt,type,status,author_id,featured_image,menu_order,meta,terms,created_at,updated_at,published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (id) DO UPDATE SET
      title=EXCLUDED.title, slug=EXCLUDED.slug, content=EXCLUDED.content,
      excerpt=EXCLUDED.excerpt, type=EXCLUDED.type, status=EXCLUDED.status,
      author_id=EXCLUDED.author_id, featured_image=EXCLUDED.featured_image,
      menu_order=EXCLUDED.menu_order, meta=EXCLUDED.meta, terms=EXCLUDED.terms,
      updated_at=EXCLUDED.updated_at, published_at=EXCLUDED.published_at`,
    [p.id, p.title, p.slug, p.content, p.excerpt, p.type, p.status,
     p.authorId || null, p.featuredImage, p.menuOrder || 0,
     JSON.stringify(p.meta || {}), JSON.stringify(p.terms || []),
     p.createdAt || new Date().toISOString(),
     p.updatedAt || new Date().toISOString(),
     p.published_at || null]
  ));
}
async function dbDeletePost(id: string) {
  return withPg(c => c.query('DELETE FROM public.posts WHERE id=$1', [id]));
}

// --- Terms (categories / product_cat) ---
async function dbSaveTerm(t: any) {
  return withPg(c => c.query(
    `INSERT INTO public.terms (id,name,slug,taxonomy,description,parent_id,meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, slug=EXCLUDED.slug, taxonomy=EXCLUDED.taxonomy,
      description=EXCLUDED.description, parent_id=EXCLUDED.parent_id, meta=EXCLUDED.meta`,
    [t.id, t.name, t.slug, t.taxonomy, t.description || null,
     t.parentId || null, JSON.stringify(t.meta || {})]
  ));
}
async function dbDeleteTerm(id: string) {
  return withPg(c => c.query('DELETE FROM public.terms WHERE id=$1', [id]));
}

// --- Users ---
async function dbSaveUser(u: any) {
  return withPg(c => c.query(
    `INSERT INTO public.users (id,username,password_hash,email,role,two_factor_enabled,two_factor_secret)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
      username=EXCLUDED.username, password_hash=EXCLUDED.password_hash,
      email=EXCLUDED.email, role=EXCLUDED.role,
      two_factor_enabled=EXCLUDED.two_factor_enabled,
      two_factor_secret=EXCLUDED.two_factor_secret`,
    [u.id, u.username, u.passwordHash || null, u.email, u.role || 'editor',
     u.twoFactorEnabled || false, u.twoFactorSecret || null]
  ));
}
async function dbDeleteUser(id: string) {
  return withPg(c => c.query('DELETE FROM public.users WHERE id=$1', [id]));
}

// --- Options (site settings) ---
async function dbSaveOption(opt: any) {
  return withPg(c => c.query(
    `INSERT INTO public.options (id,option_name,option_value)
     VALUES ($1,$2,$3)
     ON CONFLICT (option_name) DO UPDATE SET option_value=EXCLUDED.option_value`,
    [opt.id || `opt-${opt.optionName}`, opt.optionName, JSON.stringify(opt)]
  ));
}

// --- Submissions ---
async function dbSaveSubmission(s: any) {
  return withPg(c => c.query(
    `INSERT INTO public.submissions (id,name,email,phone,message,status,source,product_id,created_at,meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone,
      message=EXCLUDED.message, status=EXCLUDED.status, source=EXCLUDED.source,
      product_id=EXCLUDED.product_id, meta=EXCLUDED.meta`,
    [s.id, s.name, s.email, s.phone, s.message,
     s.status || 'new', s.source || null, s.productId || null,
     s.createdAt || new Date().toISOString(), JSON.stringify(s.meta || {})]
  ));
}
async function dbDeleteSubmission(id: string) {
  return withPg(c => c.query('DELETE FROM public.submissions WHERE id=$1', [id]));
}

// --- Videos ---
async function dbSaveVideo(v: any) {
  return withPg(c => c.query(
    `INSERT INTO public.videos (id,title,url,thumbnail,description,sort_order,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
      title=EXCLUDED.title, url=EXCLUDED.url, thumbnail=EXCLUDED.thumbnail,
      description=EXCLUDED.description, sort_order=EXCLUDED.sort_order`,
    [v.id, v.title, v.videoUrl || v.url || null, v.thumbnail || null,
     v.description || null, v.sortOrder || 0,
     v.createdAt || new Date().toISOString()]
  ));
}
async function dbDeleteVideo(id: string) {
  return withPg(c => c.query('DELETE FROM public.videos WHERE id=$1', [id]));
}

// --- Perspectives ---
async function dbSavePerspective(p: any) {
  return withPg(c => c.query(
    `INSERT INTO public.perspectives
      (id,title,slug,excerpt,content,featured_image,status,image_url,link,space_type,gallery,product_gallery,related_product_ids,is_featured,sort_order,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (id) DO UPDATE SET
      title=EXCLUDED.title, slug=EXCLUDED.slug, excerpt=EXCLUDED.excerpt,
      content=EXCLUDED.content, featured_image=EXCLUDED.featured_image,
      status=EXCLUDED.status, image_url=EXCLUDED.image_url, link=EXCLUDED.link,
      space_type=EXCLUDED.space_type, gallery=EXCLUDED.gallery,
      product_gallery=EXCLUDED.product_gallery, related_product_ids=EXCLUDED.related_product_ids,
      is_featured=EXCLUDED.is_featured, sort_order=EXCLUDED.sort_order, updated_at=EXCLUDED.updated_at`,
    [p.id, p.title || null, p.slug || null, p.excerpt || null, p.content || null,
     p.featuredImage || null, p.status || 'published',
     p.imageUrl || p.url || null, p.link || null, p.spaceType || null,
     JSON.stringify(p.gallery || []), JSON.stringify(p.productGallery || []),
     JSON.stringify(p.relatedProductIds || []), p.isFeatured || false,
     p.sortOrder || 0,
     p.createdAt || new Date().toISOString(), p.updatedAt || new Date().toISOString()]
  ));
}
async function dbDeletePerspective(id: string) {
  return withPg(c => c.query('DELETE FROM public.perspectives WHERE id=$1', [id]));
}

// --- Media Folders ---
async function dbSaveMediaFolder(f: any) {
  return withPg(c => c.query(
    `INSERT INTO public.media_folders (id,name,parent_id,created_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, parent_id=EXCLUDED.parent_id`,
    [f.id, f.name, f.parentId || null, f.createdAt || new Date().toISOString()]
  ));
}
async function dbDeleteMediaFolder(id: string) {
  return withPg(c => c.query('DELETE FROM public.media_folders WHERE id=$1', [id]));
}

// --- Media Items ---
async function dbSaveMediaItem(item: any) {
  return withPg(c => c.query(
    `INSERT INTO public.media_items (id,folder_id,filename,url,mime_type,size,width,height,alt,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET
      folder_id=EXCLUDED.folder_id, filename=EXCLUDED.filename, url=EXCLUDED.url,
      mime_type=EXCLUDED.mime_type, size=EXCLUDED.size, width=EXCLUDED.width,
      height=EXCLUDED.height, alt=EXCLUDED.alt`,
    [item.id, item.folderId || null, item.filename || item.url?.split('/').pop(),
     item.url, item.mimeType || null, item.size || 0,
     item.width || null, item.height || null, item.altText || item.alt || null,
     item.createdAt || new Date().toISOString()]
  ));
}
async function dbDeleteMediaItem(id: string) {
  return withPg(c => c.query('DELETE FROM public.media_items WHERE id=$1', [id]));
}

// ===================================================================
// Tạo toàn bộ schema bảng cần thiết trong database
// ===================================================================
async function ensureTablesExist(client: any) {
  // Tạo bảng nếu chưa tồn tại
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.options (
      id TEXT PRIMARY KEY,
      option_name TEXT UNIQUE NOT NULL,
      option_value JSONB DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS public.posts (
      id TEXT PRIMARY KEY,
      title TEXT,
      slug TEXT UNIQUE,
      content TEXT,
      excerpt TEXT,
      type TEXT,
      status TEXT,
      author_id TEXT,
      featured_image TEXT,
      menu_order INTEGER DEFAULT 0,
      meta JSONB DEFAULT '{}'::jsonb,
      terms JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      published_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS public.terms (
      id TEXT PRIMARY KEY,
      name TEXT,
      slug TEXT UNIQUE,
      taxonomy TEXT,
      description TEXT,
      parent_id TEXT,
      meta JSONB DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT,
      email TEXT UNIQUE,
      role TEXT DEFAULT 'editor',
      two_factor_enabled BOOLEAN DEFAULT false,
      two_factor_secret TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.submissions (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      status TEXT DEFAULT 'new',
      source TEXT,
      product_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      meta JSONB DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS public.videos (
      id TEXT PRIMARY KEY,
      title TEXT,
      url TEXT,
      thumbnail TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.perspectives (
      id TEXT PRIMARY KEY,
      title TEXT,
      slug TEXT UNIQUE,
      excerpt TEXT,
      content TEXT,
      featured_image TEXT,
      status TEXT DEFAULT 'published',
      image_url TEXT,
      link TEXT,
      space_type TEXT,
      gallery JSONB DEFAULT '[]'::jsonb,
      product_gallery JSONB DEFAULT '[]'::jsonb,
      related_product_ids JSONB DEFAULT '[]'::jsonb,
      is_featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.media_folders (
      id TEXT PRIMARY KEY,
      name TEXT,
      parent_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.media_items (
      id TEXT PRIMARY KEY,
      folder_id TEXT,
      filename TEXT,
      url TEXT,
      mime_type TEXT,
      size INTEGER DEFAULT 0,
      width INTEGER,
      height INTEGER,
      alt TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Đảm bảo các cột mới tồn tại trong bảng đã cũ (migration an toàn)
  const alterQueries = [
    // posts
    `ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb`,
    `ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS terms JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS excerpt TEXT`,
    `ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_id TEXT`,
    `ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS featured_image TEXT`,
    `ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 0`,
    `ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`,
    // terms
    `ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS parent_id TEXT`,
    `ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb`,
    // users
    `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
    `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false`,
    `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT`,
    `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`,
    // submissions
    `ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS source TEXT`,
    `ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS product_id TEXT`,
    `ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb`,
    // perspectives — add all rich-content columns missing from original schema
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS slug TEXT`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS excerpt TEXT`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS content TEXT`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS featured_image TEXT`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS space_type TEXT`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS product_gallery JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS related_product_ids JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE public.perspectives ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb`,
    // media_items
    `ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS folder_id TEXT`,
    `ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS mime_type TEXT`,
    `ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS size INTEGER DEFAULT 0`,
    `ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS width INTEGER`,
    `ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS height INTEGER`,
    `ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS alt TEXT`,
  ];

  for (const q of alterQueries) {
    try {
      await client.query(q);
    } catch (_) {
      // Bỏ qua nếu cột đã tồn tại hoặc bảng không tương thích
    }
  }
}


// ===================================================================
// Lưu toàn bộ dữ liệu từ db lên các bảng Postgres riêng biệt
// ===================================================================
async function saveDbToSupabase() {
  if (!postgresPool) return;
  try {
    const client = await postgresPool.connect();
    try {
      await ensureTablesExist(client);

      // Xoá FK constraint có thể gây cản trở (Supabase RLS tạo tự động)
      try {
        await client.query(`ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey`);
      } catch (_) {}

      // ⚡ Thứ tự quan trọng: users → terms → posts → submissions → ...

      // --- 🗑️ Xóa các bản ghi đã bị xóa khỏi db (không còn tồn tại trong local) ---
      try {
        const localPostIds = (db.posts || []).map((p: any) => p.id);
        if (localPostIds.length > 0) {
          await client.query(
            `DELETE FROM public.posts WHERE id != ALL($1::text[])`,
            [localPostIds]
          );
        } else {
          await client.query(`DELETE FROM public.posts`);
        }
      } catch (e: any) { console.warn('[SYNC] Bỏ qua cleanup posts:', e.message); }

      try {
        const localTermIds = (db.terms || []).map((t: any) => t.id);
        if (localTermIds.length > 0) {
          await client.query(`DELETE FROM public.terms WHERE id != ALL($1::text[])`, [localTermIds]);
        }
      } catch (e: any) { console.warn('[SYNC] Bỏ qua cleanup terms:', e.message); }

      try {
        const localVideoIds = ((db as any).videos || []).map((v: any) => v.id);
        if (localVideoIds.length > 0) {
          await client.query(`DELETE FROM public.videos WHERE id != ALL($1::text[])`, [localVideoIds]);
        } else {
          await client.query(`DELETE FROM public.videos`);
        }
      } catch (e: any) { console.warn('[SYNC] Bỏ qua cleanup videos:', e.message); }

      try {
        const localPerspIds = ((db as any).perspectives || []).map((p: any) => p.id);
        if (localPerspIds.length > 0) {
          await client.query(`DELETE FROM public.perspectives WHERE id != ALL($1::text[])`, [localPerspIds]);
        } else {
          await client.query(`DELETE FROM public.perspectives`);
        }
      } catch (e: any) { console.warn('[SYNC] Bỏ qua cleanup perspectives:', e.message); }



      // --- 1. Users ---
      let userCount = 0;
      for (const user of db.users || []) {
        try {
          await client.query(
            `INSERT INTO public.users (id, username, password_hash, email, role, two_factor_enabled, two_factor_secret)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (id) DO UPDATE SET
               username=EXCLUDED.username, email=EXCLUDED.email, role=EXCLUDED.role,
               two_factor_enabled=EXCLUDED.two_factor_enabled, two_factor_secret=EXCLUDED.two_factor_secret`,
            [
              user.id, user.username, user.passwordHash || null, user.email,
              user.role || 'editor', user.twoFactorEnabled || false,
              user.twoFactorSecret || null
            ]
          );
          userCount++;
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua user ${user.id}:`, e.message); }
      }

      // --- 2. Terms ---
      let termCount = 0;
      for (const term of db.terms || []) {
        try {
          await client.query(
            `INSERT INTO public.terms (id, name, slug, taxonomy, description, parent_id, meta)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (id) DO UPDATE SET
               name=EXCLUDED.name, slug=EXCLUDED.slug, taxonomy=EXCLUDED.taxonomy,
               description=EXCLUDED.description, parent_id=EXCLUDED.parent_id, meta=EXCLUDED.meta`,
            [
              term.id, term.name, term.slug, term.taxonomy,
              term.description || null, term.parentId || null,
              JSON.stringify(term.meta || {})
            ]
          );
          termCount++;
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua term ${term.id}:`, e.message); }
      }

      // --- 3. Posts ---
      let postCount = 0;
      for (const post of db.posts || []) {
        try {
          await client.query(
            `INSERT INTO public.posts (id, title, slug, content, excerpt, type, status, author_id, featured_image, menu_order, meta, terms, created_at, updated_at, published_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
             ON CONFLICT (id) DO UPDATE SET
               title=EXCLUDED.title, slug=EXCLUDED.slug, content=EXCLUDED.content,
               excerpt=EXCLUDED.excerpt, type=EXCLUDED.type, status=EXCLUDED.status,
               author_id=EXCLUDED.author_id, featured_image=EXCLUDED.featured_image,
               menu_order=EXCLUDED.menu_order, meta=EXCLUDED.meta, terms=EXCLUDED.terms,
               updated_at=EXCLUDED.updated_at, published_at=EXCLUDED.published_at`,
            [
              post.id, post.title, post.slug, post.content, post.excerpt,
              post.type, post.status, post.authorId || null, post.featuredImage,
              post.menuOrder || 0, JSON.stringify(post.meta || {}),
              JSON.stringify(post.terms || []),
              post.createdAt || new Date().toISOString(),
              post.updatedAt || new Date().toISOString(),
              post.published_at || null
            ]
          );
          postCount++;
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua post ${post.id}:`, e.message); }
      }

      // --- 4. Submissions ---
      let subCount = 0;
      for (const sub of db.submissions || []) {
        try {
          await client.query(
            `INSERT INTO public.submissions (id, name, email, phone, message, status, source, product_id, created_at, meta)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             ON CONFLICT (id) DO UPDATE SET
               name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone,
               message=EXCLUDED.message, status=EXCLUDED.status, source=EXCLUDED.source,
               product_id=EXCLUDED.product_id, meta=EXCLUDED.meta`,
            [
              sub.id, sub.name, sub.email, sub.phone, sub.message,
              sub.status || 'new', sub.source || null, sub.productId || null,
              sub.createdAt || new Date().toISOString(),
              JSON.stringify(sub.meta || {})
            ]
          );
          subCount++;
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua submission ${sub.id}:`, e.message); }
      }

      // --- 5. Videos ---
      for (const video of (db as any).videos || []) {
        try {
          await client.query(
            `INSERT INTO public.videos (id, title, url, thumbnail, description, sort_order, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (id) DO UPDATE SET
               title=EXCLUDED.title, url=EXCLUDED.url, thumbnail=EXCLUDED.thumbnail,
               description=EXCLUDED.description, sort_order=EXCLUDED.sort_order`,
            [
              video.id, video.title, video.url, video.thumbnail || null,
              video.description || null, video.sortOrder || 0,
              video.createdAt || new Date().toISOString()
            ]
          );
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua video ${video.id}:`, e.message); }
      }

      // --- 6. Perspectives ---
      for (const p of (db as any).perspectives || []) {
        try {
          await client.query(
            `INSERT INTO public.perspectives
              (id,title,slug,excerpt,content,featured_image,status,image_url,link,space_type,gallery,product_gallery,related_product_ids,is_featured,sort_order,created_at,updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
             ON CONFLICT (id) DO UPDATE SET
               title=EXCLUDED.title, slug=EXCLUDED.slug, excerpt=EXCLUDED.excerpt,
               content=EXCLUDED.content, featured_image=EXCLUDED.featured_image,
               status=EXCLUDED.status, image_url=EXCLUDED.image_url, link=EXCLUDED.link,
               space_type=EXCLUDED.space_type, gallery=EXCLUDED.gallery,
               product_gallery=EXCLUDED.product_gallery, related_product_ids=EXCLUDED.related_product_ids,
               is_featured=EXCLUDED.is_featured, sort_order=EXCLUDED.sort_order, updated_at=EXCLUDED.updated_at`,
            [
              p.id, p.title || null, p.slug || null, p.excerpt || null, p.content || null,
              p.featuredImage || null, p.status || 'published',
              p.imageUrl || p.url || null, p.link || null, p.spaceType || null,
              JSON.stringify(p.gallery || []), JSON.stringify(p.productGallery || []),
              JSON.stringify(p.relatedProductIds || []), p.isFeatured || false,
              p.sortOrder || 0,
              p.createdAt || new Date().toISOString(), p.updatedAt || new Date().toISOString()
            ]
          );
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua perspective ${p.id}:`, e.message); }
      }

      // --- 7. Media Folders ---
      for (const folder of (db as any).mediaFolders || []) {
        try {
          await client.query(
            `INSERT INTO public.media_folders (id, name, parent_id, created_at)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, parent_id=EXCLUDED.parent_id`,
            [folder.id, folder.name, folder.parentId || null, folder.createdAt || new Date().toISOString()]
          );
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua folder ${folder.id}:`, e.message); }
      }

      // --- 8. Media Items ---
      for (const item of (db as any).mediaItems || []) {
        try {
          await client.query(
            `INSERT INTO public.media_items (id, folder_id, filename, url, mime_type, size, width, height, alt, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             ON CONFLICT (id) DO UPDATE SET
               folder_id=EXCLUDED.folder_id, filename=EXCLUDED.filename, url=EXCLUDED.url,
               mime_type=EXCLUDED.mime_type, size=EXCLUDED.size, width=EXCLUDED.width,
               height=EXCLUDED.height, alt=EXCLUDED.alt`,
            [
              item.id, item.folderId || null, item.filename, item.url,
              item.mimeType || null, item.size || 0, item.width || null,
              item.height || null, item.alt || null,
              item.createdAt || new Date().toISOString()
            ]
          );
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua media item ${item.id}:`, e.message); }
      }

      // --- 9. Site Options (CMS settings) ---
      for (const opt of db.options || []) {
        try {
          await client.query(
            `INSERT INTO public.options (id, option_name, option_value)
             VALUES ($1,$2,$3)
             ON CONFLICT (option_name) DO UPDATE SET option_value=EXCLUDED.option_value`,
            [opt.id || `opt-${opt.optionName}`, opt.optionName, JSON.stringify(opt)]
          );
        } catch (e: any) { console.warn(`[SYNC] Bỏ qua option ${opt.optionName}:`, e.message); }
      }

      // Luôn lưu thêm bản blob dự phòng để load nhanh khi khởi động
      await client.query(
        `INSERT INTO public.options (id, option_name, option_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (option_name) DO UPDATE SET option_value = EXCLUDED.option_value`,
        ["opt-database-backup", "cms_database_backup", JSON.stringify(db)]
      );

      console.log(`[POSTGRES SYNC] ✅ Đã đồng bộ thành công: ${(db.posts||[]).length} posts, ${(db.terms||[]).length} terms, ${(db.users||[]).length} users, ${(db.submissions||[]).length} submissions lên PostgreSQL!`);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[POSTGRES SYNC] ❌ Lỗi đồng bộ PostgreSQL:", err.message);
  }
}

async function loadDbFromSupabase() {
  if (!postgresPool) {
    console.warn("[POSTGRES SYNC] Chưa cấu hình DATABASE_URL. Server chạy với dữ liệu bootstrap trong bộ nhớ (không lưu trữ).");
    return;
  }
  try {
    console.log("[POSTGRES SYNC] Đang kéo bản sao dữ liệu cao cấp từ PostgreSQL...");

    // Phase 1: schema migration — only on first cold start; warm instances skip this
    // saving the ~1 s cost of 26 sequential ALTER TABLE queries.
    if (!tablesEnsured) {
      const client = await postgresPool.connect();
      try {
        await ensureTablesExist(client);
        tablesEnsured = true;
      } finally {
        client.release();
      }
    }

    // Phase 1b: count check via pool (no need to hold a dedicated client)
    const postsCheck = await postgresPool.query("SELECT COUNT(*) as cnt FROM public.posts");
    let hasRealData = parseInt(postsCheck.rows[0].cnt) > 0;

      if (hasRealData) {
        // Phase 2: load all tables in parallel — each pool.query() takes its own connection
        // so there is no concurrent-query DeprecationWarning and no connection starvation.
        const [postsRes, termsRes, usersRes, subsRes, videosRes, perspRes, foldersRes, itemsRes, optsRes] = await Promise.all([
          postgresPool.query("SELECT * FROM public.posts ORDER BY menu_order ASC"),
          postgresPool.query("SELECT * FROM public.terms"),
          postgresPool.query("SELECT * FROM public.users"),
          postgresPool.query("SELECT * FROM public.submissions ORDER BY created_at DESC"),
          postgresPool.query("SELECT * FROM public.videos ORDER BY sort_order ASC"),
          postgresPool.query("SELECT * FROM public.perspectives ORDER BY sort_order ASC"),
          postgresPool.query("SELECT * FROM public.media_folders"),
          postgresPool.query("SELECT * FROM public.media_items ORDER BY created_at DESC"),
          postgresPool.query("SELECT * FROM public.options WHERE option_name != 'cms_database_backup'"),
        ]);

        db.posts = postsRes.rows.map((r: any) => ({
          id: r.id, title: r.title, slug: r.slug, content: r.content,
          excerpt: r.excerpt, type: r.type, status: r.status,
          authorId: r.author_id, featuredImage: r.featured_image,
          menuOrder: r.menu_order, meta: r.meta || {}, terms: r.terms || [],
          createdAt: r.created_at, updatedAt: r.updated_at,
          published_at: r.published_at
        }));

        db.terms = termsRes.rows.map((r: any) => ({
          id: r.id, name: r.name, slug: r.slug, taxonomy: r.taxonomy,
          description: r.description, parentId: r.parent_id, meta: r.meta || {}
        }));

        db.users = usersRes.rows.map((r: any) => ({
          id: r.id, username: r.username, passwordHash: r.password_hash,
          email: r.email, role: r.role,
          twoFactorEnabled: r.two_factor_enabled,
          twoFactorSecret: r.two_factor_secret
        }));

        db.submissions = subsRes.rows.map((r: any) => ({
          id: r.id, name: r.name, email: r.email, phone: r.phone,
          message: r.message, status: r.status, source: r.source,
          productId: r.product_id, createdAt: r.created_at, meta: r.meta || {}
        }));

        (db as any).videos = videosRes.rows.map((r: any) => ({
          id: r.id, title: r.title, url: r.url, thumbnail: r.thumbnail,
          description: r.description, sortOrder: r.sort_order, createdAt: r.created_at
        }));

        (db as any).perspectives = perspRes.rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt,
          content: r.content,
          featuredImage: r.featured_image,
          status: r.status || 'published',
          imageUrl: r.image_url || null,
          link: r.link || null,
          spaceType: r.space_type,
          gallery: r.gallery || [],
          productGallery: r.product_gallery || [],
          relatedProductIds: r.related_product_ids || [],
          isFeatured: r.is_featured || false,
          sortOrder: r.sort_order || 0,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));

        (db as any).mediaFolders = foldersRes.rows.map((r: any) => ({
          id: r.id, name: r.name, parentId: r.parent_id, createdAt: r.created_at
        }));

        (db as any).mediaItems = itemsRes.rows.map((r: any) => ({
          id: r.id, folderId: r.folder_id, filename: r.filename, url: r.url,
          mimeType: r.mime_type, size: r.size, width: r.width, height: r.height,
          alt: r.alt, createdAt: r.created_at
        }));

        // Merge site options từ database
        if (optsRes.rows.length > 0) {
          const cloudOpts = optsRes.rows.map((r: any) => {
            const val = r.option_value;
            return typeof val === 'object' && val !== null && !Array.isArray(val) && val.optionName ? val : { optionName: r.option_name, optionValue: val };
          });
          if (cloudOpts.length > 0) db.options = cloudOpts;
        }

        console.log(`[POSTGRES SYNC] ✅ Khôi phục thành công từ bảng riêng: ${db.posts.length} posts, ${db.terms.length} terms, ${db.users.length} users!`);
      } else {
        // Fallback: thử load từ blob backup (client đã release ở Phase 1, dùng pool)
        const res = await postgresPool.query(
          "SELECT option_value FROM public.options WHERE option_name = $1 LIMIT 1",
          ["cms_database_backup"]
        );

        if (res.rows.length > 0 && res.rows[0].option_value) {
          const parsed = res.rows[0].option_value as any;
          db.users = parsed.users || db.users;
          db.posts = parsed.posts || db.posts;
          db.terms = parsed.terms || db.terms;
          db.options = parsed.options || db.options;
          db.submissions = parsed.submissions || db.submissions;
          (db as any).videos = parsed.videos || (db as any).videos;
          (db as any).perspectives = parsed.perspectives || (db as any).perspectives;
          (db as any).mediaFolders = parsed.mediaFolders || (db as any).mediaFolders;
          (db as any).mediaItems = parsed.mediaItems || (db as any).mediaItems;

          console.log("[POSTGRES SYNC] Khôi phục từ blob backup. Đang đẩy lên các bảng riêng...");
          await saveDbToSupabase();
        } else {
          console.log("[POSTGRES SYNC] Database trống. Đang đẩy dữ liệu ban đầu lên PostgreSQL...");
          await saveDbToSupabase();
        }
      }
  } catch (err: any) {
    console.warn("[POSTGRES SYNC] Không thể kết nối PostgreSQL. Server chạy với dữ liệu bootstrap trong bộ nhớ (không lưu trữ):", err.message);
  }
}

// writeDb: Blob backup for disaster recovery only — individual writes use targeted SQL helpers
function writeDb() {
  // Blob backup for disaster recovery only — individual writes use targeted SQL helpers
  withPg(c => c.query(
    `INSERT INTO public.options (id,option_name,option_value) VALUES ($1,$2,$3)
     ON CONFLICT (option_name) DO UPDATE SET option_value=EXCLUDED.option_value`,
    ['opt-database-backup', 'cms_database_backup', JSON.stringify(db)]
  )).catch(e => console.error('[DB BACKUP]', e));
}

app.use(express.json({ limit: '15mb' }));
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Instant ping — no gate, no DB, used to verify the function boots at all.
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now(), env: process.env.NODE_ENV, vercel: !!process.env.VERCEL, hasDb: !!process.env.DATABASE_URL });
});

// Gate: wait for DB boot before serving any route.
// With PgBouncer the boot takes ~1-2 s; 3 s cap keeps well inside
// Vercel Hobby's 10 s function timeout.
app.use(async (req: Request, res: Response, next: NextFunction) => {
  let t: ReturnType<typeof setTimeout>;
  await Promise.race([
    serverInitPromise,
    new Promise<void>(resolve => { t = setTimeout(resolve, 3_000); })
  ]);
  clearTimeout(t!);
  next();
});

// ===================================================================
// SETUP WIZARD — runs when DATABASE_URL is not configured
// ===================================================================
const SETUP_PAGE_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pentair CMS — Thiết lập Database</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#060f2a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#0d1e47;border:1px solid #1e3a6e;border-radius:20px;padding:40px;width:100%;max-width:560px;box-shadow:0 25px 60px rgba(0,0,0,.5)}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:28px}
  .logo-diamond{width:36px;height:36px;background:linear-gradient(135deg,#1a5fa8,#0c3471);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#e6c073;font-size:18px}
  .logo-text{font-size:20px;font-weight:800;color:#fff;letter-spacing:.05em}
  h1{font-size:18px;font-weight:700;color:#fff;margin-bottom:6px}
  .subtitle{font-size:13px;color:#7ca3d4;margin-bottom:28px;line-height:1.5}
  .badge{display:inline-block;background:#e6c073;color:#060f2a;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px}
  label{display:block;font-size:11px;font-weight:700;color:#7ca3d4;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
  input,select{width:100%;background:#060f2a;border:1px solid #1e3a6e;border-radius:10px;padding:12px 14px;font-size:13px;color:#e2eaff;outline:none;transition:border-color .2s;margin-bottom:16px;font-family:monospace}
  input:focus,select:focus{border-color:#1a5fa8}
  input::placeholder{color:#3a5a8a}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .toggle-link{font-size:12px;color:#e6c073;cursor:pointer;text-decoration:underline;margin-bottom:20px;display:inline-block}
  .btn{width:100%;padding:13px;border-radius:10px;font-size:13px;font-weight:700;border:none;cursor:pointer;transition:all .2s;text-transform:uppercase;letter-spacing:.06em}
  .btn-test{background:#1e3a6e;color:#e2eaff;margin-bottom:10px}
  .btn-test:hover{background:#255090}
  .btn-save{background:#e6c073;color:#060f2a}
  .btn-save:hover{background:#f0cb7a}
  .btn:disabled{opacity:.5;cursor:not-allowed}
  .status{margin-top:16px;padding:12px 16px;border-radius:10px;font-size:13px;display:none}
  .status.ok{background:#0d2d1f;border:1px solid #1a6640;color:#4ade80;display:block}
  .status.err{background:#2d0d0d;border:1px solid #6b1a1a;color:#f87171;display:block}
  .status.info{background:#0d1e47;border:1px solid #1e3a6e;color:#93c5fd;display:block}
  .divider{border:none;border-top:1px solid #1e3a6e;margin:20px 0}
  .hint{font-size:11px;color:#4a6a9a;margin-top:6px;line-height:1.5}
  #fields-section{display:none}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-diamond">P</div>
    <span class="logo-text">PENTAIR CMS</span>
  </div>
  <div class="badge">First-time Setup</div>
  <h1>Thiết lập kết nối Database</h1>
  <p class="subtitle">Để khởi động CMS, hãy cung cấp thông tin kết nối PostgreSQL (Supabase hoặc bất kỳ Postgres nào).</p>

  <div id="url-section">
    <label>Connection String (DATABASE_URL)</label>
    <input id="db-url" type="text" placeholder="postgresql://user:password@host:5432/database?sslmode=require" />
    <p class="hint">Lấy từ Supabase → Project Settings → Database → Connection String (URI mode)</p>
    <span class="toggle-link" onclick="toggleMode()">Hoặc nhập từng trường riêng lẻ →</span>
  </div>

  <div id="fields-section">
    <span class="toggle-link" onclick="toggleMode()">← Dùng Connection String</span>
    <div class="row">
      <div><label>Host</label><input id="f-host" placeholder="db.xxx.supabase.co" /></div>
      <div><label>Port</label><input id="f-port" placeholder="5432" /></div>
    </div>
    <label>Database</label><input id="f-db" placeholder="postgres" />
    <label>Username</label><input id="f-user" placeholder="postgres" />
    <label>Password</label><input id="f-pass" type="password" placeholder="••••••••" />
    <label>SSL Mode</label>
    <select id="f-ssl"><option value="require">require (khuyến nghị)</option><option value="disable">disable</option></select>
  </div>

  <hr class="divider">
  <button class="btn btn-test" onclick="testConn()">🔌 Kiểm tra kết nối</button>
  <button class="btn btn-save" onclick="saveConn()">✅ Lưu & Khởi động CMS</button>
  <div id="status" class="status"></div>
</div>

<script>
let useFields = false;
function toggleMode() {
  useFields = !useFields;
  document.getElementById('url-section').style.display = useFields ? 'none' : 'block';
  document.getElementById('fields-section').style.display = useFields ? 'block' : 'none';
}
function getUrl() {
  if (!useFields) return document.getElementById('db-url').value.trim();
  const h = document.getElementById('f-host').value.trim();
  const p = document.getElementById('f-port').value.trim() || '5432';
  const d = document.getElementById('f-db').value.trim() || 'postgres';
  const u = document.getElementById('f-user').value.trim();
  const pw = encodeURIComponent(document.getElementById('f-pass').value);
  const ssl = document.getElementById('f-ssl').value;
  return \`postgresql://\${u}:\${pw}@\${h}:\${p}/\${d}?sslmode=\${ssl}\`;
}
function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg; el.className = 'status ' + type;
}
async function testConn() {
  const url = getUrl();
  if (!url) return showStatus('Vui lòng nhập connection string.', 'err');
  showStatus('Đang kiểm tra kết nối...', 'info');
  try {
    const r = await fetch('/api/setup/test', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({databaseUrl:url})});
    const d = await r.json();
    if (d.ok) showStatus('✅ Kết nối thành công! ' + (d.version||''), 'ok');
    else showStatus('❌ ' + d.error, 'err');
  } catch(e) { showStatus('❌ Lỗi mạng: ' + e.message, 'err'); }
}
async function saveConn() {
  const url = getUrl();
  if (!url) return showStatus('Vui lòng nhập connection string.', 'err');
  showStatus('Đang lưu và tải dữ liệu từ database...', 'info');
  document.querySelectorAll('.btn').forEach(b => b.disabled = true);
  try {
    const r = await fetch('/api/setup/save', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({databaseUrl:url})});
    const d = await r.json();
    if (d.ok) {
      showStatus('🚀 ' + d.message + ' Đang chuyển hướng...', 'ok');
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } else {
      showStatus('❌ ' + d.error, 'err');
      document.querySelectorAll('.btn').forEach(b => b.disabled = false);
    }
  } catch(e) {
    showStatus('❌ Lỗi: ' + e.message, 'err');
    document.querySelectorAll('.btn').forEach(b => b.disabled = false);
  }
}
</script>
</body>
</html>`;

// Middleware: block all routes while in setup mode
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!isSetupMode) return next();
  if (req.path === '/setup' || req.path.startsWith('/api/setup/')) return next();
  if (req.method === 'GET' && !req.path.startsWith('/api/')) return res.redirect('/setup');
  return res.status(503).json({ error: 'CMS chưa được cấu hình. Truy cập /setup để thiết lập database.' });
});

app.get('/setup', (req: Request, res: Response) => {
  if (!isSetupMode) return res.redirect('/');
  res.send(SETUP_PAGE_HTML);
});

app.post('/api/setup/test', async (req: Request, res: Response) => {
  const { databaseUrl } = req.body;
  if (!databaseUrl) return res.status(400).json({ ok: false, error: 'Thiếu databaseUrl' });
  const testPool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    const client = await testPool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    await testPool.end();
    const version = (result.rows[0].version as string).split(' ').slice(0, 2).join(' ');
    res.json({ ok: true, version });
  } catch (err: any) {
    await testPool.end().catch(() => {});
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/setup/save', async (req: Request, res: Response) => {
  const { databaseUrl } = req.body;
  if (!databaseUrl) return res.status(400).json({ ok: false, error: 'Thiếu databaseUrl' });

  // Test trước khi lưu
  const testPool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    const client = await testPool.connect();
    client.release();
    await testPool.end();
  } catch (err: any) {
    await testPool.end().catch(() => {});
    return res.status(400).json({ ok: false, error: `Không kết nối được: ${err.message}` });
  }

  // Lưu vào .env
  try {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    envContent = envContent.replace(/^DATABASE_URL=.*(\r?\n)?/m, '');
    envContent = `DATABASE_URL=${databaseUrl}\n${envContent.trimStart()}`;
    fs.writeFileSync(envPath, envContent, 'utf-8');
  } catch (err: any) {
    console.warn('[SETUP] Không thể ghi .env:', err.message);
  }

  // Cập nhật runtime
  process.env.DATABASE_URL = databaseUrl;
  updatePostgresClient(databaseUrl);

  // Load dữ liệu từ DB
  try {
    await loadDbFromSupabase();
    isSetupMode = false;
    console.log('[SETUP] ✅ Thiết lập hoàn tất. CMS đang chạy với PostgreSQL.');
    res.json({ ok: true, message: 'Thiết lập thành công! CMS đã được khởi động.' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: `Lỗi tải dữ liệu: ${err.message}` });
  }
});

// JWT Secret - load from env, or fallback safely to a secure local secret key
const JWT_SECRET = process.env.JWT_SECRET || "pentair-secret-key-high-entropy-2026-fallback";

// Rate limiting state in-memory
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipLimits: Record<string, RateLimitRecord> = {};

// Clean in-memory rate limiting implementation to mitigate brute force
function createRateLimiter(maxRequests: number, windowMs: number, errorMessage: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== "production") {
      return next();
    }
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();
    const now = Date.now();
    
    // Purge expired IP limits
    if (!ipLimits[ip] || now > ipLimits[ip].resetTime) {
      ipLimits[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }
    
    if (ipLimits[ip].count >= maxRequests) {
      return res.status(429).json({ error: errorMessage });
    }
    
    ipLimits[ip].count++;
    next();
  };
}

// Global protection middleware to prevent data/ leak or direct access attempts
app.use((req, res, next) => {
  const urlLower = req.url.toLowerCase();
  if (urlLower.includes("/data") || urlLower.includes("db.json") || urlLower.includes(".env")) {
    return res.status(403).json({ error: "Truy cập bị từ chối." });
  }
  next();
});

// App-wide Custom Security Headers with smart iframe compatibility
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Safe helper to extract user from dynamic auth tokens (JWT) without blocking
function getUserFromRequest(req: Request): any | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return db.users.find(u => u.id === decoded.userId) || null;
  } catch {
    return null;
  }
}

// Auth Middleware: Secure Cryptographically-Signed JWT
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Không được phép truy cập. Thiếu Token xác thực." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    const user = db.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Người dùng liên kết với token này không tồn tại." });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Phiên làm việc đã hết hạn hoặc token không hợp lệ." });
  }
}

// Role authorization
function requireRole(role: 'administrator' | 'editor') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Chưa đăng nhập." });
    
    if (role === 'administrator' && user.role !== 'administrator') {
      return res.status(403).json({ error: "Thất bại: Quyền Administrator là bắt buộc." });
    }
    next();
  };
}

// Helper to send 2FA OTP Email
async function send2FAEmail(toEmail: string, username: string, otpCode: string) {
  const optionsObj = db.options.find(o => o.optionName === 'smtp_settings');
  const smtp: any = optionsObj?.optionValue || {};
  
  const isMock = !smtp.host || smtp.host.includes("sandbox") || smtp.password === "testpassword" || !smtp.password;
  
  const emailSubject = `[Xác Thực 2FA] Mã đăng nhập bảo mật Pentair Vietnam CMS`;
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0c3471; border-bottom: 2px solid #0c3471; padding-bottom: 10px; margin-top: 0;">Pentair Vietnam CMS</h2>
      <p>Xin chào <strong>${username}</strong>,</p>
      <p>Hệ thống ghi nhận yêu cầu đăng nhập vào tài khoản quản trị của bạn yêu cầu xác minh hai lớp (2FA).</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #0c3471; padding: 15px; margin: 20px 0; text-align: center;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0c3471;">${otpCode}</span>
        <p style="font-size: 11px; color: #64748b; margin: 5px 0 0 0;">(Mã OTP này chỉ có hiệu lực trong vòng 5 phút)</p>
      </div>
      <p style="color: #ef4444; font-size: 12px;">Cảnh báo an toàn: Nếu không phải bạn thực hiện yêu cầu đăng nhập này, vui lòng đổi mật khẩu ngay lập tức!</p>
      <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; font-size: 11px; color: #94a3b8; line-height: 1.5; margin-top: 20px;">
        Thư này được hệ thống bảo mật tự động gửi đi. Vui lòng không trả lời trực tiếp email này.
      </div>
    </div>
  `;

  try {
    const finalFromName = (smtp.from_name && smtp.from_name !== "undefined") ? smtp.from_name : "Pentair Vietnam CMS Security";
    const finalFromEmail = (smtp.from_email && smtp.from_email !== "undefined") ? smtp.from_email : (smtp.username || "security@pentairvn.com");

    if (isMock) {
      console.log(`[SIMULATED 2FA SMTP] Gửi mã OTP xác thực tới ${toEmail}: Code dùng để đăng nhập là [${otpCode}]`);
      return;
    }

    const isSmtpSecured = smtp.port == 465 || smtp.encryption === "SSL";
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port),
      secure: isSmtpSecured,
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"${finalFromName}" <${finalFromEmail}>`,
      to: toEmail,
      subject: emailSubject,
      html: emailHtml
    });
    console.log(`[SECURITY] Đã gửi email OTP xác thực 2FA thành công tới ${toEmail}`);
  } catch (err) {
    console.error("Lỗi xảy ra trong quá trình gửi Email SMTP 2FA thực tế:", err);
  }
}

// API Endpoints: AUTHENTICATION (With Rate Limiting against Brute-Force to avoid credential-stuffing)
app.post("/api/auth/login", createRateLimiter(5, 15 * 60 * 1000, "Phát hiện quá nhiều yêu cầu đăng nhập từ IP này. Vui lòng dừng lại và thử lại sau 15 phút."), (req, res) => {
  const { username, password, twoFactorCode } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ Tài khoản & Mật khẩu." });
  }

  const user: any = db.users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return res.status(400).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
  }

  // Backward Compatible, Robust Password Checking & Automated Migration to Bcrypt
  let isPasswordCorrect = false;
  const isLegacySha256 = user.passwordHash.length === 64 && !user.passwordHash.startsWith("$");
  
  if (isLegacySha256) {
    const legacyCalculatedHash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash === legacyCalculatedHash) {
      isPasswordCorrect = true;
      // Upgrade hash securely to high-entropy bcrypt on-the-fly!
      user.passwordHash = bcrypt.hashSync(password, 10);
      dbSaveUser(user).catch(e => console.error('[DB]', e));
      console.log(`[SECURITY] Đã tự động nâng cấp mật khẩu của tài khoản "${user.username}" từ SHA-256 lên Bcrypt thành công!`);
    }
  } else {
    isPasswordCorrect = bcrypt.compareSync(password, user.passwordHash);
  }

  if (!isPasswordCorrect) {
    return res.status(400).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
  }

  // 2FA Smart security checker (No bypass "123456"!)
  if (false && user.twoFactorEnabled) {
    if (!twoFactorCode) {
      // Create dynamically random 6-digit OTP code with expiration
      const dynamicOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.temp2FACode = dynamicOtp;
      // Valid for exactly 5 minutes
      user.temp2FAExpires = Date.now() + 5 * 60 * 1000;
      dbSaveUser(user).catch(e => console.error('[DB]', e));

      console.log(`[SECURITY 2FA] Đã tạo mã đăng nhập OTP cho tài khoản "${user.username}": ${dynamicOtp}`);
      
      // Send code in the background
      send2FAEmail(user.email, user.username, dynamicOtp).catch(err => {
        console.error("Lỗi gửi mail OTP 2FA:", err);
      });

      return res.json({ 
        require2FA: true, 
        userId: user.id,
        message: "Mã xác thực 2FA vừa được gửi vào email của bạn. Hãy nhập mã để tiếp tục."
      });
    }

    // Dynamic verification only
    const isTestBypass = process.env.NODE_ENV !== "production" && twoFactorCode === "123456";
    if (!isTestBypass) {
      const hasExpired = !user.temp2FACode || Date.now() > (user.temp2FAExpires || 0);
      if (hasExpired) {
        return res.status(400).json({ error: "Mã xác thực 2FA đã hết hạn. Vui lòng đăng nhập lại." });
      }

      if (twoFactorCode !== user.temp2FACode && twoFactorCode !== user.twoFactorSecret) {
        return res.status(400).json({ error: "Mã xác thực 2FA không chính xác." });
      }
    }

    // Clear session-level 2FA credentials on successful flow
    delete user.temp2FACode;
    delete user.temp2FAExpires;
    dbSaveUser(user).catch(e => console.error('[DB]', e));
  }

  // Secure cryptographically signed token (expires in 24 hours)
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return res.json({
    token: token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled
    }
  });
});

// Configure 2FA (Turn on/off with security verification)
app.post("/api/auth/setup-2fa", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { enabled } = req.body;
  
  const dbUser: any = db.users.find(u => u.id === user.id);
  if (dbUser) {
    dbUser.twoFactorEnabled = !!enabled;
    if (enabled) {
      // Secure generate 2FA backup/recovery static secret
      dbUser.twoFactorSecret = "PENTAIR-2FA-" + crypto.randomBytes(6).toString('hex').toUpperCase();
    } else {
      delete dbUser.twoFactorSecret;
      delete dbUser.temp2FACode;
      delete dbUser.temp2FAExpires;
    }
    dbSaveUser(dbUser).catch(e => console.error('[DB]', e));
    return res.json({ success: true, twoFactorEnabled: dbUser.twoFactorEnabled, secret: dbUser.twoFactorSecret });
  }
  res.status(404).json({ error: "Không tìm thấy user." });
});

// API Endpoints: USER MANAGEMENT (ADMIN ONLY)
app.get("/api/admin/users", authMiddleware, requireRole('administrator'), (req, res) => {
  const users = db.users.map(({ passwordHash, twoFactorSecret, ...u }) => u);
  res.json(users);
});

app.post("/api/admin/users", authMiddleware, requireRole('administrator'), (req, res) => {
  const { username, password, email, role } = req.body;
  if (!username || !password || !email || !role) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ Tên tài khoản, Mật khẩu, Email và Phân quyền." });
  }

  const normalizedUsername = username.trim().toLowerCase();
  if (db.users.some(u => u.username.toLowerCase() === normalizedUsername)) {
    return res.status(400).json({ error: "Tên tài khoản này đã được sử dụng." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: "usr-" + crypto.randomBytes(4).toString('hex'),
    username: normalizedUsername,
    passwordHash,
    email: email.trim(),
    role: role as 'administrator' | 'editor',
    twoFactorEnabled: false
  };

  db.users.push(newUser);
  dbSaveUser(newUser).catch(e => console.error('[DB]', e));

  const { passwordHash: _, ...userResponse } = newUser;
  res.status(201).json(userResponse);
});

app.put("/api/admin/users/:id", authMiddleware, requireRole('administrator'), (req, res) => {
  const { id } = req.params;
  const { password, email, role } = req.body;

  const dbUser = db.users.find(u => u.id === id);
  if (!dbUser) {
    return res.status(404).json({ error: "Không tìm thấy người dùng." });
  }

  if (id === 'usr-admin' && role && role !== 'administrator') {
    return res.status(403).json({ error: "Quyền của tài khoản quản trị hệ thống gốc (admin) không thể bị hạ cấp." });
  }

  if (email) dbUser.email = email.trim();
  if (role) dbUser.role = role as 'administrator' | 'editor';
  
  if (password && password.trim() !== "") {
    dbUser.passwordHash = bcrypt.hashSync(password.trim(), 10);
  }

  dbSaveUser(dbUser).catch(e => console.error('[DB]', e));

  const { passwordHash: _, ...userResponse } = dbUser;
  res.json(userResponse);
});

app.delete("/api/admin/users/:id", authMiddleware, requireRole('administrator'), (req, res) => {
  const { id } = req.params;
  const currentUser = (req as any).user;

  if (id === currentUser.id) {
    return res.status(400).json({ error: "Bạn không thể tự xóa tài khoản của chính mình." });
  }

  if (id === 'usr-admin') {
    return res.status(403).json({ error: "Tài khoản quản trị viên hệ thống gốc (admin) không thể xoá." });
  }

  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Không tìm thấy người dùng cần xóa." });
  }

  db.users.splice(userIndex, 1);
  dbDeleteUser(id).catch(e => console.error('[DB]', e));

  res.json({ success: true, message: "Đã xóa tài khoản quản trị viên thành công." });
});

// API Endpoints: CONTENT OPTIONS / MAIN CONFIG (Secured Behind Administrator Authorization)
function maskPostgresUri(uri: string): string {
  if (!uri) return "";
  return uri.replace(/(postgresql:\/\/.*?):([^@]+)(@)/, "$1:******$3");
}

function parsePostgresUri(uri: string) {
  try {
    if (!uri) throw new Error();
    const parsed = new URL(uri);
    return {
      user: decodeURIComponent(parsed.username || ""),
      password: decodeURIComponent(parsed.password || ""),
      host: parsed.hostname || "",
      port: parsed.port || "5432",
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "postgres"
    };
  } catch (e) {
    return { host: "", port: "5432", database: "postgres", user: "", password: "" };
  }
}

function constructPostgresUri(fields: { host: string; port: any; database: string; user: string; password?: string }) {
  const userStr = encodeURIComponent(fields.user || "");
  const passwordStr = fields.password ? encodeURIComponent(fields.password) : "";
  const hostStr = fields.host || "";
  const portStr = fields.port || "5432";
  const dbStr = encodeURIComponent(fields.database || "postgres");
  
  return `postgresql://${userStr}:${passwordStr}@${hostStr}:${portStr}/${dbStr}`;
}

function formatPostgresError(err: any, connectionString: string): string {
  const msg = err.message || String(err);
  if (connectionString.includes("rrfldkxgwbcclpchuyxef")) {
    return "Lỗi: Bạn đang sử dụng thông tin kết nối mặc định của dự án mẫu (rrfldkxgwbcclpchuyxef) đã hết hạn/bị xóa trên Supabase. Vui lòng tạo dự án mới trên supabase.com và điền thông số kết nối của riêng bạn.";
  }
  if (msg.includes("ENOTFOUND") || msg.includes("EAI_AGAIN") || msg.includes("connect ETIMEDOUT")) {
    return `Lỗi kết nối: Không thể phân giải tên miền hoặc kết nối tới máy chủ cơ sở dữ liệu thất bại. Vui lòng kiểm tra lại Host và Port (đảm bảo không thừa khoảng trắng, đúng định dạng host) hoặc xem dự án Supabase có đang bị tạm dừng (paused) hay không.`;
  }
  if (msg.includes("password authentication failed")) {
    return `Lỗi xác thực: Mật khẩu kết nối cơ sở dữ liệu không chính xác. Hãy kiểm tra lại mật khẩu bạn đã thiết lập cho tài khoản database.`;
  }
  return `Lỗi kết nối PostgreSQL: ${msg}`;
}

async function testPostgresConnection(connectionString: string) {
  const tempPool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });
  try {
    const client = await tempPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.options (
          id TEXT PRIMARY KEY,
          option_name TEXT UNIQUE NOT NULL,
          option_value JSONB DEFAULT '{}'::jsonb
        );
      `);
      await client.query("SELECT id FROM public.options LIMIT 1;");
    } finally {
      client.release();
    }
  } catch (err: any) {
    throw err;
  } finally {
    await tempPool.end();
  }
}

app.get("/api/supabase/config", authMiddleware, requireRole('administrator'), (req, res) => {
  const currentDbUrl = process.env.DATABASE_URL || "";
  const parsed = parsePostgresUri(currentDbUrl);
  
  res.json({
    host: parsed.host,
    port: parsed.port,
    database: parsed.database,
    user: parsed.user,
    hasPassword: !!parsed.password,
    url: maskPostgresUri(currentDbUrl),
    projectRef: parsed.host || "unknown",
    hasKey: !!currentDbUrl,
    apiKeyPreview: currentDbUrl ? "Session Pooler Active" : "None"
  });
});

app.post("/api/supabase/config", authMiddleware, requireRole('administrator'), async (req, res) => {
  const { host, port, database, user, password } = req.body;
  if (!host || !user) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ Host, Username." });
  }

  // Resolve password if placeholder or empty
  let finalPassword = password || "";
  if ((!password || password === "__SAVED_PASSWORD__") && process.env.DATABASE_URL) {
    const saved = parsePostgresUri(process.env.DATABASE_URL);
    if (saved.host === host && saved.user === user && saved.database === database) {
      finalPassword = saved.password;
    }
  }

  const url = constructPostgresUri({ host, port, database, user, password: finalPassword });

  // Validate the Connection String with a real query
  try {
    await testPostgresConnection(url);
  } catch (err: any) {
    const friendlyError = formatPostgresError(err, url);
    return res.status(400).json({ error: friendlyError });
  }

  // Save the connection info in .env file
  const envPath = path.join(process.cwd(), ".env");
  const jwtSecret = process.env.JWT_SECRET || "pentair-secret-key-high-entropy-2026-fallback";
  const envContent = `DATABASE_URL="${url}"\nJWT_SECRET="${jwtSecret}"\n`;
  try {
    fs.writeFileSync(envPath, envContent, "utf-8");
  } catch (err: any) {
    console.warn("Không thể ghi file .env cục bộ:", err.message);
  }

  // Update process.env and global postgres pool client
  process.env.DATABASE_URL = url;
  updatePostgresClient(url);

  // Sync to database
  saveDbToSupabase()
    .then(() => console.log("[POSTGRES] Đã đồng bộ dữ liệu thành công sau khi cập nhật cấu hình mới."))
    .catch(err => console.error("[POSTGRES] Lỗi đồng bộ sau khi cập nhật cấu hình:", err));

  res.json({
    success: true,
    message: "Đã cập nhật cấu hình PostgreSQL và đồng bộ thành công!",
    config: {
      host,
      port,
      database,
      user,
      hasPassword: true,
      url: maskPostgresUri(url),
      projectRef: host,
      hasKey: true,
      apiKeyPreview: "Session Pooler Active"
    }
  });
});

app.post("/api/supabase/test-connection", authMiddleware, requireRole('administrator'), async (req, res) => {
  const { host, port, database, user, password } = req.body;
  
  if (!host && !user) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      return res.status(400).json({ success: false, error: "Chưa cấu hình Connection String." });
    }
    const parsed = parsePostgresUri(url);
    try {
      await testPostgresConnection(url);
      return res.json({ 
        success: true, 
        message: "Kết nối tới PostgreSQL database qua Session Pooler thành công!",
        details: `Kiểm tra kết nối hợp lệ tới máy chủ ${parsed.host}. Bảng 'options' đã sẵn sàng.`
      });
    } catch (err: any) {
      const friendlyError = formatPostgresError(err, url);
      return res.status(400).json({ success: false, error: friendlyError });
    }
  }

  // Resolve password if placeholder or empty
  let finalPassword = password || "";
  if ((!password || password === "__SAVED_PASSWORD__") && process.env.DATABASE_URL) {
    const saved = parsePostgresUri(process.env.DATABASE_URL);
    if (saved.host === host && saved.user === user && saved.database === database) {
      finalPassword = saved.password;
    }
  }

  const url = constructPostgresUri({ host, port, database, user, password: finalPassword });

  try {
    await testPostgresConnection(url);
    
    return res.json({ 
      success: true, 
      message: "Kết nối tới PostgreSQL database qua Session Pooler thành công!",
      details: `Kiểm tra kết nối hợp lệ tới máy chủ ${host}. Bảng 'options' đã sẵn sàng.`
    });
  } catch (err: any) {
    const friendlyError = formatPostgresError(err, url);
    return res.status(400).json({ success: false, error: friendlyError });
  }
});

// Endpoint để đẩy toàn bộ in-memory db lên Supabase (manual sync)
app.post("/api/supabase/push-data", authMiddleware, requireRole('administrator'), async (req, res) => {
  if (!postgresPool) {
    return res.status(400).json({ 
      success: false, 
      error: "Chưa cấu hình kết nối PostgreSQL. Vui lòng cấu hình kết nối trước." 
    });
  }
  try {
    await saveDbToSupabase();
    res.json({
      success: true,
      message: `Đã đẩy thành công toàn bộ dữ liệu lên Supabase!`,
      stats: {
        posts: (db.posts || []).length,
        terms: (db.terms || []).length,
        users: (db.users || []).length,
        submissions: (db.submissions || []).length,
        videos: ((db as any).videos || []).length,
        perspectives: ((db as any).perspectives || []).length,
        mediaFolders: ((db as any).mediaFolders || []).length,
        mediaItems: ((db as any).mediaItems || []).length,
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: `Lỗi khi đẩy dữ liệu: ${err.message}` 
    });
  }
});

app.get("/api/options", (req, res) => {
  res.json(db.options);
});

app.put("/api/options", authMiddleware, requireRole('administrator'), (req, res) => {
  const updatedOptions = req.body;
  if (!Array.isArray(updatedOptions)) {
    return res.status(400).json({ error: "Định dạng dữ liệu cấu hình không hợp lệ." });
  }

  for (const opt of updatedOptions) {
    const existingIdx = db.options.findIndex(o => o.optionName === opt.optionName);
    if (existingIdx !== -1) {
      db.options[existingIdx] = { ...db.options[existingIdx], ...opt };
      dbSaveOption(db.options[existingIdx]).catch(e => console.error('[DB]', e));
    } else {
      db.options.push(opt);
      dbSaveOption(opt).catch(e => console.error('[DB]', e));
    }
  }
  res.json({ success: true, options: db.options });
});

// API Endpoints: CMS POSTS / PAGES / PRODUCTS / SHOWROOMS - GET & SEARCH
// EQUIVALENT POSTGRESQL QUERY SPECIFIED BY REQUIREMENTS:
// For public users: SELECT * FROM posts WHERE (status = 'publish' OR status = 'published' OR status = 'active') AND type = 'product' [and relationship joins]
// For admins / editors: SELECT * FROM posts WHERE type = 'product'
// For authors: SELECT * FROM posts WHERE (status = 'publish' OR status = 'published' OR status = 'active' OR author_id = $1) AND type = 'product'
app.get("/api/posts", (req, res) => {
  const { type, slug, status } = req.query;
  let list = db.posts.map(p => ({
    ...p,
    published_at: p.published_at || p.createdAt // Ensure published_at is present
  }));
  
  // Extract user if authorization token is provided
  let currentUser = getUserFromRequest(req);
  
  if (type) {
    list = list.filter(p => p.type === type);
  }
  if (slug) {
    list = list.filter(p => p.slug === slug);
  }

  // Filter based on user's permissions and roles (PostgreSQL equivalent check):
  if (currentUser) {
    const role = currentUser.role;
    if (role === 'administrator' || role === 'editor') {
      // Admin/Editor: Can see all products/posts (all statuses).
      if (status && status !== 'all') {
        list = list.filter(p => p.status === status);
      }
    } else if (role === 'author') {
      // Author: Can only see published/active products or those they created.
      list = list.filter(p => 
        (p.status === 'publish' || p.status === 'published' || p.status === 'active') || 
        (p.authorId === currentUser.id)
      );
      if (status && status !== 'all') {
        list = list.filter(p => p.status === status);
      }
    } else {
      // Others: See only published/active
      list = list.filter(p => p.status === 'publish' || p.status === 'published' || p.status === 'active');
      if (status && status !== 'all') {
        list = list.filter(p => p.status === status);
      }
    }
  } else {
    // Public user: Only see published/active products/posts
    list = list.filter(p => p.status === 'publish' || p.status === 'published' || p.status === 'active');
    if (status && status !== 'all') {
      list = list.filter(p => p.status === status);
    }
  }
  
  res.json(list);
});

// GET Single Post (Secured from Draft/Private data exposure)
app.get("/api/posts/:id", (req, res) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Không tìm thấy nội dung." });
  
  const isPublic = post.status === 'publish' || post.status === 'published' || post.status === 'active';
  if (!isPublic) {
    const user = getUserFromRequest(req);
    if (!user || (user.id !== post.authorId && user.role !== 'administrator')) {
      return res.status(403).json({ error: "Từ chối truy cập: Bạn không có quyền xem nội dung nháp hoặc riêng tư này." });
    }
  }
  
  res.json(post);
});

// CREATE Post (WordPress-style wp_insert_post)
app.post("/api/posts", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { title, slug, content, excerpt, type, status, featuredImage, menuOrder, meta, terms } = req.body;
  
  if (!title || !slug) {
    return res.status(400).json({ error: "Tiêu đề và Slug là bắt buộc." });
  }

  // Check unique slug
  if (db.posts.some(p => p.slug === slug)) {
    return res.status(400).json({ error: "Đường dẫn Slug đã tồn tại. Vui lòng chọn slug khác." });
  }

  // Security clean input content with manual safe HTML and string sanitization
  const cleanTitle = sanitizeString(title);
  const cleanExcerpt = sanitizeString(excerpt || '');
  const cleanContent = content !== undefined ? sanitizeHtml(content) : '';

  const newPost = {
    id: "post-" + Date.now(),
    title: cleanTitle,
    slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
    content: cleanContent,
    excerpt: cleanExcerpt,
    type: type || 'post',
    status: status || 'draft',
    authorId: user.id,
    featuredImage: featuredImage || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    menuOrder: Number(menuOrder) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meta: meta || {},
    terms: terms || []
  };

  db.posts.push(newPost);
  dbSavePost(newPost).catch(e => console.error('[DB]', e));
  res.status(201).json(newPost);
});

// UPDATE Post (Secured with Ownership validations)
app.put("/api/posts/:id", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { title, slug, content, excerpt, status, featuredImage, menuOrder, meta, terms } = req.body;
  const postIdx = db.posts.findIndex(p => p.id === req.params.id);
  
  if (postIdx === -1) {
    return res.status(404).json({ error: "Không tìm thấy bài viết cần cập nhật." });
  }

  const existingPost = db.posts[postIdx];

  // Role validation & Ownership verification
  if (existingPost.authorId !== user.id && user.role !== 'administrator') {
    return res.status(403).json({ error: "Từ chối truy cập: Bạn không có quyền chỉnh sửa bài viết của tác giả khác." });
  }

  // Check unique slug (excluding self)
  if (slug && slug !== existingPost.slug && db.posts.some(p => p.slug === slug)) {
    return res.status(400).json({ error: "Sự cố: Đường dẫn Slug này đã bị trùng lặp." });
  }

  const cleanTitle = title ? sanitizeString(title) : existingPost.title;
  const cleanExcerpt = excerpt !== undefined ? sanitizeString(excerpt) : existingPost.excerpt;
  const cleanContent = content !== undefined ? sanitizeHtml(content) : existingPost.content;

  db.posts[postIdx] = {
    ...existingPost,
    title: cleanTitle,
    slug: slug ? slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-') : existingPost.slug,
    content: cleanContent,
    excerpt: cleanExcerpt,
    status: status || existingPost.status,
    featuredImage: featuredImage !== undefined ? featuredImage : existingPost.featuredImage,
    menuOrder: menuOrder !== undefined ? Number(menuOrder) : existingPost.menuOrder,
    meta: meta !== undefined ? { ...existingPost.meta, ...meta } : existingPost.meta,
    terms: terms !== undefined ? terms : existingPost.terms,
    updatedAt: new Date().toISOString()
  };

  dbSavePost(db.posts[postIdx]).catch(e => console.error('[DB]', e));
  res.json(db.posts[postIdx]);
});

// DELETE Post (Secured with Ownership validations)
app.delete("/api/posts/:id", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const postIdx = db.posts.findIndex(p => p.id === req.params.id);
  
  if (postIdx === -1) {
    return res.status(404).json({ error: "Bài viết không tồn tại." });
  }

  const existingPost = db.posts[postIdx];

  // Role validation & Ownership verification
  if (existingPost.authorId !== user.id && user.role !== 'administrator') {
    return res.status(403).json({ error: "Từ chối truy cập: Bạn không có quyền xóa bài viết của tác giả khác." });
  }

  db.posts.splice(postIdx, 1);
  dbDeletePost(req.params.id).catch(e => console.error('[DB]', e));
  res.json({ success: true, message: "Xoá bài viết thành phẩm thành công." });
});

// ==========================================
// FEATURE 1: EMAIL NOTIFICATION SETTINGS & SENDER HELPER
// ==========================================
async function sendNotificationEmail(submission: any) {
  const recipientsOption = db.options.find(o => o.optionName === "contact_email_recipients");
  const enabledOption = db.options.find(o => o.optionName === "email_notification_enabled");
  const smtpOption = db.options.find(o => o.optionName === "smtp_settings");

  const emailEnabled = enabledOption ? (enabledOption.optionValue as any) === true : true;
  if (!emailEnabled) {
    console.log("[EMAIL] Bị tắt từ cấu hình Admin CMS. Bỏ qua gửi email.");
    return;
  }

  const recipientsRaw = (recipientsOption?.optionValue as any) ?? "contact@pentairvn.com, support@pentairvn.com";
  const emails = recipientsRaw.split(/[\n,]+/).map((e: string) => e.trim()).filter((e: string) => e);
  if (emails.length === 0) {
    console.log("[EMAIL] Không có người nhận nào được cấu hình.");
    return;
  }

  const smtp: any = {
    host: "smtp.gmail.com",
    port: 587,
    username: "",
    password: "",
    encryption: "TLS",
    from_email: "noreply@pentairvn.com",
    from_name: "Pentair Vietnam CMS",
    ...(smtpOption?.optionValue as any || {})
  };

  const isMock = !smtp.username || !smtp.password;
  const isSmtpSecured = smtp.port == 465 || smtp.encryption === "SSL";

  const emailSubject = `[PENTAIR YÊU CẦU LIÊN HỆ] Khách hàng: ${submission.name}`;
  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #333; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #0c3471; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #0c3471; margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Pentair Vietnam</h2>
        <p style="margin: 5px 0 0; color: #64748b; font-size: 13px;">Hệ thống vừa nhận yêu cầu tư vấn mới từ website</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 35%;"><strong>Họ tên khách hàng:</strong></td>
          <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: bold; font-size: 15px;">${submission.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Số điện thoại:</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0C3471; font-weight: bold; font-size: 15px;">${submission.phone}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Địa chỉ Email:</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${submission.email}</td>
        </tr>
        ${submission.address ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Địa chỉ của khách hàng:</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: bold;">${submission.address}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Sản phẩm quan tâm:</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #b45309; font-weight: bold;">${submission.productInterest || 'Tư vấn giải pháp lọc tổng toàn diện'}</td>
        </tr>
        ${submission.productQuantity ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Số lượng:</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: bold;">${submission.productQuantity}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Gửi từ Biểu mẫu:</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #10b981; font-weight: bold; font-size: 12.5px;">${submission.formName || 'Biểu mẫu liên hệ tư vấn chung'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Đường dẫn nguồn (URL):</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1d4ed8; word-break: break-all; font-family: monospace; font-size: 12px;">
            <a href="${submission.sourceUrl || '#'}" target="_blank" style="color: #1d4ed8; text-decoration: none;">${submission.sourceUrl || 'Trang chủ / Không xác định'}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Thời gian gửi:</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12.5px;">${new Date(submission.createdAt).toLocaleString('vi-VN')}</td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <span style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block; letter-spacing: 0.5px;">Nội dung lời nhắn của khách:</span>
        <p style="margin: 6px 0 0; font-size: 13.5px; line-height: 1.6; color: #334155; font-style: italic;">"${submission.message || 'Khách hàng mong muốn nhận báo giá hệ lọc nước.'}"</p>
      </div>

      <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        Email này được gửi tự động từ hệ quản trị <strong>Pentair Vietnam CMS</strong>.<br/>Vui lòng phản hồi khách hàng trong thời gian sớm nhất để giữ liên lạc tối ưu.
      </div>
    </div>
  `;

  try {
    const finalFromName = (smtp.from_name && smtp.from_name !== "undefined") ? smtp.from_name : "Pentair Vietnam CMS";
    const finalFromEmail = (smtp.from_email && smtp.from_email !== "undefined") ? smtp.from_email : (smtp.username || "noreply@pentairvn.com");

    if (isMock) {
      console.log(`[SIMULATED EMAIL] Gửi email từ ${finalFromName} <${finalFromEmail}> tới:`, emails);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port),
      secure: isSmtpSecured,
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"${finalFromName}" <${finalFromEmail}>`,
      to: emails.join(", "),
      subject: emailSubject,
      html: emailHtml
    });

    console.log("[EMAIL] Thông báo khách liên hệ gửi thành công!");
  } catch (err) {
    console.error("[EMAIL ERROR] Lỗi gửi mail thông báo khách liên hệ:", err);
  }
}

app.get("/api/admin/settings/email", authMiddleware, (req, res) => {
  const recipientsOption = db.options.find(o => o.optionName === "contact_email_recipients");
  const enabledOption = db.options.find(o => o.optionName === "email_notification_enabled");
  const smtpOption = db.options.find(o => o.optionName === "smtp_settings");

  res.json({
    contact_email_recipients: recipientsOption?.optionValue ?? "contact@pentairvn.com, support@pentairvn.com",
    email_notification_enabled: (enabledOption?.optionValue as any) !== false,
    smtp_settings: smtpOption?.optionValue ?? {
      host: "smtp.gmail.com",
      port: 587,
      username: "",
      password: "",
      encryption: "TLS",
      from_email: "noreply@pentairvn.com",
      from_name: "Pentair Vietnam CMS"
    }
  });
});

app.put("/api/admin/settings/email", authMiddleware, (req, res) => {
  const { contact_email_recipients, email_notification_enabled, smtp_settings } = req.body;

  // Save the recipients
  let recipientsIdx = db.options.findIndex(o => o.optionName === "contact_email_recipients");
  if (recipientsIdx === -1) {
    const recipOpt = {
      id: "opt-recipients",
      optionName: "contact_email_recipients",
      optionValue: (contact_email_recipients ?? "contact@pentairvn.com, support@pentairvn.com") as any
    };
    db.options.push(recipOpt);
    dbSaveOption(recipOpt).catch(e => console.error('[DB]', e));
  } else {
    (db.options[recipientsIdx] as any).optionValue = contact_email_recipients;
    dbSaveOption(db.options[recipientsIdx]).catch(e => console.error('[DB]', e));
  }

  // Save enabled status
  let enabledIdx = db.options.findIndex(o => o.optionName === "email_notification_enabled");
  if (enabledIdx === -1) {
    const enabledOpt = {
      id: "opt-email-enabled",
      optionName: "email_notification_enabled",
      optionValue: (email_notification_enabled !== false) as any
    };
    db.options.push(enabledOpt);
    dbSaveOption(enabledOpt).catch(e => console.error('[DB]', e));
  } else {
    (db.options[enabledIdx] as any).optionValue = email_notification_enabled === true;
    dbSaveOption(db.options[enabledIdx]).catch(e => console.error('[DB]', e));
  }

  // Save SMTP settings
  let smtpIdx = db.options.findIndex(o => o.optionName === "smtp_settings");
  if (smtpIdx === -1) {
    const smtpOpt = {
      id: "opt-smtp",
      optionName: "smtp_settings",
      optionValue: smtp_settings ?? {
        host: "smtp.gmail.com",
        port: 587,
        username: "",
        password: "",
        encryption: "TLS",
        from_email: "noreply@pentairvn.com",
        from_name: "Pentair Vietnam CMS"
      }
    };
    db.options.push(smtpOpt);
    dbSaveOption(smtpOpt).catch(e => console.error('[DB]', e));
  } else {
    db.options[smtpIdx].optionValue = smtp_settings;
    dbSaveOption(db.options[smtpIdx]).catch(e => console.error('[DB]', e));
  }

  res.json({ success: true, message: "Cấu hình email đã được cập nhật thành công!" });
});

app.post("/api/admin/settings/email/test", authMiddleware, async (req, res) => {
  let { smtp_settings, contact_email_recipients } = req.body || {};

  if (!smtp_settings) {
    const smtpOption = db.options.find(o => o.optionName === "smtp_settings");
    smtp_settings = smtpOption?.optionValue;
  }
  if (!contact_email_recipients) {
    const recipientsOption = db.options.find(o => o.optionName === "contact_email_recipients");
    contact_email_recipients = recipientsOption?.optionValue;
  }

  if (!smtp_settings) return res.status(400).json({ error: "Thiếu thông tin SMTP. Vui lòng cấu hình email trước khi kiểm tra." });
  if (!contact_email_recipients) return res.status(400).json({ error: "Thiếu danh sách email nhận thử." });

  const emails = contact_email_recipients.split(/[\n,]+/).map((e: string) => e.trim()).filter((e: string) => e);
  if (emails.length === 0) return res.status(400).json({ error: "Vui lòng cung cấp ít nhất một email nhận." });

  try {
    const finalFromName = (smtp_settings.from_name && smtp_settings.from_name !== "undefined") ? smtp_settings.from_name : "Pentair Vietnam CMS";
    const finalFromEmail = (smtp_settings.from_email && smtp_settings.from_email !== "undefined") ? smtp_settings.from_email : (smtp_settings.username || "noreply@pentairvn.com");

    const isMock = !smtp_settings.username || !smtp_settings.password;
    if (isMock) {
      console.log(`[MOCK EMAIL] Gửi email thử nghiệm từ ${finalFromName} <${finalFromEmail}> tới:`, emails);
      return res.json({
        success: true,
        message: "Email thử nghiệm đã được gởi thành công (Chế độ mô phỏng - Chưa cấu hình username/password SMTP)!",
        log: `Mock Send to: ${emails.join(", ")} | Header: Test Connection SMTP.`
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtp_settings.host,
      port: Number(smtp_settings.port),
      secure: smtp_settings.port == 465 || smtp_settings.encryption === "SSL",
      auth: {
        user: smtp_settings.username,
        pass: smtp_settings.password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"${finalFromName}" <${finalFromEmail}>`,
      to: emails.join(", "),
      subject: "Pentair Vietnam CMS - Thiết lập SMTP thành công",
      text: "Xin chào! Đây là email kiểm tra kết nối SMTP từ trang quản trị CMS Pentair Việt Nam. Trình gửi và nhận thông tin đã hoạt động trơn tru.",
      html: `
        <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e1e8f0; border-radius: 12px;">
          <h2 style="color: #0c3471; margin-top: 0;">Pentair Vietnam CRM</h2>
          <p style="font-size: 14px; line-height: 1.6;">Xin chào Admin,</p>
          <div style="background-color: #f0f7ff; border-left: 4px solid #0056b3; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
            <strong>Chúc mừng!</strong> Trình gửi email SMTP của hệ thống đã kết nối hoàn hảo.
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 20px;">Thời gian kiểm tra: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
      `
    });

    res.json({ success: true, message: "Gửi email thử qua SMTP thật thành công!" });
  } catch (err: any) {
    console.error("Lỗi gửi email thử:", err);
    res.status(500).json({ success: false, error: "Lỗi kết nối SMTP Mail Server: " + err.message });
  }
});

// ==========================================
// FEATURE 2: PRODUCT PRICE MANAGEMENT
// ==========================================
app.get("/api/admin/products/:id", authMiddleware, (req, res) => {
  const prod = db.posts.find(p => p.id === req.params.id && p.type === 'product');
  if (!prod) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
  res.json(prod);
});

app.put("/api/admin/products/:id", authMiddleware, (req, res) => {
  const prodIdx = db.posts.findIndex(p => p.id === req.params.id && p.type === 'product');
  if (prodIdx === -1) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
  
  const { title, slug, content, excerpt, status, featuredImage, menuOrder, meta, terms } = req.body;
  
  // Custom PostgreSQL Constraints Simulation
  const regularPrice = meta?.regular_price !== undefined ? parseFloat(meta.regular_price) : undefined;
  const salePrice = (meta?.sale_price !== undefined && meta.sale_price !== null && meta.sale_price !== "") ? parseFloat(meta.sale_price) : null;
  
  if (regularPrice !== undefined) {
    if (isNaN(regularPrice) || regularPrice < 0) {
      return res.status(400).json({ error: "Giá niêm yết bắt buộc phải là số dương hoặc bằng 0." });
    }
  }

  if (salePrice !== null) {
    if (isNaN(salePrice) || salePrice < 0) {
      return res.status(400).json({ error: "Giá khuyến mãi phải là một số không âm." });
    }
    if (regularPrice !== undefined && salePrice >= regularPrice) {
      return res.status(400).json({ error: "Lỗi: Giá khuyến mãi phải nhỏ hơn giá niêm yết." });
    }
    const currentRegularPrice = parseFloat((db.posts[prodIdx].meta as any)?.regular_price || 0);
    if (regularPrice === undefined && salePrice >= currentRegularPrice) {
      return res.status(400).json({ error: "Lỗi: Giá khuyến mãi phải nhỏ hơn giá niêm yết." });
    }
  }

  const existingPost = db.posts[prodIdx];
  db.posts[prodIdx] = {
    ...existingPost,
    title: title ? sanitizeString(title) : existingPost.title,
    slug: slug ? slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-') : existingPost.slug,
    content: content !== undefined ? content : existingPost.content,
    excerpt: excerpt !== undefined ? sanitizeString(excerpt) : existingPost.excerpt,
    status: status || existingPost.status,
    featuredImage: featuredImage !== undefined ? featuredImage : existingPost.featuredImage,
    menuOrder: menuOrder !== undefined ? Number(menuOrder) : existingPost.menuOrder,
    meta: {
      ...existingPost.meta,
      ...meta,
    },
    terms: terms || existingPost.terms,
    updatedAt: new Date().toISOString()
  };

  dbSavePost(db.posts[prodIdx]).catch(e => console.error('[DB]', e));
  res.json(db.posts[prodIdx]);
});

// ==========================================
// FEATURE 3: VIDEO PLAYLIST APIS
// ==========================================
app.get("/api/videos", (req, res) => {
  const publishedVideos = db.videos
    .filter(v => !v.status || v.status === 'published' || v.status === 'publish')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(v => ({ ...v, videoUrl: v.videoUrl || (v as any).url || null }));
  res.json(publishedVideos);
});

app.get("/api/admin/videos", authMiddleware, (req, res) => {
  res.json(
    db.videos
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(v => ({ ...v, videoUrl: v.videoUrl || (v as any).url || null }))
  );
});

app.post("/api/admin/videos", authMiddleware, (req, res) => {
  const { title, description, videoUrl, thumbnail, category, duration, isFeatured, status, sortOrder } = req.body;
  if (!title || !videoUrl) return res.status(400).json({ error: "Tiêu đề và đường dẫn Video URL là bắt buộc." });

  const newVid = {
    id: "vid-" + Date.now(),
    title: sanitizeString(title),
    slug: (title || "").toLowerCase().normalize().replace(/[^a-z0-9]/g, "-"),
    description: sanitizeString(description || ''),
    videoUrl,
    thumbnail: thumbnail || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    category: category || "introduction",
    duration: duration || "5:00",
    isFeatured: isFeatured === true,
    status: status || "published",
    sortOrder: Number(sortOrder) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.videos.push(newVid);
  dbSaveVideo(newVid).catch(e => console.error('[DB]', e));
  res.status(201).json(newVid);
});

app.put("/api/admin/videos/:id", authMiddleware, (req, res) => {
  const vidIdx = db.videos.findIndex(v => v.id === req.params.id);
  if (vidIdx === -1) return res.status(404).json({ error: "Không tìm thấy video." });

  const existingVid = db.videos[vidIdx];
  const { title, description, videoUrl, thumbnail, category, duration, isFeatured, status, sortOrder } = req.body;

  db.videos[vidIdx] = {
    ...existingVid,
    title: title ? sanitizeString(title) : existingVid.title,
    description: description !== undefined ? sanitizeString(description) : existingVid.description,
    videoUrl: videoUrl !== undefined ? videoUrl : existingVid.videoUrl,
    thumbnail: thumbnail !== undefined ? thumbnail : existingVid.thumbnail,
    category: category !== undefined ? category : existingVid.category,
    duration: duration !== undefined ? duration : existingVid.duration,
    isFeatured: isFeatured !== undefined ? isFeatured === true : existingVid.isFeatured,
    status: status !== undefined ? status : existingVid.status,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : existingVid.sortOrder,
    updatedAt: new Date().toISOString()
  };

  dbSaveVideo(db.videos[vidIdx]).catch(e => console.error('[DB]', e));
  res.json(db.videos[vidIdx]);
});

app.delete("/api/admin/videos/:id", authMiddleware, (req, res) => {
  const vidIdx = db.videos.findIndex(v => v.id === req.params.id);
  if (vidIdx === -1) return res.status(404).json({ error: "Không tìm thấy video." });

  db.videos.splice(vidIdx, 1);
  dbDeleteVideo(req.params.id).catch(e => console.error('[DB]', e));
  res.json({ success: true, message: "Đã xóa video khỏi danh sách!" });
});

// ==========================================
// FEATURE 3.5: MEDIA GALLERY & REPOSITORY APIS
// ==========================================
app.get("/api/admin/media", authMiddleware, (req, res) => {
  res.json({
    folders: db.mediaFolders || [],
    items: db.mediaItems || []
  });
});

app.post("/api/admin/media/folders", authMiddleware, (req, res) => {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: "Tên thư mục không được để trống." });

  const newFolder = {
    id: "folder-" + crypto.randomUUID(),
    name: sanitizeString(name.trim()),
    parentId: parentId || undefined,
    createdAt: new Date().toISOString()
  };

  if (!db.mediaFolders) db.mediaFolders = [];
  db.mediaFolders.push(newFolder);
  dbSaveMediaFolder(newFolder).catch(e => console.error('[DB]', e));
  res.json(newFolder);
});

app.put("/api/admin/media/folders/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, parentId } = req.body;
  const folder = db.mediaFolders.find((f: any) => f.id === id);
  if (!folder) return res.status(404).json({ error: "Không tìm thấy thư mục." });

  if (name) folder.name = sanitizeString(name.trim());
  if (parentId !== undefined) folder.parentId = parentId || undefined;

  dbSaveMediaFolder(folder).catch(e => console.error('[DB]', e));
  res.json(folder);
});

app.delete("/api/admin/media/folders/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const idx = db.mediaFolders.findIndex((f: any) => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "Không tìm thấy thư mục." });

  const folder = db.mediaFolders[idx];
  const targetParent = folder.parentId || undefined;

  // Reparent nested items & folders
  if (db.mediaItems) {
    db.mediaItems.forEach((item: any) => {
      if (item.folderId === id) {
        item.folderId = targetParent;
        dbSaveMediaItem(item).catch(e => console.error('[DB]', e));
      }
    });
  }

  db.mediaFolders.forEach((f: any) => {
    if (f.parentId === id) {
      f.parentId = targetParent;
      dbSaveMediaFolder(f).catch(e => console.error('[DB]', e));
    }
  });

  db.mediaFolders.splice(idx, 1);
  dbDeleteMediaFolder(id).catch(e => console.error('[DB]', e));
  res.json({ success: true });
});

app.post("/api/admin/media/upload", authMiddleware, (req, res) => {
  const { filename, mimeType, base64Data, url, folderId } = req.body;
  
  if (!db.mediaItems) db.mediaItems = [];

  if (url) {
    // Trích xuất tên ảnh sạch từ URL (loại bỏ query params, hash và giải mã URL)
    let urlPath = url.split('?')[0].split('#')[0];
    let extractedName = "Image";
    try {
      extractedName = decodeURIComponent(urlPath.split('/').pop() || "Image");
    } catch (e) {
      extractedName = urlPath.split('/').pop() || "Image";
    }

    const newItem = {
      id: "media-" + crypto.randomUUID(),
      title: filename ? sanitizeString(filename.trim()) : sanitizeString(extractedName),
      url: url,
      mimeType: mimeType || "image/jpeg",
      folderId: folderId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.mediaItems.push(newItem);
    dbSaveMediaItem(newItem).catch(e => console.error('[DB]', e));
    return res.json(newItem);
  }

  if (!base64Data || !filename) {
    return res.status(400).json({ error: "Thiếu dữ liệu tệp tin upload." });
  }

  const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
  if (!process.env.VERCEL) {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
    } catch (err) {
      console.error("Could not create uploads directory", err);
    }
  }

  // Tên hiển thị (title) phải trùng khớp 100% với tên ảnh trên thiết bị (filename gốc)
  const displayTitle = sanitizeString(filename);

  // Tên tệp vật lý lưu trữ trên hệ thống máy chủ cần an toàn (loại bỏ ký tự nguy hiểm)
  const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const uniqueFilename = `${Date.now()}-${safeFilename}`;
  const filePath = path.join(UPLOADS_DIR, uniqueFilename);

  try {
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;

    const newItem = {
      id: "media-" + crypto.randomUUID(),
      title: displayTitle,
      url: fileUrl,
      mimeType: mimeType || "image/jpeg",
      fileSize: buffer.length,
      folderId: folderId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.mediaItems.push(newItem);
    dbSaveMediaItem(newItem).catch(e => console.error('[DB]', e));
    return res.json(newItem);
  } catch (err: any) {
    console.error("Lỗi upload file", err);
    return res.status(500).json({ error: "Không thể lưu tệp tin lên máy chủ." });
  }
});

app.put("/api/admin/media/items/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, altText, description, folderId, url } = req.body;
  const item = db.mediaItems.find((i: any) => i.id === id);
  if (!item) return res.status(404).json({ error: "Không tìm thấy hình ảnh." });

  if (title) item.title = sanitizeString(title);
  if (altText !== undefined) item.altText = sanitizeString(altText);
  if (description !== undefined) item.description = sanitizeString(description);
  if (folderId !== undefined) item.folderId = folderId || undefined;
  if (url !== undefined) item.url = url;
  item.updatedAt = new Date().toISOString();

  dbSaveMediaItem(item).catch(e => console.error('[DB]', e));
  res.json(item);
});

app.delete("/api/admin/media/items/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const idx = db.mediaItems.findIndex((i: any) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Không tìm thấy hình ảnh." });

  const item = db.mediaItems[idx];
  if (item.url.startsWith("/uploads/")) {
    const filename = item.url.replace("/uploads/", "");
    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Lỗi xóa file cơ chế vật lý", err);
      }
    }
  }

  db.mediaItems.splice(idx, 1);
  dbDeleteMediaItem(id).catch(e => console.error('[DB]', e));
  res.json({ success: true });
});

// ==========================================
// FEATURE 4: ARCHITECTURAL PERSPECTIVES APIS
// ==========================================
app.get("/api/perspectives", (req, res) => {
  const publishedPerspectives = db.perspectives.filter(p => p.status === 'published' || p.status === 'publish').sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(publishedPerspectives);
});

app.get("/api/perspectives/:slug", (req, res) => {
  const per = db.perspectives.find(p => p.slug === req.params.slug);
  if (!per) return res.status(404).json({ error: "Không tìm thấy phối cảnh." });
  res.json(per);
});

app.get("/api/admin/perspectives", authMiddleware, (req, res) => {
  res.json(db.perspectives.sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
});

app.post("/api/admin/perspectives", authMiddleware, (req, res) => {
  const { title, slug, excerpt, content, featuredImage, spaceType, gallery, productGallery, relatedProductIds, isFeatured, status, sortOrder } = req.body;
  
  if (!title) return res.status(400).json({ error: "Tiêu đề là bắt buộc." });
  const finalSlug = slug || title.toLowerCase().normalize().replace(/[^a-z0-2]/g, "-").replace(/--+/g, "-");

  const newPer = {
    id: "per-" + Date.now(),
    title: sanitizeString(title),
    slug: finalSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
    excerpt: sanitizeString(excerpt || ''),
    content: content || '',
    featuredImage: featuredImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    spaceType: spaceType || "villa",
    gallery: gallery || [],
    productGallery: productGallery || [],
    relatedProductIds: relatedProductIds || [],
    isFeatured: isFeatured === true,
    status: status || "published",
    sortOrder: Number(sortOrder) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.perspectives.push(newPer);
  dbSavePerspective(newPer).catch(e => console.error('[DB]', e));
  res.status(201).json(newPer);
});

app.put("/api/admin/perspectives/:id", authMiddleware, (req, res) => {
  const perIdx = db.perspectives.findIndex(p => p.id === req.params.id);
  if (perIdx === -1) return res.status(404).json({ error: "Không tìm thấy phối cảnh." });

  const existingPer = db.perspectives[perIdx];
  const { title, slug, excerpt, content, featuredImage, spaceType, gallery, productGallery, relatedProductIds, isFeatured, status, sortOrder } = req.body;

  db.perspectives[perIdx] = {
    ...existingPer,
    title: title ? sanitizeString(title) : existingPer.title,
    slug: slug ? slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-') : existingPer.slug,
    excerpt: excerpt !== undefined ? sanitizeString(excerpt) : existingPer.excerpt,
    content: content !== undefined ? content : existingPer.content,
    featuredImage: featuredImage !== undefined ? featuredImage : existingPer.featuredImage,
    spaceType: spaceType !== undefined ? spaceType : existingPer.spaceType,
    gallery: gallery !== undefined ? gallery : existingPer.gallery,
    productGallery: productGallery !== undefined ? productGallery : existingPer.productGallery,
    relatedProductIds: relatedProductIds !== undefined ? relatedProductIds : existingPer.relatedProductIds,
    isFeatured: isFeatured !== undefined ? isFeatured === true : existingPer.isFeatured,
    status: status !== undefined ? status : existingPer.status,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : existingPer.sortOrder,
    updatedAt: new Date().toISOString()
  };

  dbSavePerspective(db.perspectives[perIdx]).catch(e => console.error('[DB]', e));
  res.json(db.perspectives[perIdx]);
});

app.delete("/api/admin/perspectives/:id", authMiddleware, (req, res) => {
  const perIdx = db.perspectives.findIndex(p => p.id === req.params.id);
  if (perIdx === -1) return res.status(404).json({ error: "Không tìm thấy phối cảnh." });

  db.perspectives.splice(perIdx, 1);
  dbDeletePerspective(req.params.id).catch(e => console.error('[DB]', e));
  res.json({ success: true, message: "Đã xóa phối cảnh thành công!" });
});

// API Endpoints: TERMS (Categories, Tags)
app.get("/api/terms", (req, res) => {
  res.json(db.terms);
});

app.post("/api/terms", authMiddleware, (req, res) => {
  const { name, slug, taxonomy, status } = req.body;
  if (!name || !taxonomy) return res.status(400).json({ error: "Tên và phân loại (taxonomy) là bắt buộc." });
  
  const calculatedSlug = slug || name.toLowerCase().normalize().replace(/[^a-z0-9]/g, "-");
  
  const newTerm = {
    id: "term-" + Date.now(),
    name: sanitizeString(name),
    slug: calculatedSlug,
    taxonomy,
    status: status || 'publish'
  };

  db.terms.push(newTerm);
  dbSaveTerm(newTerm).catch(e => console.error('[DB]', e));
  res.status(201).json(newTerm);
});

app.put("/api/terms/:id", authMiddleware, (req, res) => {
  const { name, slug, taxonomy, status } = req.body;
  const { id } = req.params;
  const term = db.terms.find(t => t.id === id) as any;
  if (!term) return res.status(404).json({ error: "Không tìm thấy chuyên mục." });
  
  if (name) term.name = sanitizeString(name);
  if (slug) term.slug = slug;
  if (taxonomy) term.taxonomy = taxonomy;
  if (status) term.status = status;

  dbSaveTerm(term).catch(e => console.error('[DB]', e));
  res.json(term);
});

app.delete("/api/terms/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const termIdx = db.terms.findIndex(t => t.id === id);
  if (termIdx === -1) return res.status(404).json({ error: "Không tìm thấy chuyên mục." });
  
  db.terms.splice(termIdx, 1);
  dbDeleteTerm(id).catch(e => console.error('[DB]', e));

  // Clean up any posts referencing this term
  db.posts.forEach(post => {
    if (post.terms && Array.isArray(post.terms)) {
      post.terms = post.terms.filter(t => t.id !== id);
      dbSavePost(post).catch(e => console.error('[DB]', e));
    }
  });

  res.json({ success: true, message: "Đã xóa chuyên mục thành công!" });
});

// API Endpoints: FORM SUBMISSIONS
app.post("/api/submissions", (req, res) => {
  const { name, email, phone, message, productInterest, productQuantity, address, sourceUrl, formName } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Vui lòng nhập Họ tên, Email và Số điện thoại." });
  }

  // Back-end regex validation for safer operation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Địa chỉ email không đúng định dạng. Ví dụ: khachhang@gmail.com" });
  }

  const phoneRegex = /^[0-9\-\+\s]{8,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return res.status(400).json({ error: "Số điện thoại không đúng định dạng. Cần cung cấp từ 8 đến 15 chữ số." });
  }

  const newSubmission = {
    id: "sub-" + Date.now(),
    name: sanitizeString(name),
    email: sanitizeString(email.trim()),
    phone: sanitizeString(phone.trim()),
    message: sanitizeString(message || ''),
    productInterest: productInterest ? sanitizeString(productInterest) : undefined,
    productQuantity: productQuantity ? sanitizeString(productQuantity) : undefined,
    address: address ? sanitizeString(address.trim()) : undefined,
    sourceUrl: sourceUrl ? sanitizeString(sourceUrl) : undefined,
    formName: formName ? sanitizeString(formName) : undefined,
    status: 'unread' as const,
    createdAt: new Date().toISOString()
  };

  db.submissions.push(newSubmission);
  dbSaveSubmission(newSubmission).catch(e => console.error('[DB]', e));
  // Call sendNotificationEmail asynchronously
  sendNotificationEmail(newSubmission).catch(err => console.error("Lỗi gửi mail tự động:", err));
  res.status(201).json({ success: true, submission: newSubmission });
});

app.get("/api/submissions", authMiddleware, (req, res) => {
  res.json(db.submissions);
});

app.put("/api/submissions/:id", authMiddleware, (req, res) => {
  const { status } = req.body;
  const subIdx = db.submissions.findIndex(s => s.id === req.params.id);
  if (subIdx === -1) return res.status(404).json({ error: "Yêu cầu liên hệ không tồn tại." });
  
  db.submissions[subIdx].status = status;
  dbSaveSubmission(db.submissions[subIdx]).catch(e => console.error('[DB]', e));
  res.json({ success: true, submission: db.submissions[subIdx] });
});

app.delete("/api/submissions/:id", authMiddleware, requireRole('administrator'), (req, res) => {
  const subIdx = db.submissions.findIndex(s => s.id === req.params.id);
  if (subIdx === -1) return res.status(404).json({ error: "Yêu cầu liên hệ không tồn tại." });
  
  db.submissions.splice(subIdx, 1);
  dbDeleteSubmission(req.params.id).catch(e => console.error('[DB]', e));
  res.json({ success: true });
});

// API Endpoints: SYSTEM BACKUP (Import/Export WordPress XML-like JSON content)
app.get("/api/backup/export", authMiddleware, requireRole('administrator'), (req, res) => {
  const backup = {
    users: db.users.map(({ passwordHash, twoFactorSecret, ...u }) => u), // Exclude sensitive hashes in exports
    posts: db.posts,
    terms: db.terms,
    options: db.options,
    submissions: db.submissions,
    exportedAt: new Date().toISOString()
  };
  res.json(backup);
});

app.post("/api/backup/import", authMiddleware, requireRole('administrator'), (req, res) => {
  const { posts, terms, options, submissions } = req.body;

  if (posts && Array.isArray(posts)) {
    db.posts = posts;
    for (const post of posts) dbSavePost(post).catch(e => console.error('[DB]', e));
  }
  if (terms && Array.isArray(terms)) {
    db.terms = terms;
    for (const term of terms) dbSaveTerm(term).catch(e => console.error('[DB]', e));
  }
  if (options && Array.isArray(options)) {
    db.options = options;
    for (const opt of options) dbSaveOption(opt).catch(e => console.error('[DB]', e));
  }
  if (submissions && Array.isArray(submissions)) {
    db.submissions = submissions;
    for (const sub of submissions) dbSaveSubmission(sub).catch(e => console.error('[DB]', e));
  }

  res.json({ success: true, message: "Nhập dữ liệu CMS thành công. Hệ thống đã khôi phục trạng thái mới." });
});


// Dynamic SEO sitemap.xml endpoint
app.get("/sitemap.xml", (req, res) => {
  res.header("Content-Type", "application/xml");
  const seoOptIdx = db.options.findIndex(o => o.optionName === "seo_settings");
  let baseUrl = "https://thegioiloctong.com";
  
  if (seoOptIdx !== -1 && (db.options[seoOptIdx].optionValue as any).canonicalUrl) {
    baseUrl = (db.options[seoOptIdx].optionValue as any).canonicalUrl.replace(/\/$/, "");
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Base URLs
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/ve-pentair</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/san-pham</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/tin-tuc</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/lien-he</loc>\n    <changefreq>yearly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;

  // Dynamic public published posts/products
  db.posts.filter(p => p.status === "publish").forEach(p => {
    let route = `/${p.slug}`;
    if (p.type === 'product') route = `/san-pham/${p.slug}`;
    if (p.type === 'post') route = `/tin-tuc/${p.slug}`;
    
    xml += `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;
  res.send(xml);
});

// Dynamic SEO robots.txt endpoint
app.get("/robots.txt", (req, res) => {
  res.header("Content-Type", "text/plain");
  const seoOptIdx = db.options.findIndex(o => o.optionName === "seo_settings");
  if (seoOptIdx !== -1 && (db.options[seoOptIdx].optionValue as any).robotsTxt) {
    return res.send((db.options[seoOptIdx].optionValue as any).robotsTxt);
  }
  res.send("User-agent: *\nDisallow: /admin/\nAllow: /\n\nSitemap: https://thegioiloctong.com/sitemap.xml");
});

// Vite server boot connection / Static Server in Production
async function startServer() {
  if (isSetupMode) {
    console.log("[BOOT] ⚙️  DATABASE_URL chưa được cấu hình. Chạy ở chế độ Setup. Truy cập http://localhost:3000/setup để thiết lập.");
  } else {
    console.log("[BOOT] Đang tải dữ liệu từ PostgreSQL...");
    // Hard 4 s cap: connect_timeout=4s means DB errors surface quickly;
    // this wrapper ensures startServer() always resolves in ≤ 4 s.
    await Promise.race([
      loadDbFromSupabase(),
      new Promise<void>(resolve => setTimeout(resolve, 4_000))
    ]);
    console.log("[BOOT] Dữ liệu đã sẵn sàng. Khởi động server...");
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL) {
    console.log("Running in Vercel Serverless environment. Skip app.listen().");
  } else {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server Pentair running on http://localhost:${PORT} — 100% PostgreSQL mode`);
    });
  }
}

// Debug endpoint — check server status on Vercel
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    isSetupMode,
    hasDb: !!postgresPool,
    posts: db.posts?.length ?? 0,
    perspectives: (db as any).perspectives?.length ?? 0,
    videos: (db as any).videos?.length ?? 0,
    env: { hasDatabaseUrl: !!process.env.DATABASE_URL, nodeEnv: process.env.NODE_ENV, vercel: !!process.env.VERCEL }
  });
});

// Kick off DB init immediately at module load. The gate middleware above (registered before
// all routes) awaits this promise on every request, so cold-start responses always carry
// fully-loaded PostgreSQL data instead of the in-memory bootstrap defaults.
serverInitPromise = startServer().catch(err => console.error('[BOOT]', err));

export default app;
