import frappe
from frappe.utils import add_to_date, now_datetime


def archive_customer_progress_rows(hours=24):
    """Move old rows from Customer.client_progress to Customer.client_progress_ct."""
    cutoff = add_to_date(now_datetime(), hours=-int(hours))

    frappe.log_error(
        title="Customer Progress Archive Started",
        message=f"Archiving Customer Progress rows created on or before {cutoff}",
    )
    rows = frappe.get_all(
        "Patient Progress CT",
        filters={
            "parenttype": "Customer",
            "parentfield": "client_progress",
            "added_on": ["<=", cutoff],
        },
        fields=[
            "name",
            "parent",
            "observation_date",
            "observation",
            "doctor_name",
            "user",
            "physiciann",
            "added_on",
        ],
        order_by="parent asc, idx asc",
    )

    if not rows:
        return 0

    moved_count = 0

    for row in rows:
        try:
            # Insert into archive child table first, then remove source row.
            frappe.get_doc(
                {
                    "doctype": "Patient Progress CT",
                    "parent": row.parent,
                    "parenttype": "Customer",
                    "parentfield": "client_progress_ct",
                    "observation_date": row.observation_date,
                    "observation": row.observation,
                    "doctor_name": row.doctor_name,
                    "user": row.user,
                    "physiciann": row.physiciann,
                }
            ).insert(ignore_permissions=True)

            frappe.delete_doc(
                "Patient Progress CT",
                row.name,
                ignore_permissions=True,
                force=1,
                delete_permanently=True,
            )
            moved_count += 1
        except Exception:
            frappe.log_error(
                title="Customer Progress Archive Failed",
                message=frappe.get_traceback(),
            )

    if moved_count:
        frappe.db.commit()

    return moved_count
