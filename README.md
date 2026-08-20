# 🏨 STAYSETU (PG-SETU) — Production PG & Hostel Management System

**STAYSETU** is a comprehensive, production-grade PG (Paying Guest) and Hostel Management, Resident CRM, Sub-meter Electricity Billing, and Revenue Control System.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL + RLS + GoTrue Auth)**, and **Capacitor (Android APK Mobile Runtime)**.

---

## ✨ Core Features & Modules

### 1. 📊 10-Second Owner Dashboard
- Real-time **Live Occupancy Rate** & Bed Availability Matrix.
- **Expected vs. Collected Revenue** and collection performance tracking.
- **Immediate Action Alerts**: Overdue invoice warnings, expiring KYC documents, and maintenance alerts.
- Monthly revenue trends and category breakdown (Rent, Electricity, Food, Laundry).

### 2. 👥 360° Resident CRM & Lifecycle
- Unique permanent registration IDs: `PG-YYYY-NNNNNN`.
- **5-Step Check-In Wizard**: Personal info, emergency contacts, KYC docs, room/bed assignment, and security deposit recording.
- **Resident Profile**: Integrated KYC, complete ledger balance, invoice history, payment receipts, and stay logs.
- **Seamless Room/Bed Transfers**: Historical ledger continuity without data loss.
- **Checkout & Deposit Settlement Wizard**: Prorated exit, final electricity deductions, damage claims, and deposit refund calculations.

### 3. 💳 Invoicing, Payments & Financial Integrity
- **All monetary calculations stored in exact integer paise** (₹1 = 100 paise) to eliminate floating-point rounding errors.
- **Automated Billing Engine**: Prorated mid-month check-in/out calculations.
- **Payments Register**: Multi-channel collection (UPI, Cash, Bank Transfer), idempotent payment handling, and auto-allocation to oldest unpaid dues.
- **Daily Cash Closing Reconciliation**: Discrepancy tracking with reason logging.
- **Double-Entry Resident Ledger**: Audit-compliant running balance with debit/credit entries.

### 4. ⚡ Electricity Sub-Metering & Utility Billing
- Sub-meter configuration by Room, Floor, or Building.
- Automated consumption delta calculation with rollover protection.
- Smart splitting: Equal Split among active occupants, Fixed Per Person, or Custom allocations.
- 1-click invoice item generation from electricity logs.

### 5. 💰 Money Center & Owner Simulator
- Strict separation between **Operating Revenue** and **Security Deposits Held in Trust**.
- **What-If Revenue Simulator**: Dynamic projections for rent increases, filling vacant beds, or utility rate changes.
- Multi-category expense center (Electricity, Staff Salaries, Maintenance, Food Procurement).

### 6. 📱 Mobile-First UI & Android APK Support
- **5-Tab Mobile Bottom Navigation Bar** with safe-area notch insets.
- **Elevated Quick Action (+) FAB**: Fast Check-in, Collect Payment, Add Extra Charge, and Meter Reading on phones.
- **Native Android APK Scaffolding**: Built with Capacitor for 1-command APK compilation.
- **Direct WhatsApp Automation**: Device-native `wa.me` links for sending invoices, rent reminders, and receipts directly from the owner's phone without requiring paid third-party API keys.

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons, Radix UI.
- **Backend & Database**: Supabase (PostgreSQL 15), Row Level Security (RLS) policies, PostgreSQL Triggers and Functions.
- **Mobile**: Capacitor 8 (Android native bridge), Progressive Web App (PWA) manifest.
- **Charts & Data**: Recharts, TanStack React Table.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/vikram-575/STAYSETU.git
cd STAYSETU
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Database Setup
Execute the SQL migrations located in `supabase/migrations/` in your Supabase SQL editor:
1. `001_initial_schema.sql` (Tables, views, functions, triggers, and RLS policies)
2. `seed.sql` (Optional sample data)

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Building the Android Mobile APK

To build the standalone Android APK using Capacitor:

### Option A: Via Command Line (Gradle)
```powershell
cd android
.\gradlew.bat assembleDebug
```
*The compiled APK will be generated at:* `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Open in Android Studio
```bash
npm run mobile:open
```

---

## 📄 License
This project is licensed under the MIT License.
