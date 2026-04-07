# 🏰 Rani Bhawban Mess Manager

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://your-app.vercel.app)
[![Render Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://your-api.onrender.com)
[![Modern UI](https://img.shields.io/badge/Design-Glassmorphism-blue)](https://reactjs.org)

**Institutional-grade mess management system** designed for high-density student hostels and collaborative living spaces. Featuring a "Financial Terminal" audit log, real-time shared expense splitting, and automated billing.

---

## ✨ Premium Features

- **🛡️ Financial Terminal**: High-fidelity audit stream for all member payments and shared deposits.
- **📊 Adaptive Calculator**: Automated month-end calculations with per-meal rate detection and individual balance adjustments.
- **🍗 Market Scheduling**: Intelligent procurement calendar with priority member assignment.
- **🌓 Adaptive Themes**: Seamless transitions between **High-Contrast Dark** and **Premium Light** modes.
- **📱 Responsive PWA**: Optimized for institutional tablets and standard mobile devices.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Lightning-fast SPA performance |
| **Styling** | Tailwind CSS | Institutional-grade UI components |
| **Logic** | Framer Motion | Fluid, purposeful micro-animations |
| **Backend** | Node.js + Express | Highly scalable REST API |
| **Database** | MongoDB | Document-based financial records |

---

## 🚀 Quick Setup

### 1. Backend Initialization
```bash
cd mess-manager-server
npm install
# Rename .env.example to .env and fill in:
# MONGO_URI, JWT_SECRET, CLIENT_URL
npm start
```

### 2. Frontend Initialization
```bash
cd mess-manager-client
npm install
# Rename .env.example to .env and fill in:
# VITE_API_URL
npm run dev
```

---

## 🌩️ Deployment Guides

### Vercel (Frontend)
1. Push the `mess-manager-client` folder (or root) to GitHub.
2. Connect your repo to **Vercel**.
3. Add `VITE_API_URL` to Environment Variables.
4. **Build Strategy**: `npm run build`, Output Directory: `dist`.

### Render (Backend)
1. Connect your repo to **Render.com**.
2. Create a **Web Service**.
3. Add `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` to Environment Variables.

---

## 📜 License
*Proprietary. All Rights Reserved.*
Designed by **Subham Giri** for Rani Bhawban Mess.
