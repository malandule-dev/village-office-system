# 🏘 Village Office Management System

A full-stack web application for digitizing traditional land and village administration.

## Modules
| Module | Description |
|--------|-------------|
| 🗺 **GIS & Navigation** | Geocoded stands with Google Maps integration |
| 📋 **Land Acquisition** | Public booking portal and demand dashboard |
| 💰 **Finance & Title Deeds** | Payments, arrears reporting, PDF generation |
| 📢 **Chief's Portal** | Announcements with SMS/WhatsApp blast |

---

## ⚡ Quick Start (5 Minutes)

### 1. Clone & Install

```bash
git clone <your-repo-url> village-office
cd village-office
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the template
cp .env.example server/.env
```

Open `server/.env` and set your **MongoDB Atlas URI**:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/village-office
```

> **Get a free MongoDB Atlas cluster at:** https://cloud.mongodb.com

### 3. Seed the Database

```bash
cd server
node seed.js
```

This creates:
- ✅ Admin account: `admin@villageoffice.gov.za` / `Admin@2024`
- ✅ 6 sample stands with GPS coordinates
- ✅ 3 sample announcements

### 4. Run the System

```bash
# From the root directory — runs both frontend and backend
cd ..
npm run dev
```

| Service | URL |
|---------|-----|
| 🖥 Dashboard | http://localhost:5173 |
| 🔗 Public Booking Portal | http://localhost:5173/apply |
| 🛠 API Server | http://localhost:5000/api |
| 🏥 Health Check | http://localhost:5000/api/health |

---

## 🔑 Adding Optional API Keys

### Google Maps (GIS Navigation)

1. Get a key from https://console.cloud.google.com (enable "Maps JavaScript API")
2. Add to `server/.env`:
   ```
   GOOGLE_MAPS_API_KEY=AIza...
   ```
3. Add to `client/.env` (create this file):
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIza...
   ```
4. Restart — map links will now open with full navigation

### Twilio SMS & WhatsApp

1. Sign up at https://console.twilio.com
2. Add to `server/.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxx
   TWILIO_AUTH_TOKEN=xxx
   TWILIO_PHONE_NUMBER=+27XXXXXXXXX
   ```
3. For WhatsApp, use the Twilio Sandbox or a WhatsApp Business number
4. Restart — blast buttons on announcements will send real messages

---

## 📁 Project Structure

```
village-office/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx        # Analytics overview
│       │   ├── StandsPage.jsx       # GIS module
│       │   ├── BookingsPage.jsx     # Land acquisition
│       │   ├── FinancePage.jsx      # Payments & title deeds
│       │   ├── AnnouncementsPage.jsx # Chief's portal
│       │   └── PublicBookingPage.jsx # Public form (no login)
│       └── components/
│           └── Layout.jsx           # Sidebar navigation
│
└── server/                    # Node.js + Express API
    ├── models/
    │   ├── User.js, Stand.js, Booking.js, Payment.js, Announcement.js
    ├── routes/
    │   ├── auth.js, stands.js, bookings.js, payments.js,
    │   │   announcements.js, dashboard.js, reports.js
    ├── utils/
    │   └── messaging.js             # Twilio SMS/WhatsApp
    ├── index.js                     # Server entry point
    └── seed.js                      # Database seeder
```

---

## 🧪 ISTQB — Boundary Value Analysis (Arrears Testing)

The arrears flag uses Boundary Value Analysis per ISTQB standards:

| Test Date | Expected Result | Note |
|-----------|----------------|------|
| 29th of month | ✅ No flag | One day before deadline |
| 30th of month | ✅ No flag | Due date — payment still on time |
| 1st of next month | 🚨 ARREARS FLAGGED | Day after — must trigger |

Test the arrears endpoint: `GET /api/reports/arrears`

---

## 🏛 CSD / BizPortal Registration

This system qualifies as a **Proprietary Software Asset** for CSD registration.  
Register each module separately to strengthen rural development tender bids.

---

## 👤 Default Roles

| Role | Access |
|------|--------|
| `admin` | Full system access |
| `chief` | Announcements (auto-publish) + read all |
| `trustee` | Announcements (pending approval) + read |
| `staff` | Read + record payments + manage bookings |
| `resident` | Read-only (public portal only) |

---

## 📡 API Reference

```
POST   /api/auth/register      Create user
POST   /api/auth/login         Login
GET    /api/auth/me            Current user

GET    /api/stands             List stands (search, filter, paginate)
POST   /api/stands             Create stand (admin)
PATCH  /api/stands/:id         Update stand (admin)
GET    /api/stands/map         All geocoded stands (for map)

GET    /api/bookings           List applications (admin)
POST   /api/bookings           Submit application (public, no auth)
GET    /api/bookings/stats     Demand analytics
PATCH  /api/bookings/:id/status Update application status

GET    /api/payments           List payments
POST   /api/payments           Record payment (admin)
GET    /api/payments/arrears   Arrears report
GET    /api/payments/:id/receipt  PDF receipt
GET    /api/payments/title-deed/:standId  PDF title deed

GET    /api/announcements      Public feed
POST   /api/announcements      Create announcement
POST   /api/announcements/:id/publish  Approve & publish
POST   /api/announcements/:id/blast    SMS/WhatsApp blast

GET    /api/dashboard          Aggregated stats
GET    /api/reports/arrears    Missed payments report
GET    /api/health             Server health check
```
