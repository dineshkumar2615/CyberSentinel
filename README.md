# 🛡️ CyberSentinel OS
> **A Real-Time, High-Performance Cyber Threat Intelligence Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&style=for-the-badge)](#)
[![React](https://img.shields.io/badge/React-19-blue?logo=react&style=for-the-badge)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&style=for-the-badge)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&style=for-the-badge)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&style=for-the-badge)](#)

CyberSentinel OS is an advanced cybersecurity dashboard built for modern threat hunters and security analysts. It aggregates live threat feeds, analyzes malicious indicators using multiple robust security APIs, and features a seamlessly integrated secure messenger. The platform is engineered with Next.js App Router for blazing-fast performance, real-time telemetry, and a sleek dark theme.

---

## ✨ Core Features

*   🌍 **Live Threat Feed:** Aggregates real-time threat intelligence from leading sources globally.
*   📊 **Threat Analytics:** Deep machine-speed analysis and intelligence scoring of IPs, URLs, and domains.
*   💬 **Secure Messenger:** End-to-end encrypted, real-time chat with typing indicators and manual decryption protocols.
*   🌓 **Dynamic Theming:** Sleek, futuristic dark/light mode UI optimized for analysts working in NOCs/SOCs.
*   🔒 **Endpoint Diagnostics:** Simulated local device heuristic array scanning.

---

## 🛠️ Technology Stack

CyberSentinel OS leverages a cutting-edge modern web stack:

*   **Frontend Data & React:** Next.js 15 (App Router), React 19, TypeScript
*   **Styling & UI:** Tailwind CSS, Framer Motion, Recharts
*   **Backend & Auth:** Next.js Serverless API Routes, NextAuth.js
*   **Database:** MongoDB via Mongoose

---

## 📁 Project Structure

```text
├── app/                  # Next.js App Router (Frontend & API)
│   ├── api/              # Serverless API Routes
│   ├── (auth)/           # Authentication flows (Login/Register)
│   ├── admin/            # Admin Dashboard
│   ├── dashboard/        # Main User Dashboard
│   ├── education/        # Security Library Database
│   ├── globals.css       # Core Tailwind & theme variables
│   └── layout.tsx        # Root layout configuration
├── components/           # Reusable React UI Components
├── context/              # React Context (ThemeProvider, etc.)
├── hooks/                # Custom React Hooks (e.g., useThreats)
├── lib/                  # Core Utilities, DB connection, & API integrations
├── public/               # Static Assets (Images, fonts, etc.)
├── auth.ts               # NextAuth.js Security Configuration
├── middleware.ts         # Edge Route Protection Middleware
├── next.config.ts        # Next.js build config
└── package.json          # Project metadata & dependency definitions
```

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### 1. Clone & Install
Ensure you are in the project root directory, then install the dependencies:
```bash
npm install
```

### 2. Environment Variables
You must configure your API keys. Rename the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the required authentication secrets, MongoDB URI, and your security API keys (VirusTotal, Google Safe Browsing, etc.) in `.env.local`.

### 3. Launch Development Server
Start the Next.js development server:
```bash
npm run dev
```

### 4. Open Application
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤝 Contributing

CyberSentinel OS is under active development. If you wish to contribute, please fork the repository, create a feature branch, and submit a pull request.

> *"Vigilance is the price of security."*
