# Changelog

All notable changes to the Onboarding Analysis Tool.

## [2.1.3] - 2026-03-25

### ✨ Matching Improvements

#### 1. Parenthesized Name Extraction
- **Companies registered as numbered entities** with trade names in parentheses (e.g. "1670747 Ontario Inc. (Mastrangelo Fuels)") now match properly
- Previously, parenthesized content was stripped before comparison, leaving only the numbered portion which scored poorly
- Now extracts the parenthesized name as an alternative and compares against both, using the higher ratio
- **Example**: `1670747 ONTARIO INC. (Mastrangelo Fuels)` → CBX `Mastrangelo Fuels` now scores CR=100% (was 25%)

#### 2. High-Address Compensates Low-Company Condition
- Added new matching condition: **address ratio ≥ 90% + company ratio ≥ 60%**
- Catches cases where one company name is a subset of the other (e.g. "Tbaytel" vs "Tbaytel Mobility") diluting the company score below the standard 75% threshold, but address strongly confirms it's the same entity
- Positioned after Condition 2 (CR≥75 + AR≥85) and before Condition 3 (AR=100 + CR≥70) in the priority chain

#### 3. Hyphen Removal in Company Name Cleaning
- Hyphens are now stripped during company name normalization (alongside periods and commas)
- **Example**: `CHEM-A-QUA` vs `CHEMAQUA` now scores CR=100% (was 88.9%)
- Applied consistently to both HC and pre-normalized CBX company names

- **Files Modified**: `backend/main.py`
- **Test Results**: 63 → 64 matches (+1 new: Mastrangelo Fuels), 0 regressions

## [2.1.2] - 2026-03-25

### 🐛 Bug Fix

#### Country Name Normalization
- **FIXED**: HC files with full country names (e.g. "Canada", "United States") instead of ISO2 codes ("CA", "US") caused zero matches
- **Issue**: The country early-exit check compared raw HC country against CBX ISO2 codes — "Canada" != "CA" skipped every CBX row
- **Impact**: 100% of HC rows with full country names silently produced empty analysis (no matches, no errors)
- **Solution**: Added `normalize_country()` function with a comprehensive ISO 3166-1 mapping (100+ countries) applied to HC country before comparison
- **Logging**: First 5 normalized rows are logged for visibility (e.g. `Country normalized: 'Canada' → 'CA' (row 2)`)
- **Files Modified**: `backend/main.py`
- **Backward Compatible**: ISO2 codes pass through unchanged; only full names are converted

## [2.1.1] - 2026-02-05

### 🐛 Critical Bug Fix

#### Country Comparison Case-Sensitivity Bug
- **FIXED**: Country matching was case-sensitive, causing legitimate matches to be skipped
- **Issue**: HC data had mixed-case countries ("Ca", "Us") while CBX data had uppercase ("CA", "US")
- **Impact**: 15+ confirmed cases failed to match despite meeting all other criteria (company name, address, email)
- **Solution**: Changed country comparison from `cbx_country != hc_country` to `str(cbx_country).strip().upper() != str(hc_country).strip().upper()`
- **Files Modified**: `backend/main.py` (lines 600 and 622)
- **Test Cases**: 
  - Safety-Kleen (82682): 77% company + 89% address → Now matches via Condition 2
  - Lucien Vanier (23213): 79% company + 100% address → Now matches via Condition 2
  - Navada Ltée (9057): 100% company + 100% address → Now matches via Condition 1
  - Mason Lift (9724): 53% company + email match → Now matches via Condition 6
- **⚠️ IMPORTANT**: Backend server restart required for fix to take effect

## [2.1.0] - 2025-12-10

### 🚀 Performance & Accuracy Improvements

Major performance optimizations and matching logic refinements based on production testing.

#### ⚡ Performance Enhancements
- **Pre-compiled regex patterns** for 5-10x faster generic word removal
- **Pre-normalized CBX data** caching (indexes 28-34) eliminates redundant computations
- **Rapidfuzz support** with automatic fallback to fuzzywuzzy (2-3x speed boost when available)
- **Optimized string operations** with reduced function calls in hot path
- **Expected improvement**: 5-10x faster processing for large datasets (10k+ records)

#### 🎯 Matching Logic Improvements
- **100% company match validation**: When company names match perfectly, email domains must also match (prevents false positives for common company names)
- **Empty address handling**: Address ratio set to 0 when either address is missing (prevents matching on non-existent data)
- **Exact email priority**: Exact email matches (not just domain) get higher priority with lower company threshold (20%)
- **Improved sorting**: Matches now sorted by company ratio first, then address, ensuring best matches appear first
- **Duplicate prevention**: Mutually exclusive matching conditions prevent same record from matching multiple times
- **Contact match threshold**: Email domain matches now require 33% minimum company similarity (reduces false positives)

