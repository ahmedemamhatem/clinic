# Copyright (c) 2026, GreyCube Technologies and contributors
# For license information, please see license.txt

"""
Appointment Financial Summary Report

This report provides a comprehensive financial overview for each doctor based on their attended appointments.
It shows the number of appointments and their associated payment statistics from linked Sales Invoices.

Report Displays:
- Doctor name and details
- Count of appointments with status 'waiting attend' or 'Attended'
- Total amount invoiced for those appointments
- Total amount paid (collected)
- Total outstanding amount (unpaid)
- Average payment received per appointment

Performance Optimization:
Uses a single optimized SQL query with JOINs and GROUP BY to fetch all data at once,
avoiding N+1 query problems and improving report generation speed significantly.
"""

import frappe
from frappe import _
from frappe.utils import flt


def execute(filters=None):
	"""
	Main entry point for the report.
	Returns columns definition and data rows based on filters.
	"""
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	"""
	Define report columns with proper formatting.
	
	Returns:
		List of column definitions with fieldname, label, fieldtype, and width
	"""
	return [
		{
			"fieldname": "doctor",
			"label": _("Doctor"),
			"fieldtype": "Link",
			"options": "Doctor",
			"width": 150
		},
		{
			"fieldname": "doctor_name",
			"label": _("Doctor Name"),
			"fieldtype": "Data",
			"width": 150
		},
		{
			"fieldname": "appointment_count",
			"label": _("Appointment Count"),
			"fieldtype": "Int",
			"width": 140
		},
		{
			"fieldname": "total_invoiced",
			"label": _("Total Invoiced"),
			"fieldtype": "Currency",
			"width": 140
		},
		{
			"fieldname": "total_paid",
			"label": _("Total Paid"),
			"fieldtype": "Currency",
			"width": 140
		},
		{
			"fieldname": "total_outstanding",
			"label": _("Total Outstanding"),
			"fieldtype": "Currency",
			"width": 140
		},
		{
			"fieldname": "average_per_appointment",
			"label": _("Average/Appointment"),
			"fieldtype": "Currency",
			"width": 150
		}
	]


def get_data(filters):
	"""
	Fetch and process report data with optimized single-query approach.
	
	Query Logic:
	1. Starts with Client Appointment CT (appointments) as base table
	2. INNER JOIN with Doctor table to get doctor details
	3. LEFT JOIN with Sales Invoice to get payment data (LEFT because not all appointments have invoices)
	4. Filters appointments by status ('waiting attend' or 'Attended')
	5. Groups results by doctor to aggregate all their appointments
	6. Calculates financial totals using SUM() aggregation
	
	What the query retrieves:
	- doctor: Doctor ID (primary key)
	- doctor_name: Doctor's first name
	- appointment_count: Total number of appointments with specified status
	- total_invoiced: Sum of all invoice grand_total amounts
	- total_paid: Sum of (grand_total - outstanding_amount) = collected payments
	- total_outstanding: Sum of all unpaid amounts from invoices
	
	Args:
		filters: Dictionary containing from_date, to_date, and doctor filters
		
	Returns:
		List of dictionaries, one per doctor with their financial statistics
	"""
	conditions = get_conditions(filters)
	
	# Single optimized query to get all data at once
	# This replaces multiple queries (one per doctor) with a single efficient query
	query = """
		SELECT 
			ca.physician as doctor,
			d.first_name as doctor_name,
			COUNT(DISTINCT ca.name) as appointment_count,
			COALESCE(SUM(si.grand_total), 0) as total_invoiced,
			COALESCE(SUM(si.grand_total - si.outstanding_amount), 0) as total_paid,
			COALESCE(SUM(si.outstanding_amount), 0) as total_outstanding
		FROM 
			`tabClient Appointment CT` ca
		INNER JOIN 
			`tabDoctor` d ON ca.physician = d.name
		LEFT JOIN 
			`tabSales Invoice` si ON si.appointment = ca.name 
			AND si.docstatus = 1
		WHERE 
			ca.status IN ('waiting attend', 'Attended')
			AND ca.bill_status = "Billed"
			AND ca.docstatus < 2
			{conditions}
		GROUP BY 
			ca.physician, d.first_name
		ORDER BY 
			d.first_name
	""".format(conditions=conditions)
	
	data = frappe.db.sql(query, filters, as_dict=True)
	
	# Calculate average payment per appointment (done in-memory for efficiency)
	# Average = Total Paid / Number of Appointments
	for row in data:
		if row.appointment_count > 0:
			row['average_per_appointment'] = flt(row.total_paid / row.appointment_count, 2)
		else:
			row['average_per_appointment'] = 0
	
	return data


def get_conditions(filters):
	"""
	Build SQL WHERE clause conditions based on user-selected filters.
	
	Filters applied:
	- from_date: Include appointments from this date onwards (appointment_date >= from_date)
	- to_date: Include appointments up to this date (appointment_date <= to_date)
	- doctor: Filter by specific doctor(s) - supports multiple selection using IN clause
	
	Args:
		filters: Dictionary containing filter values
		
	Returns:
		String: SQL conditions to append to WHERE clause (starts with "AND")
	"""
	conditions = ""
	
	if filters.get("from_date"):
		conditions += " AND ca.appointment_date >= %(from_date)s"
	
	if filters.get("to_date"):
		conditions += " AND ca.appointment_date <= %(to_date)s"
	
	if filters.get("doctor"):
		# Handle multi-select: doctor filter can be a list of doctor names
		doctors = filters.get("doctor")
		if isinstance(doctors, str):
			# Convert comma-separated string to list
			doctors = [d.strip() for d in doctors.split(",") if d.strip()]
		if doctors:
			conditions += " AND ca.physician IN %(doctor)s"
			filters["doctor"] = doctors
	
	return conditions
