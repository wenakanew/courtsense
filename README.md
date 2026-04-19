# ⚖️ CourtSense — AI Legal Aid for Everyday People

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v11-orange.svg)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Pro-blue.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CourtSense** is an incredibly robust, deeply integrated AI legal assistant designed to level the playing field for everyday people who cannot afford expensive attorneys. It instantly translates dense legalese into 5th-grade English, flags dangerous clauses, alerts users to their regional rights, and offers a premium, context-aware realtime Voice AI.

<br>

<p align="center">
  <img src="public/favicon.ico" alt="CourtSense Logo" width="120" />
</p>

---

## 🚀 The Problem

When a normal person receives a court summons, an eviction notice, an employment contract, or a predatory demand letter, they are entirely overwhelmed. Legalese is intimidating by design. Without thousands of dollars for a retainer, the average individual has absolutely no idea what their rights are, what hidden risks exist in the document, or what their immediate next steps should be.

## 💡 Our Solution

CourtSense completely democratizes basic legal comprehension. Users simply drag and drop any legal document into the platform. 

The application utilizes **Google's Gemini 2.5 Pro** model to instantly rip through the document, performing a hyper-accurate structural breakdown of the text. It then outputs a comprehensive, highly-scannable dashboard displaying:
- A plain English summary.
- The document's **Urgency Level** and exact Key Facts.
- **Hidden Risks** (with exact quote citations and severity ratings).
- **Your Rights** within the context of your specific geographical jurisdiction constraint.

For follow-up questions, CourtSense provides a **Multimodal Live Audio WebRtc Voice Agent** powered natively by Gemini. Users can quite literally speak directly to their AI lawyer in real-time to ask follow up questions about the contract.

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 / Vite
- **Styling**: Tailwind CSS, PostCSS, Lucide Icons, Framer Motion
- **Database / Auth**: Google Firebase (Firestore Database, Google OAuth Auth)
- **AI Core**: `@google/genai` (Gemini 2.5 Pro for Text Analysis)
- **Live Voice AI**: Multimodal Live Audio Websockets (`models/gemini-2.5-flash-native-audio-latest`) utilizing custom Javascript `AudioWorkletNode` threading.

---

## 🧠 Deep Gemini API Integration (Hackathon Breakdown)

This project isn't just a basic chat wrapper. We utilized the absolute cutting-edge, experimental capabilities of the Google AI Studio ecosystem perfectly suited for strict vertical applications:

1. **Extreme Context JSON Enforcement**: The foundational `gemini-2.5-pro` model is locked into an extraordinarily strict `responseMimeType: "application/json"` schema, forcing the AI to behave highly deterministically to formulate perfectly mapped "Risks" and "Rights" arrays that render our glassmorphism UI dynamically.
2. **Context-Aware RAG Chat**: The traditional text dashboard intercepts system jurisdictions from your Firebase account settings, implicitly injecting `Jurisdiction: [Country]` constraints silently into the system parameters behind the scenes before hitting Gemini.
3. **Multimodal Live API**: We fully implemented custom WebRtc Audio encoding via `AudioWorkletNode` in the browser to stream `pcm16` 16kHz audio chunks directly over WebSockets to the `v1alpha` BidiGenerateContent endpoint. The STS (Speech-to-Speech) bot contextually adopts an elite attorney persona while speaking back to the user seamlessly.

---

## ⚙️ Local Development & Setup

### 1. Requirements
- Node.js (v18+)
- A Firebase Project (with Firestore and Google Sign-In enabled)
- A Google API Key (`AIzaSy...`)

### 2. Installation

Clone the repository and install the Vite dependencies:
```bash
git clone https://github.com/yourusername/courtsense.git
cd courtsense
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the project to match the `.env.example` schema:

```env
# Google Gemini Engine
VITE_GEMINI_API_KEY="AIzaSy...your_gemini_key_here..."

# Firebase Initialization
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app"
```

> **Security Note:** Make sure you whitelist your localhost/production domain in your Google/Firebase settings!

### 4. Firestore Security Rules
Before running, you must deploy the exact rules to your Firebase Database to lock down user data privacy:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Run the Application
Start the blazing fast Vite development server:
```bash
npm run dev
```
