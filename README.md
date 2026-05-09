# Tutr — AI-Powered Study Partner

A full-stack AI tutoring application that simulates a live video call with a personal tutor. Upload your study materials, select your course, and get face-to-face help — completely free, powered by Groq and local embeddings.

## Features

- **Video Call Interface** — Zoom-like experience with an animated AI tutor avatar
- **RAG-Powered Responses** — Upload PDFs, slides, notes, and code; the tutor references your materials
- **Voice Interaction** — Speak naturally using browser speech recognition; hear responses via browser TTS
- **Screen Sharing** — Share your screen to point at problems and work through solutions together
- **Webcam Support** — Enable your camera for a true face-to-face feel
- **Course Context** — Select from a catalog of university courses to get targeted help
- **Streaming Responses** — Real-time streamed replies with a typing indicator
- **Animated Avatar** — Canvas-rendered tutor with blinking, breathing, lip-sync, and expressions
- **100% Free** — Uses Groq's free API tier + local embeddings + browser TTS

## Architecture

```
├── backend/            FastAPI + Python
│   ├── main.py         Server entrypoint
│   ├── config.py       Settings & env vars
│   ├── rag/
│   │   ├── parser.py       File parsing (PDF, DOCX, PPTX, text, code)
│   │   ├── embeddings.py   ChromaDB vector store (local embeddings, no API needed)
│   │   └── retriever.py    RAG chain with Groq LLM + tutor system prompt
│   └── routes/
│       ├── chat.py     REST + WebSocket chat endpoints
│       ├── upload.py   File upload & indexing
│       ├── courses.py  Course catalog
│       └── tts.py      (stub — TTS handled by browser)
│
└── frontend/           React + Vite + TypeScript + Tailwind
    └── src/
        ├── components/
        │   ├── CallInterface.tsx   Main video call layout
        │   ├── TutorAvatar.tsx     Animated canvas avatar
        │   ├── UserVideo.tsx       Webcam & screen share display
        │   ├── Controls.tsx        Call control bar
        │   ├── ChatPanel.tsx       Text chat & transcript
        │   ├── Sidebar.tsx         Materials & settings panel
        │   ├── FileUpload.tsx      Drag-and-drop file upload
        │   ├── CourseSelector.tsx   Course picker
        │   └── SetupScreen.tsx     Pre-call setup wizard
        ├── hooks/
        │   ├── useWebcam.ts
        │   ├── useScreenShare.ts
        │   ├── useSpeechRecognition.ts
        │   └── useAudioPlayer.ts    (browser SpeechSynthesis)
        └── services/
            └── api.ts              API client
```

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Groq API Key** (free at [console.groq.com](https://console.groq.com))

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env from the example
cp .env.example .env
# Edit .env and add your free Groq API key
```

### 2. Frontend

```bash
cd frontend
npm install
```

## Running

Start both servers (in separate terminals):

```bash
# Terminal 1 — Backend (port 8000)
cd backend
source venv/bin/activate
python main.py

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

## Usage

1. **Upload Materials** — Drag and drop lecture slides, notes, textbooks, or code files
2. **Select Course** — Pick your university course for tailored assistance
3. **Start Session** — Click "Start Session" to join the call with Alex
4. **Talk or Type** — Use voice (click mic) or type in the chat panel
5. **Share Screen** — Click the screen share button to show your work
6. **Enable Camera** — Turn on your webcam for a full video call experience

## Supported File Types

| Type | Extensions |
|------|-----------|
| Documents | `.pdf`, `.docx`, `.pptx`, `.txt`, `.md` |
| Code | `.py`, `.js`, `.ts`, `.java`, `.c`, `.cpp`, `.h` |
| Data | `.csv`, `.json` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| LLM | Llama 3.3 70B via Groq (free tier) |
| Embeddings | ChromaDB built-in (all-MiniLM-L6-v2, runs locally) |
| Vector DB | ChromaDB |
| Document Parsing | PyPDF, python-docx, python-pptx |
| Voice Input | Web Speech API (browser-native STT) |
| Voice Output | Browser SpeechSynthesis API (free TTS) |
| Video | WebRTC getUserMedia & getDisplayMedia |
