# CyberSentinel OS

CyberSentinel OS is a real-time, high-performance cyber threat intelligence platform. Built with Next.js, it aggregates live threat feeds, analyzes malicious indicators using multiple security APIs (VirusTotal, Google Safe Browsing, spyonweb), and provides a secure messenger for security analysts.

## Features
- **Live Threat Feed**: Aggregates real-time threat intelligence from leading sources.
- **Threat Analytics**: Deep analysis and intelligence scoring of IPs, URLs, and domains.
- **Secure Messenger**: Encrypted, real-time chat with typing indicators and manual decryption features.
- **Progressive Web App (PWA)**: Installable on native mobile devices and desktop.
- **Dark/Light Mode**: Sleek, futuristic UI optimized for analysts.

## Tech Stack
- Frontend: Next.js 15 (App Router), React 19, Tailwind CSS
- Backend: Next.js API Routes, NextAuth.js
- Database: MongoDB (Mongoose)

## Getting Started

First, rename `.env.example` to `.env.local` and add your API keys:
```bash
cp .env.example .env.local
```

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