#### 🐛 Bug Fixes
- **Index out of bounds protection**: Safe fallback when pre-normalized data unavailable
- **Empty email handling**: Proper handling when email fields are empty or invalid
- **Domain extraction**: Improved email domain parsing with edge case handling

### Breaking Changes
- None - all changes are backward compatible

### Migration Notes
- No action required - existing installations will benefit from improvements automatically
- Optional: Install `rapidfuzz` package for additional performance boost

---

## [2.0.0] - 2025-11-26

### 🎉 Major Rewrite

Complete rewrite of the application with modern web technologies while preserving the battle-tested legacy matching logic.

### ✨ Added

#### Frontend
- **New React + Vite frontend** with modern UI/UX
- **Real-time progress tracking** with live progress bar
- **Timer display** showing elapsed processing time
- **Record counter** showing X/Y records processed
- **Live console** with color-coded log messages
- **Beautiful gradient design** (purple/blue theme)
- **Drag-and-drop file upload** interface
- **Dashboard** with statistics and job history
- **Responsive design** for all screen sizes
- **Animated transitions** and smooth interactions
- **Download manager** for completed jobs

#### Backend
- **FastAPI framework** for modern async API
- **Background job processing** with ThreadPoolExecutor
- **RESTful API** with proper endpoints
- **Job tracking system** with unique IDs
- **Progress reporting** at granular levels (0-100%)
- **Excel output generation** with multiple sheets
- **File format support** for CSV, XLSX, XLS (both input and CBX)
- **CORS support** for cross-origin requests
- **Health check endpoint** for monitoring
- **Comprehensive logging** with detailed timestamps

#### Matching Logic
- **Exact legacy algorithm** ported from original script
- **Fuzzy string matching** using fuzzywuzzy library
- **Company name cleaning** with generic word removal
- **Address validation** with postal code comparison
- **Email domain matching** (corporate vs generic)
- **Historical name tracking** for company changes
- **Priority-based matching** (forced, contact, high-ratio, combined)
- **Filtering rules** (exclude "DO NOT USE", prioritize HC relationships)
- **Sorting by quality** (modules, relationship count, ratios)
- **Subscription upgrade calculation** with prorating
- **Assessment level comparison** and upgrade detection
- **Action assignment** based on business rules

#### Documentation
- **Comprehensive README.md** with full documentation
- **QUICKSTART.md** for 5-minute setup
- **TROUBLESHOOTING.md** with solutions to common issues
- **API.md** with complete API reference
- **CHANGELOG.md** documenting all changes

### 🔄 Changed

#### Matching Configuration
- **Hardcoded thresholds** to legacy defaults (80/80) for consistency
- Removed UI configuration of matching ratios (may add back in future)
- Preserved exact legacy matching behavior for validated results

#### File Handling
- **Asynchronous upload** replacing synchronous processing
- **Temporary storage** in uploads/ directory
- **Automatic cleanup** of old files (not implemented, future feature)
- **Support for both CSV and Excel** in CBX file (legacy was CSV only)

#### Output Format
- **Excel with 15 sheets** (all action sheets plus special data sheets present)
- **Improved column formatting** with proper widths
- **Table styling** maintained from legacy
- **Action-based filtering** into separate sheets

### 🐛 Fixed

#### Data Processing
- **Encoding issues** with French characters (UTF-8 support)
- **Date parsing** for multiple formats (DD/MM/YY and DD/MM/YYYY)
- **Phone number normalization** with extension handling
- **Email cleaning** (split on semicolon, newline, comma)
- **Currency validation** (CAD/USD only)
- **Generic domain detection** for proper email matching

#### Matching Accuracy
- **Company name cleaning** improved with regex
- **Address comparison** with proper normalization
- **Postal code matching** with space removal
- **Country validation** before address comparison
- **Previous name matching** from semicolon-separated list
- **Qualification status** proper parsing from list

#### Business Logic
- **Action assignment** following exact legacy rules
- **Subscription upgrade** calculation matches legacy
- **Assessment level parsing** for multiple formats
- **Association fee logic** with 60-day check
- **Take-over workflow** proper handling
- **Ambiguous contractor** flagging

### 🗑️ Removed

- **Command-line interface** - replaced with web UI
- **Hardcoded file paths** - now uses upload directory
- **Manual ratio configuration** - using validated defaults
- **Synchronous processing** - now async with progress tracking
- **Old documentation files** (INSTALLATION.md, DEPLOYMENT.md)

### ⚡ Performance

- **Background processing** - UI remains responsive
- **Progress updates** every 10 records
- **Efficient file reading** with openpyxl read-only mode
- **Memory management** with proper file closing
- **Typical processing times:**
  - 100 contractors: 30-60 seconds
  - 500 contractors: 2-5 minutes
  - 1000 contractors: 5-10 minutes
  - 5000 contractors: 25-50 minutes

