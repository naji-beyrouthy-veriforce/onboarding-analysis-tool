# 📡 API Documentation

Backend API reference for the Onboarding Analysis Tool v2.1.

## Base URL

```
http://localhost:8000
```

## Authentication

None required (internal use only).

## Endpoints

### 1. Health Check

**GET** `/api/health`

Check if the backend service is running.

**Response:**
```json
{
  "status": "healthy",
  "jobs_active": 2,
  "upload_dir": "uploads",
  "output_dir": "outputs"
}
```

**Status Codes:**
- `200` - Service is healthy

---

### 2. Start Matching Job

**POST** `/api/match`

Upload files and start a matching job.

**Request:**
- Content-Type: `multipart/form-data`
- Body Parameters:
  - `cbx_file` (file, required) - CBX database export (CSV, XLSX, or XLS)
  - `hc_file` (file, required) - Hiring client submissions (CSV, XLSX, or XLS)

**Note:** Matching ratios are hardcoded to legacy defaults (80/80) and cannot be changed via API.

**Example (curl):**
```bash
curl -X POST http://localhost:8000/api/match \
  -F "cbx_file=@data/cbx_export.csv" \
  -F "hc_file=@data/hc_submissions.xlsx"
```

**Response:**
```json
{
  "job_id": "a3b8c9d2",
  "status": "processing",
  "progress": 0.0,
  "message": "Starting...",
  "result_file": null,
  "error": null,
  "created_at": "2025-11-26T10:30:45.123456"
}
```

**Status Codes:**
- `200` - Job created successfully
- `400` - Invalid files or parameters
- `500` - Server error

---

### 3. Get Job Status

**GET** `/api/jobs/{job_id}`

Retrieve the current status of a job.

**Path Parameters:**
- `job_id` (string, required) - Job identifier returned from `/api/match`

**Example:**
```bash
curl http://localhost:8000/api/jobs/a3b8c9d2
```

**Response:**
```json
{
  "job_id": "a3b8c9d2",
  "status": "processing",
  "progress": 0.45,
  "message": "Processing: 45/100",
  "result_file": null,
  "error": null,
  "created_at": "2025-11-26T10:30:45.123456"
}
```

**Status Values:**
- `processing` - Job is currently running
- `completed` - Job finished successfully
- `failed` - Job encountered an error

**Progress Values:**
- `0.0` - Starting
- `0.05` - Files loaded
- `0.05 - 0.90` - Processing records
- `0.92` - Writing action sheets
- `0.98` - Saving results
- `1.0` - Complete

**Status Codes:**
- `200` - Job found
- `404` - Job not found

---

### 4. Download Results

**GET** `/api/jobs/{job_id}/download`

Download the completed Excel results file.

**Path Parameters:**
- `job_id` (string, required) - Job identifier

