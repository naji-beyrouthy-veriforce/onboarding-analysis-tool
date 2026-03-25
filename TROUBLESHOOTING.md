# 🔧 Troubleshooting Guide

Common issues and solutions for the Onboarding Analysis Tool.

## 🚨 Backend Issues

### Problem: Backend won't start

**Symptom:**
```
ModuleNotFoundError: No module named 'fastapi'
ModuleNotFoundError: No module named 'fuzzywuzzy'
```

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

**If that doesn't work:**
```bash
# Install each dependency manually
pip install fastapi
pip install uvicorn
pip install openpyxl
pip install fuzzywuzzy
pip install python-Levenshtein
pip install python-multipart
```

---

### Problem: Port 8000 already in use

**Symptom:**
```
ERROR: [Errno 98] Address already in use
```

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use this one-liner
lsof -ti:8000 | xargs kill -9
```

**Alternative:** Change the port in `main.py`:
```python
# At the bottom of main.py
uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed from 8000
```

---

### Problem: Permission denied on start.sh

**Symptom:**
```
-bash: ./start.sh: Permission denied
```

**Solution:**
```bash
chmod +x start.sh restart.sh
./start.sh
```

---

### Problem: Python version too old

**Symptom:**
```
SyntaxError: invalid syntax
```

**Check version:**
```bash
python3 --version
```

**Solution:** Need Python 3.8 or higher. Install newer version:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.10

# Or use pyenv for version management
```

---

### Problem: Backend crashes during processing

**Symptom:**
- Backend stops unexpectedly
- No response from API
- Process killed

**Check logs:**
```bash
tail -100 backend/backend.log
```

**Common causes:**
1. **Out of memory** - Processing very large files
   - Solution: Reduce file size or increase RAM
   
2. **Invalid data format** - Unexpected values in files
   - Solution: Check file headers match expected format
   - Verify data types (dates, numbers, etc.)

3. **Encoding issues** - Non-UTF8 characters
   - Solution: Save files as UTF-8 encoding

---

## 🌐 Frontend Issues

### Problem: Frontend won't start

**Symptom:**
```
Cannot find module 'react'
Error: Cannot find module 'vite'
```

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### Problem: Port 5173 already in use

**Symptom:**
```
Port 5173 is in use
```

**Solution:**
```bash
# Find and kill process
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.js
```

**Change port:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000  // Changed from 5173
  }
})
```

---

### Problem: Can't connect to backend

**Symptom:**
- Error in browser console: "Failed to fetch"
- "Network Error"
- "ECONNREFUSED"

**Solution:**

1. **Verify backend is running:**
```bash
curl http://localhost:8000/api/health
```

Should return:
```json
{"status":"healthy","jobs_active":0,...}
```

2. **Check backend terminal** - Should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

3. **Check CORS settings** in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Should allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

4. **Restart both services:**
```bash
# Terminal 1 - Backend
cd backend
python3 main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

### Problem: Files won't upload

**Symptom:**
- Files selected but not uploaded
- Upload button stays disabled
- No progress after clicking "Start Matching"

**Check browser console (F12):**
- Look for errors in red
- Check Network tab for failed requests

**Solutions:**

1. **File format issue:**
   - Ensure files are CSV, XLSX, or XLS
   - Check file is not corrupted
   - Try opening file in Excel first

2. **File size too large:**
   - Backend default has no limit, but browser might timeout
   - Try with smaller file first
   - Split large files if needed

3. **Backend not receiving files:**
   - Check backend logs for upload errors
   - Verify FormData is being sent correctly

---

### Problem: Progress bar stuck at 0%

**Symptom:**
- Progress shows "Processing: Starting new matching job"
- Timer running but no progress
- Stays at 0% for long time

**Diagnosis:**

1. **Check backend logs:**
```bash
tail -f backend/backend.log
```

2. **Check if job is running:**
```bash
curl http://localhost:8000/api/debug/jobs
```

**Common causes:**

1. **File reading error:**
   - Invalid file format
   - Missing required columns
   - Encoding issues

2. **Processing stuck:**
   - Very large dataset (be patient)
   - Infinite loop (check logs)
   - Memory issue (check system RAM)

**Solutions:**

1. **Verify file format:**
   - Check headers match expected format
   - Ensure all required columns present
   - Verify data types are correct

2. **Test with small file:**
   - Create a file with 2-3 rows
   - Verify processing works
   - Then try larger file

3. **Restart backend:**
```bash
cd backend
./restart.sh
# or
pkill -f "python3 main.py"
python3 main.py
```

---

### Problem: Console not showing logs

**Symptom:**
- Console area is empty
- No log messages appearing
- Progress updates but no detailed logs

**Check:**

1. **Backend is not sending logs** - This is expected!
   - The current implementation doesn't stream logs to frontend
   - Backend logs are in `backend.log` file
   - Console shows progress messages only