### 🔐 Security

⚠️ **Note:** This version is designed for internal use only:
- No authentication implemented
- No authorization checks
- CORS allows all origins
- Files stored on server disk
- No rate limiting

For production deployment, additional security measures required.

### 📊 Statistics

- **Lines of code:**
  - Backend (main.py): ~728 lines
  - Frontend (App.jsx): ~800 lines
  - Total: ~1,500+ lines

- **Features:**
  - 15 output sheets
  - 69 analysis columns
  - 6 API endpoints
  - Real-time progress tracking
  - Live console logging

- **Dependencies:**
  - Backend: 6 core packages
  - Frontend: 15+ packages
  - Total: 250+ npm packages (with dependencies)

### 🧪 Testing

Added test files:
- `test_progress.py` - Progress tracking test
- `test_diagnostic.py` - System diagnostic test
- `test_integration.py` - Integration test
- `test_background.py` - Background processing test

### 📝 Documentation

New documentation structure:
```
docs/
├── README.md           # Main documentation (comprehensive)
├── QUICKSTART.md       # 5-minute setup guide
├── TROUBLESHOOTING.md  # Common issues and solutions
├── API.md              # API reference
└── CHANGELOG.md        # This file
```

### 🚀 Migration from Legacy

To migrate from legacy command-line script:

**Before (legacy):**
```bash
python legacy_script.py cbx.csv hc.xlsx output.xlsx \
  --min_company_match_ratio 80 \
  --min_address_match_ratio 80
```

**After (v2.0):**
1. Start backend: `python3 main.py`
2. Start frontend: `npm run dev`
3. Open browser: `http://localhost:5173`
4. Upload files via UI
5. Download results when complete

### 🔧 Technical Details

#### Stack
- **Backend:** Python 3.8+, FastAPI, Uvicorn
- **Frontend:** React 18, Vite 5, Tailwind CSS 3
- **Libraries:** fuzzywuzzy, openpyxl, lucide-react

#### Architecture
- **API-first design** with REST endpoints
- **Async processing** with background jobs
- **Job tracking** with in-memory storage
- **File-based results** stored in outputs/
- **Stateless API** (except job tracking)

#### Compatibility
- **Input files:** Same format as legacy (CSV/XLSX)
- **Output format:** Same as legacy (Excel with multiple sheets)
- **Matching logic:** Exact replica of legacy algorithm
- **Column mapping:** Identical to legacy
- **Action assignment:** Same business rules

### 📋 Known Issues

1. **Job tracking in memory** - lost on restart (future: use database)
2. **No authentication** - internal use only
3. **No file cleanup** - uploads/ and outputs/ grow over time
4. **No WebSocket** - polling used for progress (could be improved)
5. **Limited error recovery** - some errors may require restart

### 🗺️ Roadmap

Future enhancements planned:

#### v2.1 (Minor)
- [ ] Database storage for job history
- [ ] Automatic file cleanup
- [ ] WebSocket support for real-time updates
- [ ] Configurable matching thresholds (with validation)
- [ ] Export job history to CSV

#### v2.2 (Minor)
- [ ] User authentication (JWT)
- [ ] Role-based access control
- [ ] Email notifications on completion
- [ ] Batch processing queue
- [ ] API rate limiting

#### v3.0 (Major)
- [ ] Multi-tenancy support
- [ ] Advanced filtering in UI
- [ ] Custom matching rules editor
- [ ] Data visualization dashboard
- [ ] Audit trail and compliance logging
- [ ] Docker containerization
- [ ] Cloud deployment ready

### 🙏 Credits

- **Original legacy script:** Proven algorithm with thousands of successful matches
- **FastAPI:** Modern Python web framework
- **React + Vite:** Fast and efficient frontend
- **Tailwind CSS:** Beautiful utility-first styling
- **fuzzywuzzy:** Excellent fuzzy string matching
- **openpyxl:** Reliable Excel file handling

---

## [1.0.0] - 2024 (Legacy)

### Initial Release

Original command-line script with:
- CSV input for CBX data
- XLSX input for HC data
- Excel output with multiple sheets
- Fuzzy matching algorithm
- Company name cleaning
- Address validation
- Action assignment
- Subscription calculations

**Command-line interface:**
```bash
python legacy_script.py cbx.csv hc.xlsx output.xlsx [options]
```

**Key features:**
- 28 CBX columns, 41 HC columns
- 15 output sheets by action
- Configurable matching ratios
- Generic domain filtering
- Previous name matching
- Qualification status tracking

---

## Version History Summary

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 2.0.0 | 2025-11-26 | Major | Complete rewrite with web UI |
| 1.0.0 | 2024 | Initial | Original command-line script |

---

**Current Version:** 2.0.0  
**Status:** Production Ready ✅  
**Last Updated:** November 26, 2025

