import frappe
from frappe import _
from frappe.utils import flt, getdate


@frappe.whitelist()
def get_dashboard_data(from_date=None, to_date=None, clinic=None, doctor=None, lead_source=None):
    """
    Single endpoint returning all dashboard metrics.
    Optimized: 4 queries instead of 7, with combined aggregations.
    """
    filters = {
        "from_date": getdate(from_date) if from_date else None,
        "to_date": getdate(to_date) if to_date else None,
        "clinic": clinic or None,
        "doctor": doctor or None,
        "lead_source": lead_source or None,
    }

    # ── Query 1: Appointments by status (also gives total) ──────────────
    appointments_by_status = _get_appointments_by_status(filters)
    total_appointments = sum(r.get("count", 0) for r in appointments_by_status)

    # ── Query 2: Revenue summary + per-clinic breakdown (single query) ──
    revenue_rows = _get_revenue_data(filters)
    revenue_summary = {
        "total_invoiced": 0, "total_paid": 0,
        "total_outstanding": 0, "total_discount": 0, "total_taxes": 0,
    }
    revenue_by_clinic = []
    for r in revenue_rows:
        revenue_summary["total_invoiced"] += flt(r.total_invoiced)
        revenue_summary["total_paid"] += flt(r.total_paid)
        revenue_summary["total_outstanding"] += flt(r.total_outstanding)
        revenue_summary["total_discount"] += flt(r.total_discount)
        revenue_summary["total_taxes"] += flt(r.total_taxes)
        revenue_by_clinic.append({
            "clinic": r.clinic,
            "total_invoiced": flt(r.total_invoiced),
            "total_paid": flt(r.total_paid),
        })

    # ── Query 3: Lead source + referrals (two lightweight queries) ──────
    lead_source_performance = _get_lead_source_performance(filters)
    referral_stats = _get_referral_stats(filters)

    # ── Query 4: Doctor financial (single query) ────────────────────────
    doctor_financial = _get_doctor_financial(filters)

    return {
        "appointment_summary": {"total_appointments": total_appointments},
        "appointments_by_status": appointments_by_status,
        "revenue_summary": revenue_summary,
        "revenue_by_clinic": revenue_by_clinic,
        "lead_source_performance": lead_source_performance,
        "referral_stats": referral_stats,
        "doctor_financial": doctor_financial,
    }


# ── helpers ──────────────────────────────────────────────────────────────────

def _appt_conds(filters, alias="ca"):
    cond = ""
    if filters.get("from_date"):
        cond += f" AND {alias}.appointment_date >= %(from_date)s"
    if filters.get("to_date"):
        cond += f" AND {alias}.appointment_date <= %(to_date)s"
    if filters.get("clinic"):
        cond += f" AND {alias}.clinic = %(clinic)s"
    if filters.get("doctor"):
        cond += f" AND {alias}.physician = %(doctor)s"
    return cond


def _inv_conds(filters, alias="SI"):
    cond = ""
    if filters.get("from_date"):
        cond += f" AND {alias}.posting_date >= %(from_date)s"
    if filters.get("to_date"):
        cond += f" AND {alias}.posting_date <= %(to_date)s"
    if filters.get("doctor"):
        cond += f" AND {alias}.doctor = %(doctor)s"
    return cond


# ── 1. Appointments by status (replaces two separate queries) ───────────────

def _get_appointments_by_status(filters):
    conds = _appt_conds(filters, "PA")
    return frappe.db.sql("""
        SELECT PA.status AS status, COUNT(*) AS count
        FROM `tabClient Appointment CT` PA
        WHERE PA.status != 'Cancelled' {conds}
        GROUP BY PA.status
        ORDER BY count DESC
    """.format(conds=conds), filters, as_dict=True)


# ── 2. Revenue data: per-clinic with totals derived in Python ───────────────

def _get_revenue_data(filters):
    conds = _inv_conds(filters)
    clinic_cond = " AND PA.clinic = %(clinic)s" if filters.get("clinic") else ""

    return frappe.db.sql("""
        SELECT
            IFNULL(PA.clinic, 'Unknown') AS clinic,
            COALESCE(SUM(SI.grand_total), 0) AS total_invoiced,
            COALESCE(SUM(SI.paid_amount), 0) AS total_paid,
            COALESCE(SUM(SI.outstanding_amount), 0) AS total_outstanding,
            COALESCE(SUM(SI.discount_amount), 0) AS total_discount,
            COALESCE(SUM(SI.total_taxes_and_charges), 0) AS total_taxes
        FROM `tabSales Invoice` SI
        INNER JOIN `tabClient Appointment CT` PA ON PA.name = SI.appointment
        WHERE SI.docstatus = 1 {conds} {clinic_cond}
        GROUP BY PA.clinic
        ORDER BY total_invoiced DESC
        LIMIT 15
    """.format(conds=conds, clinic_cond=clinic_cond), filters, as_dict=True)