2. **View backend logs:**
```bash
# Watch logs in real-time
tail -f backend/backend.log

# View last 100 lines
tail -100 backend/backend.log
```

---

## 📁 File Format Issues

### Problem: "Header inconsistencies" error

**Symptom:**
```
WARNING: got "company" while expecting "contractor_name" in column 1
```

**Solution:**

Ensure your files have the **exact** headers:

**CBX File (28 columns):**
```csv
id,name_fr,name_en,old_names,address,city,state,country,postal_code,
first_name,last_name,email,cbx_expiration_date,registration_code,suspended,
modules,access_modes,code,subscription_price_cad,employee_price_cad,
subscription_price_usd,employee_price_usd,hiring_client_names,
hiring_client_ids,hiring_client_qstatus,parents,assessment_level,new_product
```

**HC File (41 columns):**
```csv
contractor_name,contact_first_name,contact_last_name,contact_email,contact_phone,
contact_language,address,city,province_state_iso2,country_iso2,
postal_code,category,description,phone,extension,fax,website,language,
is_take_over,qualification_expiration_date,qualification_status,batch,
questionnaire_name,questionnaire_id,pricing_group_id,pricing_group_code,
hiring_client_name,hiring_client_id,is_association_fee,base_subscription_fee,
contact_currency,agent_in_charge_id,take_over_follow-up_date,renewal_date,
information_shared,contact_timezone,do_not_match,force_cbx_id,ambiguous,
contractorcheck_account,assessment_level
```

---

### Problem: "Invalid currency" error

**Symptom:**
```
Invalid currency: EUR, must be in ('CAD', 'USD')
```

**Solution:**
- Only CAD and USD are supported
- Change `contact_currency` column to CAD or USD
- For Canadian contractors: use CAD
- For all others: use USD

---

### Problem: Date format errors

**Symptom:**
```
ValueError: time data '2025-01-01' does not match format '%d/%m/%y'
```

**Solution:**

Dates must be in format: **DD/MM/YY** or **DD/MM/YYYY**

Examples:
- ✅ `01/01/25`
- ✅ `31/12/2025`
- ❌ `2025-01-01`
- ❌ `01-01-25`

**Excel tip:** Format cells as "Date" with custom format `DD/MM/YY`

---

### Problem: Encoding issues

**Symptom:**
- Strange characters in output (é → Ã©)
- Company names look corrupted
- French characters broken

**Solution:**

1. **Save as UTF-8:**
   - Excel: Save As → CSV UTF-8
   - Google Sheets: Download → CSV UTF-8

2. **Convert existing file:**
```bash
iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv
```

3. **Check encoding:**
```bash
file -i yourfile.csv
```

---

## 🔍 Matching Issues

### Problem: No matches found

**Symptom:**
- All contractors showing as "onboarding"
- `cbx_id` column empty for all rows
- Match count = 0

**Diagnosis:**

Check these common issues:

1. **Company names too different:**
   - CBX: "ABC Construction Inc."
   - HC: "ABC Corp"
   - May not reach 80% threshold

2. **Different countries:**
   - Address matching only works within same country
   - Verify `country` and `country_iso2` columns

3. **Email domains don't match:**
   - CBX: `john@abc-construction.com`
   - HC: `john@gmail.com`
   - Generic emails require exact match

**Solutions:**

1. **Use force_cbx_id:**
   - Add known CBX IDs to `force_cbx_id` column
   - Forces specific matches

2. **Check data quality:**
   - Clean company names
   - Standardize formats
   - Remove extra spaces

3. **Review matching logic:**
   - Check `ratio_company` and `ratio_address` in output
   - Values below 80 won't match
   - Consider if thresholds are appropriate

---

### Problem: Too many matches

**Symptom:**
- `match_count` shows 10+ for each contractor
- Wrong contractors being matched
- False positives

**Causes:**

1. **Generic company names:**
   - "Construction Inc"
   - "Services Ltd"
   - Matches too broadly

2. **Missing differentiation:**
   - Multiple "ABC Construction" companies
   - Need address or email to distinguish

**Solutions:**

1. **Add more identifying info:**
   - Ensure email addresses are provided
   - Include complete addresses
   - Use specific company names

2. **Review generic word list:**
   - Check `BASE_GENERIC_COMPANY_NAME_WORDS` in main.py
   - Add more generic terms if needed

3. **Use relationship matching:**
   - Ensure `hiring_client_name` is filled
   - Tool prioritizes existing relationships

---

### Problem: Wrong action assigned

**Symptom:**
- Should be "onboarding" but shows "add_questionnaire"
- Should be "already_qualified" but shows "follow_up"

**Check these fields:**

1. **registration_status** in CBX:
   - Active, Non Member, Suspended affect actions

2. **is_take_over** in HC:
   - True triggers different workflow

3. **is_in_relationship**:
   - Existing relationship changes action

