# Pentair Vietnam - Premium CMS & Showcase Platform

A full-stack, state-of-the-art Showcase and Content Management System (CMS) built for **Pentair Vietnam** (representing the elite US water filtration brand). This application operates as a high-performance React Single Page Application (SPA) compiled by Vite and styled with TailwindCSS v4, hosted on a robust Node.js Express backend.

---

## 🌟 Key Features

### 1. Luxury branding Showcase (Public Site)
* **Home Page**: Modular layout including a Hero Banner, Brand Intro, Why Choose Us grid, Featured Products list, interactive Softener Advisor, and real-world Space Perspective Gallery.
* **Product Catalog & Details**: Dynamic product showcase featuring detailed technical specifications, pricing models, zoomable gallery scenes, and direct purchasing buttons.
* **Space Perspective Gallery**: Visualization showing how Pentair's luxury water softeners fit elegantly into high-end apartments, penthouses, townhouses, and villas.
* **News & Blogs**: Informational portal addressing water quality concerns (e.g., hard water treatments) and strategic brand announcements.
* **Interactive Softener Advisor**: Quick diagnostic tool allowing users to calculate their local water hardness and receive automated product advice.
* **Shopping Cart & Checkout**: Interactive side drawer managing items with custom quantities and checkout forms.

### 2. Administrator CMS Dashboard
* **Post & Product Manager**: Complete CRUD operations for Pages, Posts, Products, and Showrooms. Includes automated draft/publish status toggles.
* **Taxonomy System**: Dynamic Category and Tag editors.
* **Lead Inbox**: Dashboard to review, search, and manage consultation requests and customer checkouts from the public forms.
* **Media Library**: Hierarchical file-management system supporting multi-level folder nesting, custom file uploads, and media asset assignment.
* **Supabase Cloud Sync**: Live bidirectional database replication between local `data/db.json` and Supabase remote storage.
* **DB Backup & Restore**: Full JSON structure export and import matching WordPress-style schema formats.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, TailwindCSS v4, Lucide Icons, Framer Motion |
| **Backend** | Node.js, Express, TypeScript, TSX (TypeScript Execute) |
| **Bundlers/Dev** | Vite 6, ESBuild, TypeScript compiler (`tsc`) |
| **Database** | File-based local store (`data/db.json`) + Supabase PostgreSQL Sync |

---

## 📂 Project Architecture

```text
├── api/
│   └── index.ts                 # Vercel Serverless entry wrapper
├── assets/                      # Static brand assets
├── data/
│   └── db.json                  # Flat-file JSON database (git-ignored, auto-generated)
├── src/
│   ├── components/
│   │   ├── AdminCMS.tsx         # Enterprise admin console (Dashboard, CRUD, Media Library)
│   │   ├── PublicPages.tsx      # Core public website routing and layout
│   │   ├── Header.tsx / Footer.tsx
│   │   ├── HeroSection.tsx
│   │   └── ...                  # Modular UI components
│   ├── lib/
│   │   └── supabase.ts          # Supabase client instantiation
│   ├── App.tsx                  # Application shell, state controller, virtual router
│   ├── main.tsx                 # Client bootstrap
│   ├── types.ts                 # Shared TypeScript interfaces & types
│   └── index.css                # Global styles & Tailwind v4 directives
├── server.ts                    # Backend Express API & static client host
├── tsconfig.json                # TypeScript configurations
├── vite.config.ts               # Vite configuration (Tailwind v4 integration)
└── package.json                 # Build scripts & dependency manifests
```

---

## 🔐 Credentials & Security

For testing and local development, the database contains pre-seeded accounts:

* **Administrator Account**
  * **Username**: `admin`
  * **Password**: `admin123`
* **Editor Account**
  * **Username**: `editor`
  * **Password**: `editor123`

### Accessing the Admin Console
You can trigger the Administrator Login portal via three methods:
1. Append `#admin` or `#cms` to the browser URL (e.g., `http://localhost:3000/#admin`).
2. Add query parameters `?portal=admin` or `?cms_login=true` to the URL.
3. Use the global shortcut key: **`Ctrl + Alt + A`** inside the browser.

---

## 🚀 Running Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* NPM

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory. You can copy the structure from `.env.example`:
```ini
# Database & Sync (Supabase)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# Session Security
JWT_SECRET="YOUR_RANDOM_JWT_SECRET_STRING_MINIMUM_32_BYTES"
```
*Note: If no Supabase environment variables are provided, the backend falls back to using the local `data/db.json` database autonomously.*

### 3. Start Development Server
```bash
npm run dev
```
The server will boot the Express backend and Vite middleware, running on: **[http://localhost:3000](http://localhost:3000)**.

### 4. Build and Production Run
To bundle the frontend using Vite and compile the backend using ESBuild:
```bash
# Compile client and server bundles
npm run build

# Start the compiled production server
npm run start
```

### 5. Code Quality & Type Safety
To check for TypeScript compiler errors:
```bash
npm run lint
```

---

## 💡 Developer Guidelines for Agentic Workflows

When editing or extending this codebase, please keep these structural elements in mind:

### 1. State Management & Virtual Routing
* Avoid introducing standard router packages (like `react-router-dom`). The project utilizes a **Virtual Routing System** managed by `currentPath` state in `src/App.tsx` mapped directly inside `src/components/PublicPages.tsx` and `src/components/AdminCMS.tsx`.
* Page links use standard string paths. If you create new paths, register them in `src/App.tsx`'s virtual router logic (and SEO updater `useEffect` block) and `src/components/PublicPages.tsx`.

### 2. Database IO Operations (`server.ts`)
* Database reading/writing is processed by `readDb()` and `writeDb()`. 
* All administrative changes write directly to `data/db.json` and are asynchronously pushed to Supabase via `saveDbToSupabase()`.
* **Important:** If `data/db.json` is missing or empty, `readDb()` catches the exception and populates it with the pre-seeded default configurations.

### 3. Input Sanitization
* All user-facing input fields (posts, page descriptions, form entries) must run through Express backend helpers `sanitizeString()` or `sanitizeHtml()` in `server.ts` before database commits to mitigate Cross-Site Scripting (XSS) risks.

### 4. TailwindCSS v4 Usage
* Tailwind CSS v4 is used here via the `@tailwindcss/vite` plugin. Directives are located in `src/index.css`.
* Do not attempt to use `tailwind.config.js` as config is done directly through CSS variables in `src/index.css`.
