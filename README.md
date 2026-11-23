# VectorLMS — Collaborative PDF Board & Bilingual MCQ Exam Engine

Enterprise Learning Management System built with **React 19 + TypeScript + Vite + Tailwind CSS**, packaged with both a **Spring Boot 3.5 (Java 25, Maven)** backend and an **Express (Node.js)** dev server.

## Key Capabilities
- **Collaborative PDF Vector Board**: Multi-page `pdfjs-dist` PDF rendering with 60 FPS HTML5 vector annotations, Operational Transformation (OT) collaboration cursors, and instructor Follow-Leader sync.
- **Per-Upload PDF Storage (Disk vs. Cloud)**: Prompts on every PDF upload to **Save on Disk** (local disk storage + computer download) or **Store on Cloud** (cloud bucket with 60-minute HMAC-signed URLs), with live Disk ↔ Cloud migration.
- **Bilingual MCQ Exam Engine (English & Gujarati)**: Excel (`.xlsx`/`.xls`/`.csv`) MCQ import in Gujarati/English, blueprint-based paper generation, timed candidate testing engine, and chapter-level analytics report sheets.
- **Full LMS Suite**: RBAC user/batch administration, differentiated coursework, rubric grading with originality checks, classroom analytics, and media studio.

---

## Running in Spring Tool Suite (STS) / Maven (Java 25, Port `8080`)

### 1. Import into STS
1. **File → Import… → Maven → Existing Maven Projects**
2. Select the repository root folder (containing `pom.xml`) and click **Finish**.

### 2. Build Frontend Assets into `static/`
Run once (or whenever frontend files change):
- Right-click the project in STS → **Run As → Maven build…**
- Set **Goals** to: `clean process-resources`
- Click **Run** *(automatically installs Node/npm if missing via `frontend-maven-plugin`, runs `npm install` + `npm run build`, and copies `dist/` into `target/classes/static/`)*.

### 3. Run Spring Boot
- Right-click `VectorLmsApplication.java` → **Run As → Spring Boot App** *(or start from **Boot Dashboard**)*.
- Open **`http://localhost:8080/`**.

---

## Running with Node.js / Vite Dev Server (Port `3000`)

Requires **Node.js v20.19+ or v22+**:

```bash
npm install
npm run dev
```

Open **`http://localhost:3000/`**.
