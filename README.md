# Onboarding Analysis Tool

## 📋 Overview

The **Onboarding Analysis Tool** is a web application for matching contractor records between the Cognibox (CBX) database and Hiring Client (HC) submissions. Built with React + FastAPI, it uses a battle-tested, **adaptive fuzzy matching engine** to find matches with precision, provides real-time progress tracking, and generates comprehensive multi-sheet Excel reports categorized by business action.

## ✨ Key Features

### 🔍 **Adaptive Matching Engine**
- **Dynamic thresholds** — matching sensitivity adjusts per-row based on data completeness (company name, address, email availability)
- **Fuzzy string matching** for company names (English/French) using RapidFuzz/FuzzyWuzzy
- **Historical name support** — matches against previous company names stored in CBX
- **Address validation** with postal code comparison and smart empty-address handling
- **Email domain matching** — corporate domains matched at domain level; personal domains (gmail, yahoo, etc.) require exact email match
- **Perfect-match guard** — 100% company name match requires email domain verification to prevent false positives
- **Pre-normalized data caching** — CBX data cleaned once before matching loop for 5-10x speed improvement
- **Pre-compiled regex patterns** for optimal string processing

### ⚡ **Real-Time Monitoring**
- Live progress bar with percentage completion (0–100%)
- Elapsed timer and processed/total record counter
- Color-coded live console with categorized log messages
- Background job processing with async status polling

### 📊 **Comprehensive Reports**
- Excel output with **15 categorized sheets**
- Action-based filtering (onboarding, re-onboarding, follow-up, etc.)
- Match ratio scores (company, address) per row
- Subscription upgrade calculations
- Full metadata preservation from source files

### 🎨 **Modern UI/UX**
- Gradient design with purple/blue theme
- Responsive layout for all screen sizes
- Animated transitions and terminal-style live console
- Dashboard with processing statistics

## 🏗️ Architecture

```
Frontend (React + Vite)          Backend (FastAPI + Python)
┌─────────────────────┐         ┌─────────────────────────┐
│  Upload Interface   │────────▶│  File Upload Handler    │
│  Progress Tracker   │◀────────│  Background Jobs        │
│  Live Console       │◀────────│  Matching Engine        │
│  Download Manager   │◀────────│  Excel Generator        │
└─────────────────────┘         └─────────────────────────┘
         │                                   │
    Port 5173                           Port 8000
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Modern web browser** (Chrome, Firefox, Edge)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/naji-beyrouthy-veriforce/onboarding-analysis-tool.git
cd onboarding-analysis-tool
```

**2. Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

### Running the Application

#### Option 1: Two Terminals

**Terminal 1 — Backend:**
```bash
cd backend
python main.py
```
✅ Backend starts at `http://localhost:8000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend starts at `http://localhost:5173`

Open your browser at `http://localhost:5173`.

#### Option 2: Scripts (Linux/WSL/Mac)

```bash
cd backend && ./start.sh       # Start backend
cd backend && ./restart.sh     # Restart backend
```

## 📖 How to Use

### Step 1: Prepare Your Files

**CBX File (Cognibox Database Export)**
- Format: CSV, XLSX, or XLS
- Required columns (28 total):
  - `id`, `name_fr`, `name_en`, `old_names`
  - `address`, `city`, `state`, `country`, `postal_code`
  - `first_name`, `last_name`, `email`
  - `cbx_expiration_date`, `registration_code`, `suspended`
  - `modules`, `access_modes`, `code`
  - `subscription_price_cad`, `employee_price_cad`
  - `subscription_price_usd`, `employee_price_usd`
  - `hiring_client_names`, `hiring_client_ids`, `hiring_client_qstatus`
  - `parents`, `assessment_level`, `new_product`

**HC File (Hiring Client Submissions)**
- Format: CSV, XLSX, or XLS
- Required columns (41 total):
  - `contractor_name`, `contact_first_name`, `contact_last_name`, `contact_email`
  - `contact_phone`, `contact_language`
  - `address`, `city`, `province_state_iso2`, `country_iso2`, `postal_code`
  - `category`, `description`, `phone`, `extension`, `fax`, `website`, `language`
  - `is_take_over`, `qualification_expiration_date`, `qualification_status`
  - `batch`, `questionnaire_name`, `questionnaire_id`
  - `pricing_group_id`, `pricing_group_code`
  - `hiring_client_name`, `hiring_client_id`
  - `is_association_fee`, `base_subscription_fee`
  - `contact_currency`, `agent_in_charge_id`
  - `take_over_follow-up_date`, `renewal_date`
  - `information_shared`, `contact_timezone`
  - `do_not_match`, `force_cbx_id`, `ambiguous`
  - `contractorcheck_account`, `assessment_level`

### Step 2: Upload and Process

1. Open the application at `http://localhost:5173`
2. Click the **"Upload"** tab
3. Select your **CBX file** (drag & drop or click to browse)
4. Select your **HC file**
5. Click **"Start Matching"**
6. Monitor live progress: bar, timer, counter, and console logs

### Step 3: Download Results

1. Wait for **"Processing Complete!"**
2. Click **"Download Results"**
3. Open the Excel file

