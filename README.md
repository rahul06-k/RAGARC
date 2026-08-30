# 🎓 CollegeAI — Full-Stack College Information Assistant (RAG Platform)

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-FF6B6B.svg)](https://www.trychroma.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, full-stack AI platform that uses **Retrieval-Augmented Generation (RAG)** to provide grounded, hallucination-free answers to student questions using authoritative college PDFs, DOCX, and TXT documents with exact page-level citations.

---

## 🏛️ System Architecture

```
College Documents (PDF / DOCX / TXT)
       ↓
Text Extraction & Cleaning (PyMuPDF, python-docx)
       ↓
Metadata-Preserving Token Chunking (500–800 tokens, 50–150 overlap)
       ↓
Numerical Vector Embeddings (Sentence Transformers / Gemini / OpenAI)
       ↓
ChromaDB Vector Store (Cosine Similarity Search)
       ↓
Student Query → Top-K Semantic Retrieval & Lexical Re-ranking
       ↓
Authoritative Grounded Prompt Injection (Anti-Hallucination Guardrails)
       ↓
LLM Generation (Google Gemini / OpenAI / Extractive Fallback)
       ↓
Student Answer with Document Name & Page Number Citation Cards
```

---

## ✨ Core Features

1. **Role-Based Access Control (RBAC)**:
   - **Student**: Ask natural-language questions, receive grounded answers with page source cards, provide ratings/feedback, manage conversation history.
   - **Admin**: Full document lifecycle management (upload, validate, reprocess, categorize, version, toggle status, delete with vector cleanup), system analytics, and user role management.
2. **Document Ingestion Pipeline**:
   - Supports **PDF**, **DOCX**, and **TXT** files up to 25MB.
   - Preserves exact page numbers for every chunk for verifiable student citations.
   - Exposes clear processing states: `PENDING` ➔ `PROCESSING` ➔ `COMPLETED` / `FAILED`.
3. **High-Performance Vector Pipeline**:
   - Built on persistent **ChromaDB** with cosine distance indexing.
   - Supports metadata filtering (by category, department, version, and active status).
   - Dynamic 2-stage retrieval with Term-Overlap & Semantic Re-ranking.
4. **Anti-Hallucination Guardrails & Safe Refusals**:
   - The LLM is strictly constrained to the retrieved context.
   - When answers are not present in official documents, the system issues a safe refusal rather than guessing.
5. **Modern, Responsive Web UI**:
   - Built with React 18, Vite, Tailwind CSS, Lucide icons, and modern glassmorphism design.

---

## 🚀 Quick Start — Local Setup Guide

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Python 3.10+** (Tested on Python 3.11 / 3.12 / 3.13)
- **Node.js 18+** & **npm 9+**
- Git

---

### Step 1: Clone or Navigate to the Repository
```bash
cd "c:\Users\kamal\OneDrive\Desktop\RAG ARC2"
```

---

### Step 2: Backend Setup & Database Seeding

1. Open a terminal in the `server/` directory:
   ```bash
   cd server
   ```

2. (Optional but recommended) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your `.env` file (A pre-configured template is already in `server/.env`):
   ```bash
   # Copy example if not present
   cp .env.example .env
   ```
   > 💡 **LLM Provider Note**:
   > - You can optionally add your `GEMINI_API_KEY` or `OPENAI_API_KEY` in `server/.env`.
   > - If no API key is provided, the platform automatically utilizes its built-in **Extractive Local RAG Engine**, ensuring 100% functionality offline without external API costs!

5. Run the Database Seeder:
   ```bash
   python seed.py
   ```
   *This seeds the default admin and student accounts, and automatically ingests 4 comprehensive sample college documents (Admissions, Hostel, Exams, and Placement policies).*

6. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The backend will be running at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).*

---

### Step 3: Frontend Setup & Execution

1. Open a new terminal in the `client/` directory:
   ```bash
   cd client
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be running at: `http://localhost:5173`.*

---

## 🔑 Pre-Configured Demo Accounts

