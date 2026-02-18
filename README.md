# RaniBhawban Mess Manager

A full-stack mess management system built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend).

## Project Structure

```
RaniBhawbanMess/
├── mess-manager-client/   # React + Vite frontend
└── mess-manager-server/   # Node.js + Express + MongoDB backend
```

## Tech Stack

**Frontend**
- React 19, React Router v7
- Vite, TailwindCSS
- Framer Motion, Three.js
- Axios, jsPDF

**Backend**
- Node.js, Express 5
- MongoDB + Mongoose
- JWT Authentication
- bcrypt, Helmet, Rate Limiting

## Getting Started

### Backend
```bash
cd mess-manager-server
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### Frontend
```bash
cd mess-manager-client
cp .env.example .env   # fill in your values
npm install
npm run dev
```

## Features
- 🔐 Role-based access (Admin / Member)
- 🍽️ Meal tracking & management
- 💰 Expense & market request management
- 📊 Monthly reports & calculator
- 🔔 Notifications system
- 🌙 Dark mode
- 📱 Responsive design
