# Repair Series — Modern Operations Admin Panel

A high-performance, enterprise-grade Operations and Admin Dashboard built from scratch for the **Repair Series** platform. Designed with inspiration from modern SaaS dashboards featuring clean light aesthetic, floating rounded cards, categorized sidebar navigation, interactive statistics, dual-tone cylinder bar charts, and semi-circular radial fulfillment gauges.

---

## 🎨 UI/UX Design System Highlights

- **Aesthetic**: Clean, modern light theme canvas (`#F8FAFC`) with floating white card containers (`rounded-3xl` / `rounded-2xl`, soft borders, and subtle drop shadows).
- **Navigation**:
  - Organized, categorized sidebar: **MAIN MENU**, **SERVICES & CATALOG**, **OPERATIONS**, **FINANCE & BILLING**, **MARKETING & APP**, **CONFIGURATION**.
  - Dynamic badge counters (e.g. pending booking alerts).
  - Bottom persistent administrator widget with active session indicator, role badge, theme switcher, and sign-out.
  - Fully responsive mobile drawer navigation with backdrop blur.
- **Header**:
  - Breadcrumb navigation and section title.
  - Quick-jump global search across bookings, technicians, customers, and services.
  - Live pulse indicator with current formatted date.
  - Notifications bell with unread badge count.
  - Profile dropdown with quick access to platform settings and theme toggle.
- **Operations Dashboard**:
  - Real-time pulse banner with live operational summary.
  - 4 hero KPI metric cards with SVG progress rings and trend badges (+12%, +9%).
  - Dual-tone cylinder bar charts for Platform Revenue vs. Technician Payouts.
  - Service category demand breakdown with circular percentage rings.
  - Service Fulfillment semi-circular radial gauge (90% goal tracker).
  - Revisit lifecycle cards with claim rates and breakdown.
  - Weekly booking rhythm bar chart.
  - Recent live bookings table with status pills, customer avatars, and currency formatting.

---

## 🚀 Modules & Capabilities Preserved

1. **Authentication & RBAC**:
   - Multi-tier role permissions: `Super Admin`, `Technician Manager`, `Booking Manager`, `Service Manager`, `Wall Panel Manager`, `Wall Panel Employee`.
   - Protected route verification with automatic fallback redirection.
2. **Bookings Management**:
   - Status transitions (`New` → `Assigned` → `InProgress` → `Completed` / `Cancelled`).
   - Technician assignment with ranking score calculations, distance checks, service category matching, and busy slot verification.
   - Add-on services and extra parts approval workflows.
   - Work proof photo lightbox with zoom, pinch, and download.
   - Stored financial breakdown and invoice regeneration/download.
3. **Technicians & Fleet Operations**:
   - Live availability tracking (Available 🟢, Busy 🟠, Offline 🔴).
   - Duty shift controls (On Duty / Off Duty) and KYC verification statuses.
   - KYC Verification Drawer with document preview and sensitive data masking.
   - Partner settlement and ledger with lifetime earnings, payouts, and manual adjustments.
   - Dynamic UPI payment QR code generator.
4. **Catalog & Services**:
   - 4-level catalog hierarchy: Categories → Service Types → Service Categories → Services → Variations & FAQs.
   - Drag-and-drop / display order resequencing.
   - Move catalog nodes and convert variations to standalone services.
   - CSV bulk export & import with preview and validation.
   - Wall Panel Design Studio with multi-photo upload and custom quotation submission.
5. **Operational Control**:
   - Warranty revisits lifecycle and policy configurations.
   - Paused jobs management with photos and resumption workflows.
   - Technician GPS location history timeline and coordinates.
   - Service areas and pincode coverage zones.
   - Scheduling settings (working hours, slot durations, buffer times).
   - Peak hours surcharges and technician performance ranking rules.
6. **Finance & Billing**:
   - Automated invoice generation, PDF preview, and email resend.
   - Invoice template, GSTIN, SAC/HSN codes, and company details configuration.
   - Financial reports with daily, weekly, and monthly aggregations.
   - Partner wallet balance management and withdrawal payouts.
7. **App Marketing & Visual Builder**:
   - Home Screen Builder with layout management (banners, category grids, promo strips).
   - Promotional coupons with min spend, max discount, and validity controls.
   - Customer review moderation and response.
   - Broadcast push notifications with targeting.

---

## 🛠️ Quick Start & Running

### 1. Configure Environment
Copy `env.example` to `.env` or `.env.local`:
```bash
cp env.example .env.local
```
Fill in your Firebase client config, website API URL (`https://www.repairseries.in`), and Cloudinary upload credentials.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The panel runs at `http://127.0.0.1:5173`.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in the `dist` folder.
