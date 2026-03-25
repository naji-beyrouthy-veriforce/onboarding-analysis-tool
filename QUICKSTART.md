# 🚀 Quick Start Guide

Get the Onboarding Analysis Tool running in **5 minutes**!

## ⚡ Prerequisites Check

Before you start, ensure you have:

```bash
# Check Python version (need 3.8+)
python3 --version

# Check Node.js version (need 16+)
node --version

# Check npm
npm --version
```

If any are missing:
- **Python:** Download from [python.org](https://www.python.org/downloads/)
- **Node.js:** Download from [nodejs.org](https://nodejs.org/)

## 📦 Installation (First Time Only)

### Step 1: Clone or Extract Project

```bash
cd ~
# If you have the project folder, navigate to it
cd onboarding-analysis-tool
```

### Step 2: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Expected output:**
```
Collecting fastapi
Collecting uvicorn
Collecting openpyxl
Collecting fuzzywuzzy
Collecting python-multipart
...
Successfully installed fastapi-0.x.x uvicorn-0.x.x ...
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Expected output:**
```
added 234 packages in 15s
```

✅ **Installation Complete!**

## ▶️ Running the Application

### Method 1: Manual Start (Recommended for First Time)

**Terminal 1 - Start Backend:**
```bash
cd ~/onboarding-analysis-tool/backend
python3 main.py
```

**You should see:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Terminal 2 - Start Frontend:**
```bash
cd ~/onboarding-analysis-tool/frontend
npm run dev
```

**You should see:**
```
  VITE v5.x.x  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Method 2: Using Start Scripts (Linux/WSL)

**Backend:**
```bash
cd backend
chmod +x start.sh restart.sh  # First time only
./start.sh
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 Access the Application

1. **Open your browser**
2. **Navigate to:** `http://localhost:5173`
3. **You should see:** Purple/blue gradient interface with "Upload Files" section

## 📝 First Test Run

### Step 1: Prepare Test Files

Create two test files or use existing samples:

**test_cbx.csv** (minimum format):
```csv
id,name_fr,name_en,old_names,address,city,state,country,postal_code,first_name,last_name,email,cbx_expiration_date,registration_code,suspended,modules,access_modes,code,subscription_price_cad,employee_price_cad,subscription_price_usd,employee_price_usd,hiring_client_names,hiring_client_ids,hiring_client_qstatus,parents,assessment_level,new_product
1,Test Company,Test Company,,123 Main St,Montreal,QC,CA,H1A1A1,John,Doe,john@test.com,01/01/25,Active,False,Standard,Contractor,contractor,1000,50,800,40,Test Client,1,validated,,2,False
```

**test_hc.csv** (minimum format):
```csv
contractor_name,contact_first_name,contact_last_name,contact_email,contact_phone,contact_language,address,city,province_state_iso2,country_iso2,postal_code,category,description,phone,extension,fax,website,language,is_take_over,qualification_expiration_date,qualification_status,batch,questionnaire_name,questionnaire_id,pricing_group_id,pricing_group_code,hiring_client_name,hiring_client_id,is_association_fee,base_subscription_fee,contact_currency,agent_in_charge_id,take_over_follow-up_date,renewal_date,information_shared,contact_timezone,do_not_match,force_cbx_id,ambiguous,contractorcheck_account,assessment_level
Test Company,John,Doe,john@test.com,5141234567,en,123 Main St,Montreal,QC,CA,H1A1A1,General,Test contractor,5141234567,,,www.test.com,en,false,,,Batch1,Standard,1,1,STD,Test Client,1,false,1000,CAD,1,,,true,America/Montreal,false,,,false,2
```

### Step 2: Upload Files

1. **Click on the upload area** or drag files
2. **Select CBX file** (test_cbx.csv)
3. **Select HC file** (test_hc.csv)
4. **Files appear** with green checkmarks

### Step 3: Start Processing

1. **Click "Start Matching"** button
2. **Watch the progress:**
   - Progress bar fills from 0% to 100%
   - Timer counts up (00:00:05, 00:00:06...)
   - Console shows logs in real-time
   - Counter shows "Processing: 1/1"

### Step 4: Download Results

1. **Wait for** "Processing Complete! ✓"
2. **Click "Download Results"** button
3. **Excel file downloads** (e.g., `abc12345_results.xlsx`)
4. **Open in Excel/LibreOffice**

### Step 5: Review Results

**Check these sheets:**
- `all` - All records with match analysis
- `onboarding` - New contractors
- `add_questionnaire` - Existing contractors needing action
- Other action-specific sheets

**Key columns to check:**
- `cbx_id` - Matched ID (or blank if new)
- `analysis` - Match details with scores
- `action` - Recommended action
- `ratio_company` - Company name match score
- `ratio_address` - Address match score

## ✅ Verification Checklist

After your first run, verify:

- [ ] Backend shows "Application startup complete"
- [ ] Frontend loads at http://localhost:5173
- [ ] Files upload successfully
- [ ] Progress bar moves from 0% to 100%
- [ ] Timer counts up during processing
- [ ] Console shows log messages
- [ ] Download button appears when complete
- [ ] Excel file opens without errors
- [ ] Multiple sheets are present in Excel

## 🎯 Next Steps

Now that it's working:

1. **Read README.md** for detailed documentation
2. **Prepare your real data files** with correct headers
3. **Process your actual contractor data**
4. **Review TROUBLESHOOTING.md** if issues arise

## 🔧 Common First-Time Issues

### Issue: Backend won't start

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Fix:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue: Frontend won't start

**Error:** `Cannot find module`

**Fix:**
```bash
cd frontend
rm -rf node_modules
npm install
```

### Issue: Port already in use

**Error:** `Address already in use`

**Fix for Backend (port 8000):**
```bash
lsof -i :8000
kill -9 <PID>
```

**Fix for Frontend (port 5173):**
```bash
lsof -i :5173
kill -9 <PID>
```

### Issue: Can't connect to backend

**Error:** `Failed to fetch` or `ECONNREFUSED`

**Fix:**
1. Make sure backend is running (check Terminal 1)
2. Backend should show "Uvicorn running on http://0.0.0.0:8000"
3. Try restarting backend

### Issue: Files upload but nothing happens

**Check:**
1. Open browser console (F12)
2. Look for errors in red
3. Check backend terminal for error messages
4. Verify file format matches expected headers

## 📞 Getting Help

If you're stuck:

1. **Check backend logs:**
   ```bash
   tail -f backend/backend.log
   ```

2. **Check frontend console:**
   - Press F12 in browser
   - Click "Console" tab
   - Look for errors in red

3. **Review documentation:**
   - README.md - Full documentation
   - TROUBLESHOOTING.md - Common issues
   - Backend logs - Detailed processing info

4. **Test with minimal data:**
   - Try with just 1-2 contractors
   - Verify basic functionality
   - Then scale up to full dataset

## 🎉 Success!

If you can upload files, see progress, and download results - **you're all set!**

Now you can process your real contractor data with confidence.

---

**Need more details?** See [README.md](README.md) for complete documentation.

**Having issues?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for solutions.