**Example:**
```bash
curl -O http://localhost:8000/api/jobs/a3b8c9d2/download
```

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="{job_id}_results.xlsx"`
- Body: Binary Excel file

**Status Codes:**
- `200` - File downloaded
- `400` - Job not completed
- `404` - Job or file not found

---

### 5. List All Jobs

**GET** `/api/jobs`

Retrieve a list of all jobs.

**Example:**
```bash
curl http://localhost:8000/api/jobs
```

**Response:**
```json
{
  "jobs": [
    {
      "job_id": "a3b8c9d2",
      "status": "completed",
      "progress": 1.0,
      "message": "Done!",
      "result_file": "a3b8c9d2_results.xlsx",
      "error": null,
      "created_at": "2025-11-26T10:30:45.123456"
    },
    {
      "job_id": "f7e8d9c1",
      "status": "processing",
      "progress": 0.35,
      "message": "Processing: 35/100",
      "result_file": null,
      "error": null,
      "created_at": "2025-11-26T11:15:22.789012"
    }
  ],
  "total": 2
}
```

**Status Codes:**
- `200` - Success

---

### 6. Root Endpoint

**GET** `/`

Service information.

**Response:**
```json
{
  "status": "ok",
  "message": "Onboarding Analysis Tool API v2",
  "version": "2.0"
}
```

**Status Codes:**
- `200` - Success

---

## Data Models

### JobStatus

```typescript
{
  job_id: string;           // Unique job identifier (8 chars)
  status: string;           // "processing" | "completed" | "failed"
  progress: number;         // 0.0 to 1.0
  message: string;          // Human-readable status message
  result_file: string?;     // Filename when completed
  error: string?;           // Error message if failed
  created_at: string;       // ISO 8601 timestamp
}
```

---

## File Format Requirements

### CBX File (28 columns)

Required headers (case-insensitive, order matters):

```
id, name_fr, name_en, old_names, address, city, state, country, postal_code,
first_name, last_name, email, cbx_expiration_date, registration_code, suspended,
modules, access_modes, code, subscription_price_cad, employee_price_cad,
subscription_price_usd, employee_price_usd, hiring_client_names,
hiring_client_ids, hiring_client_qstatus, parents, assessment_level, new_product
```

**Field Details:**
- `id` (integer) - Unique CBX identifier
- `name_fr` (string) - Company name in French
- `name_en` (string) - Company name in English
- `old_names` (string) - Semicolon-separated previous names
- `cbx_expiration_date` (string) - Format: DD/MM/YY or DD/MM/YYYY
- `registration_code` (string) - Active, Suspended, Non Member
- `suspended` (boolean) - True/False
- `subscription_price_cad` (number) - CAD pricing
- `employee_price_cad` (number) - CAD per-employee fee
- `subscription_price_usd` (number) - USD pricing
- `employee_price_usd` (number) - USD per-employee fee
- `hiring_client_names` (string) - Semicolon-separated
- `hiring_client_qstatus` (string) - Semicolon-separated (validated, pending, etc.)

### HC File (41 columns)

Required headers:

```
contractor_name, contact_first_name, contact_last_name, contact_email, contact_phone,
contact_language, address, city, province_state_iso2, country_iso2,
postal_code, category, description, phone, extension, fax, website, language,
is_take_over, qualification_expiration_date, qualification_status, batch,
questionnaire_name, questionnaire_id, pricing_group_id, pricing_group_code,
hiring_client_name, hiring_client_id, is_association_fee, base_subscription_fee,
contact_currency, agent_in_charge_id, take_over_follow-up_date, renewal_date,
information_shared, contact_timezone, do_not_match, force_cbx_id, ambiguous,
contractorcheck_account, assessment_level
```

**Field Details:**
- `contractor_name` (string, required) - Company name
- `contact_email` (string, required) - Email address
- `country_iso2` (string, required) - 2-letter country code (CA, US, etc.)
- `province_state_iso2` (string, required for CA/US) - Province/state code
- `postal_code` (string, required) - Postal/ZIP code
- `contact_currency` (string) - CAD or USD only
- `is_take_over` (boolean) - True/False
- `is_association_fee` (boolean) - True/False
- `base_subscription_fee` (number) - Subscription price
- `do_not_match` (boolean) - Skip matching if True
- `force_cbx_id` (integer) - Force match to specific CBX ID
- `ambiguous` (boolean) - Mark as ambiguous
- `assessment_level` (string) - gold, silver, bronze, or 1-3

---

## Output File Format

The result Excel file contains multiple sheets:

### Sheets

1. **all** - All records with complete analysis
2. **onboarding** - New contractors to onboard
3. **association_fee** - Association fee required
4. **re_onboarding** - Inactive contractors to reactivate
5. **subscription_upgrade** - Subscription upgrade needed
6. **ambiguous_onboarding** - Matches requiring review
7. **restore_suspended** - Suspended accounts to restore
8. **activation_link** - Send activation links
9. **already_qualified** - Already validated contractors
10. **add_questionnaire** - Active contractors needing questionnaires
11. **missing_info** - Incomplete submissions
12. **follow_up_qualification** - Contractors needing follow-up
13. **Data to import** - Data formatted for import into CBX
14. **Existing Contractors** - Matched existing contractor data
15. **Data for HS** - Data formatted for HubSpot

### Additional Columns in Output

Beyond the input columns, these analysis columns are added:

- `cbx_id` - Matched Cognibox ID (blank if new)
- `hc_contractor_summary` - Summary of HC data
- `analysis` - Detailed match analysis with top 10 matches
- `cbx_contractor` - Matched CBX company name
- `cbx_street`, `cbx_city`, `cbx_state`, `cbx_zip`, `cbx_country` - CBX address
- `cbx_expiration_date` - CBX subscription expiry
- `registration_status` - CBX registration status
- `suspended` - CBX suspension status
- `cbx_email` - CBX contact email
- `cbx_first_name`, `cbx_last_name` - CBX contact name
- `modules` - CBX module count
- `cbx_account_type` - CBX account type
- `cbx_subscription_fee` - CBX subscription price
- `cbx_employee_price` - CBX per-employee price
- `parents` - CBX parent companies
- `previous` - CBX previous names
- `hiring_client_names` - CBX hiring clients
- `hiring_client_count` - Number of hiring clients
- `is_in_relationship` - Has relationship with hiring client
- `is_qualified` - Qualification status
- `ratio_company` - Company name match score (0-100)
- `ratio_address` - Address match score (0-100)
- `contact_match` - Email match (TRUE/FALSE)
- `cbx_assessment_level` - CBX assessment level
- `new_product` - New product flag
- `generic_domain` - Using generic email domain
- `match_count` - Total potential matches found
- `match_count_with_hc` - Matches with HC relationship
- `is_subscription_upgrade` - Upgrade required
- `upgrade_price` - Upgrade cost
- `prorated_upgrade_price` - Prorated cost
- `create_in_cbx` - Should create new record
- `action` - Recommended action
- `index` - Original row number

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "detail": "Invalid file format"
}
```

**404 Not Found:**
```json
{
  "detail": "Job not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Processing error: [error message]"
}
```

---

## Rate Limiting

No rate limiting is currently implemented. For production use, consider:
- Limiting concurrent jobs per user
- Max file size limits
- Request throttling

---

