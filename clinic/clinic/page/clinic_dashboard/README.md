# Clinic Dashboard — Manager Analytics

## Overview
This page provides a high-level analytics dashboard for clinic managers, aggregating data from 5 existing reports into a single visual interface.

**URL:** `/app/clinic-dashboard`

---

## Data Sources

| Section | Source Report | Report Type |
|---------|-------------|-------------|
| Appointment counts & status breakdown | Appointment Analytics | Query Report |
| Revenue totals & per-clinic revenue | Clinic Sales Analytics | Query Report |
| New vs repeat billing by lead source | Lead Source Billing Analysis | Query Report + Script |
| Referral counts (billed / non-billed) | Referrals | Script Report |
| Per-doctor financial breakdown | Appointment Financial Summary | Script Report |

---

## Dashboard Sections

### 1. KPI Cards
Five summary cards displayed at the top:
- **Total Appointments** — count of non-cancelled appointments in the date range
- **Total Revenue** — sum of paid amounts from submitted Sales Invoices
- **Outstanding** — sum of unpaid invoice amounts
- **Referrals** — total inter-doctor referrals (excluding self-referrals)
- **Avg / Appointment** — average payment per attended appointment

### 2. Referral Stats Row
Three smaller cards showing referral breakdown:
- Total Referrals
- Billed Referrals
- Non-Billed Referrals

### 3. Charts (2×2 Grid)
- **Appointments by Status** (Donut) — visual breakdown of appointment statuses
- **Revenue by Clinic** (Bar) — invoiced vs paid amounts per clinic/department
- **Lead Source Performance** (Bar) — new billing vs repeat billing by lead source
- **Top Doctors by Revenue** (Bar) — paid vs outstanding per doctor (top 10)

### 4. Doctor Financial Table
Detailed table with columns:
- Doctor Name
- Appointment Count
- Total Invoiced
- Total Paid
- Total Outstanding
- Average per Appointment

---

## Filters
All filters are optional. Click **Refresh** to apply.

| Filter | Type | Description |
|--------|------|-------------|
| From Date | Date | Start of date range (default: 1st of current month) |
| To Date | Date | End of date range (default: last day of current month) |
| Clinic | Link → Department | Filter by specific clinic/department |
| Doctor | Link → Doctor | Filter by specific doctor |
| Lead Source | Link → Lead Source | Filter lead source chart data |

---

## Database Tables Used

| Table | Purpose |
|-------|---------|
| `tabClient Appointment CT` | Appointment records (status, clinic, doctor, dates) |
| `tabSales Invoice` | Invoice and payment data (amounts, status) |
| `tabDoctor` | Doctor details |
| `tabCustomer` | Customer lead source information |
| `tabAppointment Forward` | Referral records between doctors |
| `tabPayment Entry` | Payment entries for lead source billing |

---

## File Structure

```
clinic_dashboard/
├── __init__.py                  # Python package marker
├── clinic_dashboard.html        # Page HTML template
├── clinic_dashboard.json        # Frappe page definition
├── clinic_dashboard.py          # Backend API (get_dashboard_data)
├── clinic_dashboard.js          # Frontend rendering & charts
└── clinic_dashboard.css         # Dashboard styling
```

---

## API Endpoint

**Method:** `clinic.clinic.page.clinic_dashboard.clinic_dashboard.get_dashboard_data`

**Parameters:** `from_date`, `to_date`, `clinic`, `doctor`, `lead_source`

**Returns:** Dictionary with keys:
- `appointment_summary` — `{total_appointments}`
- `appointments_by_status` — list of `{status, count}`
- `revenue_summary` — `{total_invoiced, total_paid, total_outstanding, total_discount, total_taxes}`
- `revenue_by_clinic` — list of `{clinic, total_invoiced, total_paid}`
- `lead_source_performance` — list of `{lead_source, new_billing, repeat_billing}`
- `referral_stats` — `{total_referrals, billed_referrals, non_billed_referrals}`
- `doctor_financial` — list of `{doctor, doctor_name, appointment_count, total_invoiced, total_paid, total_outstanding, average_per_appointment}`

---

## Permissions
Inherits permissions from the Page doctype definition in `clinic_dashboard.json`. Currently accessible by all roles (no specific role restrictions configured).