### Step 4: Analyze Results

**Output Excel Sheets (15 total):**

| # | Sheet | Description |
|---|-------|-------------|
| 1 | **all** | Complete dataset — all matches and analysis |
| 2 | **onboarding** | New contractors requiring onboarding |
| 3 | **association_fee** | Contractors requiring association fees |
| 4 | **re_onboarding** | Inactive contractors to reactivate |
| 5 | **subscription_upgrade** | Contractors requiring plan upgrades |
| 6 | **ambiguous_onboarding** | Ambiguous matches requiring manual review |
| 7 | **restore_suspended** | Suspended accounts to restore |
| 8 | **activation_link** | Contractors needing activation |
| 9 | **already_qualified** | Contractors already validated |
| 10 | **add_questionnaire** | Active contractors needing questionnaires |
| 11 | **missing_info** | Incomplete submissions |
| 12 | **follow_up_qualification** | Contractors requiring follow-up |
| 13 | **Data to import** | Data formatted for import into CBX |
| 14 | **Existing Contractors** | Matched existing contractor data |
| 15 | **Data for HS** | Data formatted for HubSpot |

**Key Columns in Output:**
- `cbx_id` — Matched Cognibox ID (blank if new)
- `analysis` — Detailed match info with scores
- `ratio_company` — Company name match score (0–100)
- `ratio_address` — Address match score (0–100)
- `contact_match` — Email/contact match (TRUE/FALSE)
- `action` — Recommended business action
- `create_in_cbx` — Whether to create a new record
- `is_subscription_upgrade` — Upgrade required flag
- `match_count` — Number of potential matches found

## 🔧 Matching Algorithm

### Adaptive Threshold Strategy

Matching thresholds are **dynamically calculated per HC row** based on data availability — not fixed globally. This is the core design principle.

| Data Available | Company Threshold | Address Threshold | Strategy |
|----------------|-------------------|-------------------|----------|
| Company + Address + Email | 75% | 85% | Strict dual-signal validation |
| Company + Email (no address) | 60% | 0% | Email compensates for missing address |
| Company + Address (no email) | 65% | 70% | Balanced dual-signal |
| Company Only | 80% | 0% | High bar, single signal |
| Very Incomplete | 40% | 0% | Wide net to avoid missing matches |

**Philosophy**: more data → stricter thresholds (minimize false positives). Less data → lenient thresholds (maximize recall).

### Matching Conditions (Priority Order)

All conditions are **mutually exclusive** (`if/elif` chain — first match wins):

```
1. ratio_company == 100% + email domain match
2. ratio_company ≥ dynamic_threshold + ratio_address ≥ dynamic_threshold  ← PRIMARY
3. ratio_address == 100% + ratio_company ≥ 70%
4. ratio_company ≥ 95% (address ignored)
5. ratio_company ≥ 85% + contact_match + both addresses empty
6. contact_match + ratio_company ≥ 33%
7. exact same email + ratio_company ≥ 20%
```

### Company Name Cleaning Pipeline

Names are pre-normalized before matching (order matters):
1. Lowercase
2. Remove periods and commas
3. Remove parentheses and content inside
4. Strip generic words: `construction`, `ltd`, `inc`, `services`, `solutions`, `llc`, etc.
5. Collapse whitespace

### Email Matching

- **Generic domains** (gmail, yahoo, hotmail, outlook, etc.) → exact full email required
- **Corporate domains** → email domain match is sufficient

### Action Assignment

The `action` field is derived by a decision tree based on `create_in_cbx`, `is_take_over`, CBX registration status (`Active`, `Suspended`, `Non Member`), HC relationship, qualification status, and subscription data. See [`ai_agent_documentation/PROJECT_CONTEXT.md`](ai_agent_documentation/PROJECT_CONTEXT.md) for the full decision tree.

## 🛠️ Development

### Backend Structure

```
backend/
├── main.py                 # Main FastAPI app — all matching logic (~1044 lines)
├── convertTimeZone.py      # Timezone conversion utilities
├── requirements.txt        # Python dependencies
├── uploads/                # Temporary upload storage (auto-cleaned)
├── outputs/                # Generated Excel files
├── data/                   # Current job data files
└── testdata/               # Sample CBX and HC files for testing
```

**Key Dependencies:**
- `fastapi` + `uvicorn` — web framework and ASGI server
- `openpyxl` — Excel file generation
- `rapidfuzz` (preferred) / `fuzzywuzzy` — fuzzy string matching
- `python-Levenshtein` — fast edit-distance computation

### Frontend Structure

