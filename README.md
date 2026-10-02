# Project LOOP — AI Customer-Feedback Intelligence Platform

A full-stack corporate-grade web application developed as part of the Zidio Web Development Internship. LOOP ingests customer feedback, uses AI to classify it, clusters it into themes, surfaces trending issues, and answers plain-English questions grounded in real feedback data.

**🌐 Live Demo:** [https://feedback-loop-zidio.vercel.app](https://feedback-loop-zidio.vercel.app)

---

## 🛠️ Tech Stack
* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Recharts
* **Backend:** Next.js API Routes, TypeScript
* **Database & ORM:** PostgreSQL (Supabase), Prisma ORM
* **Authentication:** NextAuth.js (Role-Based Access Control)
* **AI Integration:** Google Gemini AI (for classification and grounded Q&A)

---

## 🏗️ Architecture Summary
Project LOOP follows a three-tier architecture:
1. **Client (Browser):** Renders the UI using React Server/Client Components and calls local API route handlers.
2. **API Layer (Route Handlers):** Authenticates sessions, enforces RBAC (Admin, Analyst, Viewer), and ensures every database query is strictly scoped to the active workspace to guarantee tenant isolation.
3. **Data & External APIs:** Prisma reads/writes to PostgreSQL. For AI features like 'Ask LOOP', the backend retrieves relevant feedback context first, then calls the AI provider server-side to generate a grounded, structured JSON response.

---

## 🚀 Setup Instructions

**1. Install dependencies:**
```bash
npm install
```

**2. Database setup (Prisma):**
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

**3. Run locally:**
```bash
npm run dev
```

---

## 🔐 Seed Credentials (Demo Access)
Use these credentials to log in and test Role-Based Access Control (RBAC):

| Role | Email | Password |
| :--- | :--- | :--- |
| **ADMIN** | admin@acme-insights.com | password123 |
| **ANALYST** | analyst@acme-insights.com | password123 |
| **VIEWER** | viewer@acme-insights.com | password123 |

---

## ⚙️ Environment Variables
Ensure your `.env` file contains the following:
```text
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=
```

<img width="1596" height="817" alt="1 Screenshot" src="https://github.com/user-attachments/assets/5c1963a3-2ae1-4159-b916-588e7e19e975" />
<img width="1595" height="815" alt="2 Screenshot" src="https://github.com/user-attachments/assets/52ae0735-0ddc-44f4-bd07-3248c7b0eb4a" />
<img width="1599" height="815" alt="3 Screenshot" src="https://github.com/user-attachments/assets/0d5e5413-f678-4164-be5a-ab3d092bb217" />
<img width="1583" height="818" alt="4 Screenshot" src="https://github.com/user-attachments/assets/bd95a5b7-565d-4c36-8f54-d8f53b394519" />
<img width="1586" height="817" alt="5 Screenshot" src="https://github.com/user-attachments/assets/423773f1-15b9-4462-80de-ed90e002f4ad" />