4. **subscription pricing**:
   - Affects upgrade calculations

**Review action logic:**

See `action()` function in `main.py` for detailed logic tree.

---

## 💾 Output Issues

### Problem: Can't open Excel file

**Symptom:**
- "File is corrupted"
- "Cannot open file"
- Excel shows errors

**Solutions:**

1. **Re-download the file:**
   - Might have been interrupted
   - Try download again

2. **Try different program:**
   - Excel
   - LibreOffice Calc
   - Google Sheets

3. **Check file size:**
```bash
ls -lh outputs/*.xlsx
```
   - If 0 bytes, processing failed
   - Check backend logs for errors

---

### Problem: Missing sheets in output

**Symptom:**
- Only "all" sheet present
- Expected "onboarding" sheet missing

**Explanation:**

Sheets are only created if records exist for that action.

- If no contractors need onboarding, no "onboarding" sheet
- Check "all" sheet for action breakdown

---

### Problem: Output has wrong values

**Symptom:**
- Prices are incorrect
- Dates are wrong
- Text is truncated

**Check:**

1. **Input data quality:**
   - Verify source files have correct values
   - Check for formula cells in Excel (export as values)

2. **Currency conversion:**
   - Prices converted based on `contact_currency`
   - CAD vs USD pricing

3. **Date format:**
   - May display differently in Excel
   - Actual value is correct

---

## 🖥️ System Issues

### Problem: Out of memory

**Symptom:**
```
MemoryError
Killed
Process terminated
```

**Solutions:**

1. **Check available RAM:**
```bash
free -h
```

2. **Reduce dataset:**
   - Process in batches
   - Split large files

3. **Close other applications:**
   - Free up RAM
   - Stop unnecessary services

4. **Increase swap:**
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

### Problem: Slow performance

**Symptom:**
- Processing takes very long
- Over 1 hour for 1000 contractors

**Typical performance:**
- 100 contractors: 30-60 seconds
- 1000 contractors: 5-10 minutes
- 5000 contractors: 25-50 minutes

**If slower than expected:**

1. **Large CBX database:**
   - More CBX records = more comparisons
   - Consider filtering CBX data

2. **CPU constraints:**
   - Check CPU usage: `top`
   - Close other applications

3. **Disk I/O:**
   - Slow disk access
   - Move to SSD if available

---

## 🔐 Security Issues

### Problem: CORS errors in browser

**Symptom:**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:**

Check `main.py` has CORS middleware:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 Data Integrity Issues

### Problem: Duplicate records in output

**Symptom:**
- Same contractor appears multiple times
- Row count higher than expected

**Explanation:**

This is **intentional** if contractor matches multiple CBX records:
- Each potential match creates a row
- Sorted by quality (best first)
- Review `match_count` column

**To keep only best match:**
- Filter on first occurrence of each HC contractor
- Or review all matches to pick correct one

---

## 🆘 Emergency Recovery

### Complete Reset

If everything is broken:

```bash
# Stop all processes
pkill -f "python3 main.py"
pkill -f "node"

# Clean backend
cd backend
rm -rf __pycache__
rm -f backend.log
rm -rf uploads/*
rm -rf outputs/*

# Reinstall backend
pip install -r requirements.txt

# Clean frontend
cd ../frontend
rm -rf node_modules
rm -f package-lock.json
npm install

# Restart
cd ../backend
python3 main.py

# In new terminal
cd ../frontend
npm run dev
```

---

## 📞 Getting More Help

### Enable Debug Mode

**Backend:**
```python
# In main.py
logging.basicConfig(level=logging.DEBUG)  # Changed from INFO
```

**Frontend:**
- Open browser DevTools (F12)
- Check Console tab
- Check Network tab for API calls

### Collect Diagnostic Info

```bash
# System info
uname -a
python3 --version
node --version
npm --version

# Backend status
curl http://localhost:8000/api/health

# Check ports
lsof -i :8000
lsof -i :5173

# Check processes
ps aux | grep python
ps aux | grep node

# Check logs
tail -100 backend/backend.log
```

---

## ✅ Checklist for Common Issues

Before asking for help, verify:

- [ ] Backend running and showing "Uvicorn running on http://0.0.0.0:8000"
- [ ] Frontend running and showing "Local: http://localhost:5173"
- [ ] Can access http://localhost:5173 in browser
- [ ] Can access http://localhost:8000/api/health (should return JSON)
- [ ] Files have correct headers (see format section above)
- [ ] Files are UTF-8 encoded
- [ ] Dates in DD/MM/YY format
- [ ] Currency is CAD or USD
- [ ] Browser console shows no errors (F12)
- [ ] Backend logs show no critical errors

---

**Still having issues?** Contact the development team with:
1. Error message (exact text)
2. Backend logs (last 50 lines)
3. Browser console errors (screenshot)
4. Steps to reproduce
5. Sample data (if possible)