```
frontend/
├── src/
│   ├── App.jsx             # Main React component (~768 lines)
│   ├── main.jsx            # React entry point
│   └── index.css           # Tailwind + custom styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

**Key Dependencies:**
- `react` 18 — UI framework
- `lucide-react` — icon library
- `tailwindcss` — CSS framework
- `vite` — build tool

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/match` | Upload files and start matching job |
| `GET` | `/api/jobs/{job_id}` | Get job status and progress |
| `GET` | `/api/jobs/{job_id}/download` | Download completed Excel results |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/health` | Health check |
| `GET` | `/` | Service info and version |

## 📊 Performance

### Processing Times

| Dataset | Expected Time | Memory |
|---------|---------------|--------|
| 100 HC × 1,000 CBX | 5–10 seconds | ~50–100 MB |
| 1,000 HC × 5,000 CBX | 1–2 minutes | ~200–500 MB |
| 10,000 HC × 10,000 CBX | 20–30 minutes | ~1–2 GB |

*Times assume RapidFuzz and pre-normalization are active.*

### Performance Optimizations (v2.1.0)

- **CBX pre-normalization** — company names, addresses, email domains, and ZIP codes computed once and cached at indexes 28–34 of each CBX row. Never recomputed inside the O(N×M) matching loop.
- **Regex pre-compilation** — generic word patterns compiled at startup, reused across all calls (~10× faster than in-loop compilation).
- **RapidFuzz** — C-based fuzzy matching, automatic fallback to fuzzywuzzy if not installed (2–3× faster).
- **Early exit** — country mismatch check skips expensive fuzzy operations immediately.

## 🐛 Troubleshooting

### Backend Issues

**`ModuleNotFoundError: No module named 'fastapi'`**
```bash
cd backend && pip install -r requirements.txt
```

**Port 8000 already in use (Linux/Mac)**
```bash
lsof -i :8000 && kill -9 <PID>
```

**Port 8000 already in use (Windows)**
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Permission denied on shell scripts**
```bash
chmod +x backend/start.sh backend/restart.sh
```

### Frontend Issues

**`ECONNREFUSED` — backend not reachable**
- Confirm backend is running on port 8000
- Verify CORS is enabled in `backend/main.py`

**Files not uploading**
- Confirm file format is CSV, XLSX, or XLS
- Check browser console for errors

**Progress stuck at 0%**
- Check backend terminal for processing errors
- Verify file headers match expected format

### Common Data Issues

**No matches found**
- Check file encoding (UTF-8 recommended)
- Verify column headers match expected names exactly
- Inspect company name normalization output in logs

**Too many false matches**
- Review data for missing addresses/emails (low-data rows use lenient thresholds by design)
- Check for overly generic company names that survive the cleaning pipeline

**Incorrect actions assigned**
- Check `registration_code` values (Active, Suspended, Non Member)
- Verify `is_take_over`, `ambiguous`, and HC relationship fields

## 🤖 AI Agent Documentation

This project maintains a structured **AI Agent Memory System** to preserve critical business logic and ensure safe AI-assisted development.

### Key Files

Located in the **`ai_agent_documentation/`** folder:

| File | Purpose |
|------|---------|
| [PROJECT_CONTEXT.md](ai_agent_documentation/PROJECT_CONTEXT.md) | Complete knowledge base: architecture, matching logic, data structures, business rules, action decision tree |
| [DEVELOPMENT_GUIDELINES.md](ai_agent_documentation/DEVELOPMENT_GUIDELINES.md) | Golden rules, safe coding patterns, change management, testing checklists, debugging guide |

### Why It Matters

The matching algorithm is **battle-tested across production data**. Without full context, AI-assisted changes can introduce subtle bugs (e.g., duplicate matches from broken mutual exclusivity, performance regression from in-loop computation). These files ensure:

- ✅ Critical logic is never accidentally changed
- ✅ Safe patterns (null checks, index bounds, mutual exclusivity) are followed
- ✅ Performance characteristics are preserved
- ✅ Knowledge survives team changes

### How to Use with AI Assistants

```
"Read ai_agent_documentation/PROJECT_CONTEXT.md, then help me add a new matching condition for..."
"Following ai_agent_documentation/DEVELOPMENT_GUIDELINES.md, review this proposed change to main.py..."
```

## 🔐 Security Considerations

- Uploaded files are stored temporarily in `uploads/` and should be cleaned periodically
- Results are stored in `outputs/`
- No authentication is implemented (designed for internal/trusted network use)
- Do not commit data files — use `.gitignore` to exclude `uploads/`, `outputs/`, and `data/`

## 📄 License

Internal use only. All rights reserved.

## 👥 Support

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review backend logs in `backend.log`
3. Check browser console for frontend errors
4. Consult [ai_agent_documentation/PROJECT_CONTEXT.md](ai_agent_documentation/PROJECT_CONTEXT.md) for logic questions

## 🗺️ Roadmap

- [ ] Configurable matching thresholds via UI
- [ ] User authentication and multi-tenancy
- [ ] Database storage for job history
- [ ] Email notifications on completion
- [ ] Docker containerization
- [ ] Export to CSV/JSON in addition to Excel
- [ ] Batch processing queue for large volumes
- [ ] Audit trail and per-row match explanation log

## 🙏 Acknowledgments

- **RapidFuzz / FuzzyWuzzy** — fuzzy string matching
- **FastAPI** — modern Python web framework
- **React + Vite** — fast frontend development
- **OpenPyXL** — Excel generation

---

**Version:** 2.1.0
**Last Updated:** March 2026
**Status:** Production Ready ✅
**Repository:** https://github.com/naji-beyrouthy-veriforce/onboarding-analysis-tool