## WebSocket Alternative (Future)

For real-time progress updates, consider WebSocket implementation:

```python
@app.websocket("/ws/jobs/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await websocket.accept()
    while True:
        job = jobs.get(job_id)
        await websocket.send_json(job)
        await asyncio.sleep(1)
```

---

## Example Integration

### Python Client

```python
import requests

# Upload files
files = {
    'cbx_file': open('cbx_data.csv', 'rb'),
    'hc_file': open('hc_data.xlsx', 'rb')
}

response = requests.post('http://localhost:8000/api/match', files=files)
job = response.json()
job_id = job['job_id']

# Poll for status
import time
while True:
    status = requests.get(f'http://localhost:8000/api/jobs/{job_id}').json()
    print(f"Progress: {status['progress']*100:.1f}% - {status['message']}")
    
    if status['status'] == 'completed':
        # Download results
        result = requests.get(f'http://localhost:8000/api/jobs/{job_id}/download')
        with open('results.xlsx', 'wb') as f:
            f.write(result.content)
        break
    elif status['status'] == 'failed':
        print(f"Error: {status['error']}")
        break
    
    time.sleep(2)
```

### JavaScript Client

```javascript
// Upload files
const formData = new FormData();
formData.append('cbx_file', cbxFile);
formData.append('hc_file', hcFile);

const response = await fetch('http://localhost:8000/api/match', {
  method: 'POST',
  body: formData
});

const job = await response.json();
const jobId = job.job_id;

// Poll for status
const interval = setInterval(async () => {
  const status = await fetch(`http://localhost:8000/api/jobs/${jobId}`).then(r => r.json());
  console.log(`Progress: ${(status.progress * 100).toFixed(1)}% - ${status.message}`);
  
  if (status.status === 'completed') {
    clearInterval(interval);
    // Download results
    window.location.href = `http://localhost:8000/api/jobs/${jobId}/download`;
  } else if (status.status === 'failed') {
    clearInterval(interval);
    console.error('Error:', status.error);
  }
}, 2000);
```

---

## Performance Considerations

### Typical Response Times

- **Health check**: < 10ms
- **Start job**: < 500ms (file upload time)
- **Status check**: < 10ms
- **Download**: Depends on file size

### Processing Times

- **100 contractors**: 30-60 seconds
- **500 contractors**: 2-5 minutes
- **1000 contractors**: 5-10 minutes
- **5000 contractors**: 25-50 minutes

Processing time scales with:
- Number of HC records (linear)
- Number of CBX records (linear per HC record)
- Total: O(HC × CBX) comparisons

---

## Security Notes

⚠️ **This API is designed for internal use only:**

- No authentication required
- No authorization checks
- No rate limiting
- CORS allows all origins
- Files stored on server disk
- No data encryption at rest

**For production deployment, add:**
- JWT authentication
- Role-based access control
- Rate limiting
- Input validation
- File size limits
- Data encryption
- Audit logging
- HTTPS only

---

## Monitoring

### Check Backend Logs

```bash
tail -f backend/backend.log
```

### Check Job Queue

```bash
curl http://localhost:8000/api/jobs | python3 -m json.tool
```

### Monitor Resources

```bash
# CPU and memory
top

# Disk space
df -h

# Process status
ps aux | grep python
```

---

## Support

For API issues:
1. Check backend logs: `backend/backend.log`
2. Verify endpoints with curl
3. Check CORS configuration
4. Review request/response formats
5. See TROUBLESHOOTING.md for common issues

---

## Matching Algorithm Details (v2.1.0)

### Performance Optimizations

**Pre-normalization (5-10x faster)**
- CBX company names (EN/FR) and addresses normalized once at load
- Cached at indexes 28, 29, 30 of each CBX row
- Eliminates millions of redundant string cleaning operations

**Pre-compiled Regex (~10x faster)**
- Generic word patterns compiled at startup
- Reused across all matching operations

**Rapidfuzz Support (2-3x faster)**
- Automatic fallback: tries `rapidfuzz`, falls back to `fuzzywuzzy`
- Install with: `pip install rapidfuzz>=3.0.0`

### Matching Logic (Priority Order)

1. **Perfect Company Match (100%)**
   - If both have emails: domains must match
   - If no emails: matches on company name alone
   - Prevents false positives for common names

2. **Combined Threshold (80% + 80%)**
   - Company ≥ 80% AND Address ≥ 80%
   - Most common match type

3. **High Company Similarity (95%)**
   - Company name alone ≥ 95%
   - Ignores address

4. **Contact Match (33%)**
   - Email domain matches (non-generic)
   - Requires company ≥ 33%

5. **Exact Email (20%)**
   - Same exact email address
   - Requires company ≥ 20%

### Empty Address Handling

- If either HC or CBX address is empty: `ratio_address = 0`
- Prevents matching on non-existent data

### Sorting Priority

1. Company ratio (highest first)
2. Address ratio (highest first)
3. Hiring client count
4. Modules

---

**API Version:** 2.1  
**Last Updated:** December 2025  
**Base URL:** http://localhost:8000