# ── 3. Lead source (optimized: pre-materialized min-creation subquery) ──────

def _get_lead_source_performance(filters):
    if not filters.get("from_date") or not filters.get("to_date"):
        return []

    date_cond = ""
    if filters.get("from_date"):
        date_cond += " AND si.posting_date >= %(from_date)s"
    if filters.get("to_date"):
        date_cond += " AND si.posting_date <= %(to_date)s"
    lead_cond = " AND c.lead_source = %(lead_source)s" if filters.get("lead_source") else ""

    return frappe.db.sql("""
        SELECT
            IFNULL(c.lead_source, 'Unknown') AS lead_source,
            SUM(CASE WHEN mini.first_inv BETWEEN %(from_date)s AND %(to_date)s
                     THEN si.paid_amount ELSE 0 END) AS new_billing,
            SUM(CASE WHEN mini.first_inv < %(from_date)s
                     THEN si.paid_amount ELSE 0 END) AS repeat_billing
        FROM `tabCustomer` c
        INNER JOIN `tabSales Invoice` si
            ON c.name = si.customer AND si.docstatus = 1
            AND si.status IN ('Paid', 'Overdue', 'Partly Paid')
            {date_cond}
        INNER JOIN (
            SELECT customer, MIN(creation) AS first_inv
            FROM `tabSales Invoice`
            WHERE docstatus = 1
            GROUP BY customer
        ) mini ON mini.customer = c.name
        {lead_cond}
        GROUP BY c.lead_source
        HAVING new_billing > 0 OR repeat_billing > 0
        ORDER BY new_billing DESC
        LIMIT 15
    """.format(date_cond=date_cond, lead_cond=lead_cond), filters, as_dict=True)


# ── 4. Referral stats (single aggregate, no N+1) ───────────────────────────

def _get_referral_stats(filters):
    fwd_cond = ""
    if filters.get("from_date"):
        fwd_cond += " AND af.date >= %(from_date)s"
    if filters.get("to_date"):
        fwd_cond += " AND af.date <= %(to_date)s"
    if filters.get("doctor"):
        fwd_cond += " AND af.from_doctor = %(doctor)s"

    row = frappe.db.sql("""
        SELECT
            COUNT(*) AS total_referrals,
            SUM(af.bill_status = 'Billed') AS billed_referrals,
            SUM(IFNULL(af.bill_status, '') != 'Billed') AS non_billed_referrals
        FROM `tabAppointment Forward` af
        WHERE af.from_doctor != af.to_doctor
        AND af.docstatus < 2
        {fwd_cond}
    """.format(fwd_cond=fwd_cond), filters, as_dict=True)
    return row[0] if row else {"total_referrals": 0, "billed_referrals": 0, "non_billed_referrals": 0}


# ── 5. Doctor financial (single query, avg computed in SQL) ─────────────────

def _get_doctor_financial(filters):
    conds = _appt_conds(filters, "ca")
    return frappe.db.sql("""
        SELECT
            ca.physician AS doctor,
            d.first_name AS doctor_name,
            COUNT(DISTINCT ca.name) AS appointment_count,
            COALESCE(SUM(si.grand_total), 0) AS total_invoiced,
            COALESCE(SUM(si.grand_total - si.outstanding_amount), 0) AS total_paid,
            COALESCE(SUM(si.outstanding_amount), 0) AS total_outstanding,
            ROUND(COALESCE(SUM(si.grand_total - si.outstanding_amount), 0)
                  / GREATEST(COUNT(DISTINCT ca.name), 1), 2) AS average_per_appointment
        FROM `tabClient Appointment CT` ca
        INNER JOIN `tabDoctor` d ON ca.physician = d.name
        LEFT JOIN `tabSales Invoice` si
            ON si.appointment = ca.name AND si.docstatus = 1
        WHERE ca.status IN ('waiting attend', 'Attended')
        AND ca.docstatus < 2
        {conds}
        GROUP BY ca.physician, d.first_name
        ORDER BY total_paid DESC
        LIMIT 15
    """.format(conds=conds), filters, as_dict=True)
