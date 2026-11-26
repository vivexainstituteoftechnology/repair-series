# Repair Series Partner App (Technician App)

Official mobile application for **Repair Series** service professionals, certified partners, and field technicians across Android and iOS. Built with **React Native 0.88.1**, **Expo SDK 58**, and **TypeScript**, seamlessly integrating with the existing Repair Series Website backend and Operations Admin Panel.

---

## 🌟 Key Features

### 1. Secure Authentication & Onboarding
- **Phone Number Authentication**: Clean Indian mobile number input with automated `+91` normalization.
- **Auto Identity Resolution**: Direct integration with the backend `/api/auth/resolve-identity` (`role: "partner"`).
- **Self-Service Partner Registration**: Prospective technicians can register with their name, trade category (AC Repair, Plumbing, Electrician, Wall Panels, Appliances), skills, and operating city.
- **Admin Verification Gate**: Accounts stay in `pending` approval status until reviewed and approved in the Admin Panel (`Technicians` &rarr; `Approve`).
- **Session Persistence**: Backed by `@react-native-async-storage/async-storage` and Firebase Auth across app restarts.

### 2. Live Operations Dashboard
- **Online/Offline Availability Switch**: Instantly updates `shiftStatus` (`Available` / `Offline`) and `isOnline` in Firestore `technicians/{partnerId}`, immediately reflected in the Admin Panel.
- **Urgent Job Offer Alerts**: Prominent incoming job banner with payout amount, distance, and instant Accept/Decline action.
- **Today's Key Metrics**: Real-time earnings counter, completed jobs counter, active jobs count, and star rating.
- **Active Ongoing Job Card**: Shows current customer, destination address, and shortcut buttons for Google Maps navigation.

### 3. End-to-End Doorstep Job Workflow
- **Assignment Response**: Accepts or declines job offers via `/api/bookings/assignment-response`.
- **Step 1: Accepted** &rarr; Partner reviews scope, items, and address.
- **Step 2: On The Way** &rarr; Updates lifecycle to `PARTNER_ON_THE_WAY`, sends push notification to customer.
- **Step 3: Reached Location** &rarr; Updates lifecycle to `PARTNER_ARRIVED`.
- **Step 4: 4-Digit Customer OTP Verification** &rarr; Calls `/api/bookings/start-job` to securely verify customer's OTP before starting repair work, transitioning to `JOB_STARTED`.
- **Step 5: Work Completed** &rarr; Marks job completed.
- **Step 6: Payment Collection** &rarr; For Cash/COD jobs, partner collects cash via `/api/bookings/collect-cash`, crediting payout directly to their wallet.

### 4. Partner Wallet & Payouts
- **Live Wallet Balance**: Direct sync with `/api/partners/wallet` and `partnerWallets/{partnerId}`.
- **Statement Ledger**: Full history of job payout credits, platform commission deductions, and adjustments.
- **Direct Bank/UPI Payout Requests**: Requests withdrawals via `/api/partners/payout-request` with real-time balance validation.
- **Cash Remittance Settlement**: Submits UTR / UPI transaction reference and payment receipts via `/api/partners/settlements/submit`.

### 5. Location & Navigation
- **GPS Coordinates**: Updates partner location on Firestore when on duty.
- **One-Touch Maps Navigation**: Automatically opens Google Maps or Apple Maps with full turn-by-turn route to customer doorstep.
- **Distance Calculation**: Haversine distance display in kilometers from partner's base location.

---

## 📱 Project Structure

```
partner-app/
├── assets/                       # App icons, splash screens, adaptive icons
├── src/
│   ├── config/
│   │   ├── env.ts                # Firebase config, backend API endpoints, operating cities
│   │   └── theme.ts              # Repair Series brand colors (#C45508, #7E1926), spacing, typography
│   ├── types/
│   │   ├── partner.ts            # PartnerDoc, VerificationStatus, ShiftStatus
│   │   ├── booking.ts            # BookingDoc, LifecycleStatus, AssignmentStatus
│   │   └── wallet.ts             # WalletData, LedgerEntry, PayoutRequest
│   ├── services/
│   │   ├── firebase.ts           # Firebase client initialization
│   │   ├── apiClient.ts          # Authenticated API client with token bearer
│   │   ├── locationService.ts    # GPS, permissions, distance, Google Maps linking
│   │   └── notificationService.ts# Expo push token registration & notification channels
│   ├── context/
│   │   ├── AuthContext.tsx       # Auth state, online toggle, profile registration
│   │   ├── BookingContext.tsx    # Real-time bookings sync & job action handlers
│   │   └── WalletContext.tsx     # Wallet balance, earnings stats, payout requests
│   ├── components/
│   │   ├── common/               # Button, Card, Badge, Header, StatCard, EmptyState
│   │   ├── booking/              # BookingCard, StatusBadge, OtpInputModal
│   │   └── dashboard/            # AvailabilityToggle, IncomingRequestBanner
│   ├── screens/
│   │   ├── auth/                 # LoginScreen, PartnerRegisterScreen, PendingApprovalScreen
│   │   ├── dashboard/            # DashboardScreen (Home)
│   │   ├── jobs/                 # JobsScreen, JobDetailScreen
│   │   ├── earnings/             # EarningsScreen, RequestPayoutScreen, CashSettlementScreen
│   │   ├── alerts/               # AlertsScreen
│   │   └── profile/              # ProfileScreen, PartnerSupportScreen
│   └── navigation/
│       ├── RootNavigator.tsx     # Authentication & Stack routing
│       └── MainTabNavigator.tsx  # 5-Tab mobile bottom navigation
├── App.tsx                       # Root application entry point
├── app.json                      # Expo configuration (iOS & Android permissions)
├── eas.json                      # Cloud build configuration (APK, AAB, iOS IPA)
└── package.json                  # Dependencies & scripts
```

---

## 🚀 Running the Partner App

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+
- Expo CLI (`npm install -g expo-cli` or `npx expo`)

### 1. Start the Metro Development Server
```bash
cd partner-app
npm start
```

### 2. Run on Devices
- **Android Emulator / Physical Device**:
  ```bash
  npm run android
  ```
- **iOS Simulator / Physical Device**:
  ```bash
  npm run ios
  ```
- **Web Browser (Quick Preview)**:
  ```bash
  npm run web
  ```

---

## 📦 Building Standalone Binaries (EAS Build)

### 1. Build Android APK (for Direct Testing / Sideloading)
```bash
npx eas build -p android --profile preview
```

### 2. Build Android App Bundle (for Google Play Store)
```bash
npx eas build -p android --profile production
```

### 3. Build iOS Application (for TestFlight / App Store)
```bash
npx eas build -p ios --profile production
```
