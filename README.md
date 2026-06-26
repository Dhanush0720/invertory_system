# 🏛️ College Estate Manager & Nirvahana AI — Premium Inventory System

A next-generation, AI-powered full-stack web application for managing college inventory and hostel mess operations with autonomous tracking, predictive forecasting, and role-based access control.

---

## 🌟 Key Features

### 🧠 Nirvahana AI Integration
- **Autonomous Agent**: Scans inventory continuously in the background to detect stockouts, low stock, and unusual consumption patterns.
- **Financial Forecasting**: AI predicts 30-day budget consumption based on historical velocity.
- **Smart Alerts**: Dashboard alerts with one-click "Approve Action" that auto-drafts purchase order emails to vendors.
- **Mess Demand Forecasting**: Menu-driven ingredient demand calculator with shortage detection and purchase order generation.
- **Automated WhatsApp Notifications**: Critical stock anomalies are instantly pushed to the Estate Manager via WhatsApp.
- **AI Invoice Scanning (Vision)**: Upload a photo of a vendor invoice and let AI automatically extract the Item Name, Quantity, Price, and Vendor details.
- **Ask Nirvahana Chatbot**: Natural language Q&A — ask about stock levels, department usage, inventory valuation, and more.

### 📊 Advanced Dashboard & Analytics
- **Dynamic Recharts**: Interactive Pie and Bar charts with drill-down capabilities by Category and Department.
- **Budget Tracking**: Department-wise consumption vs. allocated budget progress bars.
- **Live Stock Bar**: Visual indicators (Green/Yellow/Red) showing exact remaining stock levels against total purchased.
- **Mess Snapshot**: At-a-glance mess stats (expiring items, low stock, today's menu) on the main dashboard.

### 📦 Comprehensive Inventory Management
- **QR Code System**: Auto-generates QR codes for every item. Includes a built-in QR Scanner for lightning-fast distributions.
- **Bulk Import/Export**: Import thousands of records via Excel (`.xlsx`), or generate styled PDF Reports with one click.
- **Master Data**: Dedicated UI to manage Vendors, Departments, and Particulars.

### 🍽️ Hostel Mess Management (NEW)
- **Stock Catalog**: Full CRUD for groceries, vegetables, dairy, spices with category filtering, expiry tracking, and stock status badges.
- **Daily Consumption Logger**: Log meal-wise ingredient usage and spoilage with UOM-aware quantity inputs.
- **Weekly Menu Planner**: 7-day visual menu grid with today-highlighting and inline editing.
- **AI-Powered Demand Forecast**: Calculate weekly ingredient needs based on student count and menu plan.
- **Purchase Order Generator**: Auto-generate professional PDF purchase orders from forecast shortages.
- **Export Reports**: Download mess stock data as PDF or Excel files.
- **Smart Alerts**: Auto-generated Nirvahana alerts for expiring perishables, low stock, and out-of-stock mess items.

### 🎨 Premium UI/UX
- **Dark & Light Mode**: Full theme switching with a Linear.app-inspired design system.
- **Collapsible Sidebar**: Expand/collapse navigation for maximum workspace.
- **Micro-Animations**: Fade-ins, hover lifts, smooth transitions, and skeleton loaders.
- **Responsive Design**: Optimized for desktop, tablet, and mobile screens.
- **Glassmorphism**: Modern card designs with subtle transparency and depth effects.

### 🔐 Security & Access Control
- **Role-Based Access**: 
  - **Admin**: Full access (Manage users, settings, and master data).
  - **Estate Manager (Staff)**: Handle daily inventory tasks, view AI insights.
  - **Viewer**: Read-only dashboard access.
- **Demo Mode**: Instant guest access with localStorage-powered mock database — no backend needed.
- **Rate Limiting & Security**: Helmet, express-mongo-sanitize, and rate-limiting to protect API routes.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Local or Atlas URI)

### Step 1 — Setup Backend
```bash
cd backend

# Copy environment file and fill in your keys (Gemini API, WhatsApp API, MongoDB URI)
cp .env.example .env

# Install dependencies
npm install

# Start the backend server
npm run dev
```

### Step 2 — Setup Frontend
Open a **new terminal window**:
```bash
cd frontend

# Install dependencies
npm install

# Start the React app
npm start
```
Browser will open at **http://localhost:3000**

### Quick Demo (No Backend Needed)
Click **"✨ Explore Guest Demo"** on the login page to instantly explore the full system with simulated data.

---

## 🌐 Deployment (Production)

This project is optimized for deployment on modern platforms:

- **Frontend (Vercel)**: Automatically configured with `vercel.json` for React Router SPA fallbacks.
- **Backend (Render / Railway)**: Ready to run via `npm start`. Ensure `TRUST_PROXY=true` is set in your environment variables.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router, Recharts, HTML5-QRCode, jsPDF, xlsx |
| **Styling** | Custom Premium Vanilla CSS (Glassmorphism, Dark/Light Themes) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **AI Integration**| Google Generative AI (Gemini Flash) |
| **Auth & Security**| JWT, bcryptjs, Helmet, Express Rate Limit |
| **Performance** | Lazy loading, dynamic imports, code splitting |

---

## 📊 Stock Formula

```
Remaining Stock = Total Quantity Purchased - Total Quantity Distributed
```

Each item visually indicates its health:
- 🟢 **In Stock** — plenty available
- 🟡 **Low Stock** — 5 or fewer units remaining
- 🔴 **Out of Stock** — 0 units remaining

---

## 📁 Project Structure

```
college__inventory/
├── backend/
│   └── src/
│       ├── models/         # Mongoose schemas (User, Item, Distribution, MessItem, MessMenu, etc.)
│       ├── routes/         # Express API routes (auth, items, distributions, mess, etc.)
│       └── server.js       # Entry point
├── frontend/
│   └── src/
│       ├── api/            # API client layer (index.js) + Mock data (mockData.js)
│       ├── components/     # Layout, SmartAlerts, AskJarvis
│       ├── context/        # AuthContext (JWT + Demo mode)
│       ├── pages/          # Dashboard, Inventory, Distributions, Mess, Users, Master, Audit
│       └── index.css       # Full design system
└── README.md
```

---

## 📝 License
Proprietary / Internal College Use Only.
