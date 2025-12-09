# DomainBags - Premium Domain Portfolio 💎

**DomainBags** is a high-performance, modern domain portfolio application built for professional domain investors. It features a stunning "Glassmorphism" UI, an integrated Admin Dashboard with AI capabilities, and a secure backend powered by Firebase.

## ✨ Features

### 🎨 Frontend Experience
*   **Premium Aesthetic**: Dark mode design with neon accents and glass-panel effects.
*   **Dynamic Portfolio**: Paginated grid view of domains with category filtering.
*   **Trust & Credibility**: Dedicated sections for "DomainBags Guarantee" and verified Seller Profile.
*   **Smart Buy Options**: "Buy Through" dropdown redirecting to major trusted registrars (GoDaddy, Namecheap, Dan, Escrow).

### 🛠️ Admin Dashboard
*   **Secure Access**: Protected via Google Authentication (Firebase Auth).
*   **AI Integration**: Generate professional logo concepts/previews for domains using **Google Gemini AI**.
*   **Bulk Management**: Upload hundreds of domains via CSV `(Domain, Price, Category)` with auto-validation.
*   **Portfolio Control**: Add, Edit, Delete domains and manage categories dynamically.
*   **Settings**: Securely manage API keys directly from the dashboard.

## 🚀 \Tech Stack

*   **Frontend**: React.js (Vite)
*   **Styling**: Vanilla CSS (Variables, Flexbox/Grid, Glassmorphism)
*   **One-Click Auth**: Firebase Authentication
*   **Database**: Cloud Firestore (NoSQL)
*   **AI**: Google Gemini API (`gemini-2.5-flash-image`)
*   **Hosting Ready**: Vercel / Netlify

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/DjarallahBrahim/nameiro.git
cd nameiro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory. You need your Firebase configuration keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_id
```

### 4. Run Locally
```bash
npm run dev
```

## 📦 Deployment

### Vercel / Netlify
1.  Connect your GitHub repository.
2.  Add the **Environment Variables** from your `.env` file into the hosting platform's settings.
3.  Deploy! The build command is `npm run build` and output directory is `dist`.

## 👨‍💻 Author

**Djarallah Brahim**
*   Computer Engineer & Domain Investor
*   Based in France 🇫🇷

---
*Built with React & Fire* 🔥