You can immediately sign in using either account, or click the **"Quick One-Click Demo Credentials"** buttons on the login page:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@college.edu` | `Admin@123` | Upload & reprocess documents, view RAG analytics, manage user roles |
| **Student** | `student@college.edu` | `Student@123` | Ask college questions, inspect page citations, submit feedback |

---

## 🧪 Testing the RAG Pipeline (Verification Scenarios)

Once running, try asking the following questions in the student chat (`/chat`):

| Scenario | Sample Question | Expected Behavior |
| :--- | :--- | :--- |
| **Known Question 1** | *"What are the hostel room rent options and mess fees?"* | Returns exact room rates (₹45,000 triple / ₹75,000 single AC) and ₹42,000 mess fee with **Hostel_Fee_Structure_2026.txt (Page 1)** citation card. |
| **Known Question 2** | *"What is the minimum attendance required for semester exams?"* | Returns **75% minimum attendance rule** with condonation rules and cites **Examination_and_Grading_Rules.txt**. |
| **Follow-up Question** | *"What happens if attendance is below 65%?"* | Retains previous academic context and clarifies de-registration / Grade 'F'. |
| **Placement Rules** | *"Can a student with a standard job offer apply for Super Dream companies?"* | Explains the Dream vs Super Dream (above ₹15 LPA) rules cited from **Campus_Placement_Policy_2026.txt**. |
| **Unknown Question** | *"What is the fee for the interstellar aerospace course in year 2040?"* | Safely responds that the information is unavailable in the college knowledge base without hallucinating. |

---

## 🔌 API Reference Endpoints

| Category | Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Diagnostic status of DB, ChromaDB, and LLM | Public |
| **Auth** | `POST` | `/api/auth/register` | Student/Admin registration | Public |
| **Auth** | `POST` | `/api/auth/login` | Obtain JWT bearer token | Public |
| **Auth** | `GET` | `/api/auth/me` | Current profile & role | Student/Admin |
| **Chat** | `POST` | `/api/chat` | Submit question to RAG pipeline | Student/Admin |
| **Chat** | `GET` | `/api/chat/sessions` | List user conversation history | Student/Admin |
| **Chat** | `GET` | `/api/chat/sessions/{id}`| Full messages & source citations | Student/Admin |
| **Chat** | `DELETE`| `/api/chat/sessions/{id}`| Delete conversation | Student/Admin |
| **Chat** | `POST` | `/api/chat/feedback` | Rate response (thumbs up/down) | Student/Admin |
| **Docs** | `GET` | `/api/documents` | List documents with filters | Student/Admin |
| **Docs** | `POST` | `/api/documents/upload` | Upload & ingest document | **Admin Only** |
| **Docs** | `POST` | `/api/documents/{id}/reprocess`| Re-extract & re-embed | **Admin Only** |
| **Docs** | `DELETE`| `/api/documents/{id}`| Purge document & Chroma vectors | **Admin Only** |
| **Docs** | `GET` | `/api/documents/{id}/source` | View/download original file | Student/Admin |
| **Admin**| `GET` | `/api/admin/analytics` | System metrics & query logs | **Admin Only** |
| **Admin**| `GET` | `/api/admin/users` | List users & activity | **Admin Only** |
| **Admin**| `PUT` | `/api/admin/users/{id}/role` | Promote/demote user role | **Admin Only** |

---

## 🧪 Running Automated Unit & Integration Tests

A comprehensive test suite covering **TC01 to TC12** (Registration, Auth, Document Ingestion, ChromaDB vector indexing, Known Questions, Unknown Question Refusal, Follow-ups, RBAC security, Deletion, and Health) is included.

To run the automated tests:
```bash
# From workspace root:
pytest tests/test_rag_pipeline.py -v
```

---

## 🐳 Docker Deployment (Optional)

To spin up the entire application stack (PostgreSQL + FastAPI + ChromaDB + React Nginx) using Docker Compose:

```bash
docker-compose up --build
```

- Frontend: `http://localhost` or `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## 📁 Repository Structure

```
.
├── client/                     # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # AppShell, ChatWindow, MessageBubble, SourceCard, DocumentTable, etc.
│   │   ├── pages/              # Home, Login, Register, Chat, History, Profile, Settings, Admin Portal
│   │   ├── services/           # Axios client & typed API services
│   │   ├── store/              # AuthContext & global state
│   │   └── styles/             # Tailwind CSS & Glassmorphism design tokens
│   ├── package.json
│   └── vite.config.js
├── server/                     # FastAPI + SQLAlchemy + ChromaDB Backend
│   ├── app/
│   │   ├── api/                # auth, chat, documents, admin, health routes
│   │   ├── config/             # Pydantic Settings
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── rag/                # Loaders, Chunker, Embeddings, VectorStore, Retriever, Prompts, Generator
│   │   ├── services/           # Business logic & ingestion orchestration
│   │   ├── vector/             # ChromaDB client manager
│   │   └── main.py             # FastAPI entrypoint
│   ├── requirements.txt
│   ├── seed.py                 # Initial Admin & Sample Document seeder
│   └── .env.example
├── sample_documents/           # Sample Admissions, Hostel, Exams, and Placement documents
├── tests/                      # Automated test suite (TC01 - TC12)
├── docker-compose.yml          # Containerized deployment
├── speccs.md                   # Single source of truth project specification
└── README.md                   # Setup guide and documentation
```

---

## 🛡️ Security & Compliance
- **Passlib & Bcrypt**: Salted password hashing prevents plaintext exposure.
- **JWT Authentication**: Expiring bearer tokens with HMAC-SHA256 signature verification.
- **RBAC Guardrails**: Admin endpoints strictly verify user roles.
- **Vector Purge**: Document deletion automatically purges all corresponding embeddings in ChromaDB to prevent orphaned index entries.
