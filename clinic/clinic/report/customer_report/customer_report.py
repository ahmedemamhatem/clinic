# Copyright (c) 2025, GreyCube Technologies and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    filters = filters or {}
    detail = filters.get("detail")

    # Run detail or summary mode
    if detail:
        columns = get_detail_columns()
        data = get_detail_data(filters)
    else:
        group_by = (filters.get("group_by") or "").strip().lower()
        group_by_list = get_group_by_fields(group_by)
        columns = get_summary_columns(group_by_list)
        data = get_summary_data(filters, group_by_list)

    return columns, data


# ---------------------------------------------------------
# 🟢 Helper Methods
# ---------------------------------------------------------

def get_group_by_fields(group_by):
    """Return grouping fields list (default: district + city)."""
    if not group_by:
        return ["district", "city"]
    return [group_by]


def get_conditions(filters):
    """Build SQL WHERE conditions from filters."""
    conditions = []
    if filters.get("district"):
        conditions.append(f"c.district = '{filters.get('district')}'")
    if filters.get("city"):
        conditions.append(f"c.city = '{filters.get('city')}'")
    if filters.get("gender"):
        conditions.append(f"c.gender = '{filters.get('gender')}'")
    return f"WHERE {' AND '.join(conditions)}" if conditions else ""


# ---------------------------------------------------------
# 🟠 Detail Mode
# ---------------------------------------------------------

def get_detail_columns():
    """Return columns for detailed customer list."""
    return [
        {"label": "Customer", "fieldname": "customer_id", "fieldtype": "Link","options":"Customer", "width": 180},
        {"label": "Customer Name", "fieldname": "customer_name", "fieldtype": "Link","options":"Customer", "width": 180},
        {"label": "Gender", "fieldname": "gender", "fieldtype": "Data", "width": 100},
        {"label": "city", "fieldname": "city", "fieldtype": "Data", "width": 150},
        {"label": "District", "fieldname": "district", "fieldtype": "Data", "width": 150},
    ]


def get_detail_data(filters):
    """Fetch customer list based on filters."""
    where_clause = get_conditions(filters)
    query = f"""
        SELECT
            c.name AS customer_id,
            c.customer_name,
            c.gender,
            c.city,
            c.district
        FROM `tabCustomer` c
        {where_clause}
        ORDER BY c.district, c.city, c.gender
    """
    return frappe.db.sql(query, as_dict=True)


# ---------------------------------------------------------
# 🔵 Summary Mode
# ---------------------------------------------------------

def get_summary_columns(group_by_list):
    """Return summary columns dynamically based on grouping fields."""
    columns = []
    
    # Add grouping columns
    for g in group_by_list:
        columns.append({
            "label": g.replace("_", " ").title(),
            "fieldname": g,
            "fieldtype": "Data",
            "width": 200
        })
    
    # If grouping by gender, show different columns
    if "gender" in group_by_list:
        columns += [
            {"label": "Count", "fieldname": "count", "fieldtype": "Int", "width": 200},
            # {"label": "Total", "fieldname": "total", "fieldtype": "Int", "width": 200},
        ]
    else:
        # Original columns for other groupings
        columns += [
            {"label": "Male Count", "fieldname": "male_count", "fieldtype": "Int", "width": 200},
            {"label": "Female Count", "fieldname": "female_count", "fieldtype": "Int", "width": 200},
            {"label": "Total", "fieldname": "total", "fieldtype": "Int", "width": 200},
        ]
    return columns


def get_summary_data(filters, group_by_list):
    """Aggregate customers by selected classification."""
    where_clause = get_conditions(filters)
    group_select = ", ".join([f"c.{g}" for g in group_by_list])
    group_by_clause = f"GROUP BY {group_select}"

    # If grouping by gender, use different query structure
    if "gender" in group_by_list:
        query = f"""
            SELECT
                {group_select},
                COUNT(*) AS count,
                COUNT(*) AS total
            FROM `tabCustomer` c
            {where_clause}
            {group_by_clause}
            ORDER BY {group_select}
        """
    else:
        query = f"""
            SELECT
                {group_select},
                SUM(CASE WHEN c.gender = 'Male' THEN 1 ELSE 0 END) AS male_count,
                SUM(CASE WHEN c.gender = 'Female' THEN 1 ELSE 0 END) AS female_count,
                COUNT(*) AS total
            FROM `tabCustomer` c
            {where_clause}
            {group_by_clause}
            ORDER BY {group_select}
        """
    return frappe.db.sql(query, as_dict=True)