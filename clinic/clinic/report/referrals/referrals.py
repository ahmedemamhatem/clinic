# Copyright (c) 2026, GreyCube Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import flt


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	"""Define report columns"""
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
			"fieldname": "total_appointments",
			"label": _("Total Appointments"),
			"fieldtype": "Int",
			"width": 140
		},
		{
			"fieldname": "total_referrals",
			"label": _("Total Referrals"),
			"fieldtype": "Int",
			"width": 120
		},
		{
			"fieldname": "referral_percentage",
			"label": _("Referral %"),
			"fieldtype": "Percent",
			"width": 100
		},
		{
			"fieldname": "billed_referrals",
			"label": _("Billed Referrals"),
			"fieldtype": "Int",
			"width": 130
		},
		{
			"fieldname": "non_billed_referrals",
			"label": _("Non-Billed Referrals"),
			"fieldtype": "Int",
			"width": 150
		}
	]


def get_data(filters):
	"""Get report data"""
	conditions = get_conditions(filters)
	
	# Get all doctors with appointments or referrals
	doctors_query = """
		SELECT DISTINCT 
			d.name as doctor,
			d.first_name as doctor_name
		FROM 
			`tabDoctor` d
		WHERE
			EXISTS (
				SELECT 1 FROM `tabClient Appointment CT` ca 
				WHERE ca.physician = d.name {appointment_conditions}
			)
			OR EXISTS (
				SELECT 1 FROM `tabAppointment Forward` af 
				WHERE af.from_doctor = d.name {forward_conditions}
			)
		ORDER BY d.first_name
	""".format(
		appointment_conditions=conditions.get("appointment_conditions", ""),
		forward_conditions=conditions.get("forward_conditions", "")
	)
	
	doctors = frappe.db.sql(doctors_query, filters, as_dict=True)
	
	data = []
	for doctor in doctors:
		row = get_doctor_stats(doctor.doctor, filters)
		if row:
			data.append(row)
	
	return data


def get_doctor_stats(doctor, filters):
	"""Get statistics for a specific doctor"""
	
	# Get total appointments for the doctor
	appointment_conditions = ""
	if filters.get("from_date"):
		appointment_conditions += " AND ca.appointment_date >= %(from_date)s"
	if filters.get("to_date"):
		appointment_conditions += " AND ca.appointment_date <= %(to_date)s"
	
	total_appointments = frappe.db.sql("""
		SELECT COUNT(*) as count
		FROM `tabClient Appointment CT` ca
		WHERE ca.physician = %(doctor)s
		AND ca.docstatus < 2
		{conditions}
	""".format(conditions=appointment_conditions), 
	{"doctor": doctor, **filters}, as_dict=True)[0].count or 0
	
	# Get referrals where doctor forwarded to another doctor (not self-referral)
	forward_conditions = ""
	if filters.get("from_date"):
		forward_conditions += " AND DATE(af.date) >= %(from_date)s"
	if filters.get("to_date"):
		forward_conditions += " AND DATE(af.date) <= %(to_date)s"
	
	referral_stats = frappe.db.sql("""
		SELECT 
			COUNT(*) as total_referrals,
			SUM(CASE WHEN af.bill_status = 'Billed' THEN 1 ELSE 0 END) as billed_referrals,
			SUM(CASE WHEN IFNULL(af.bill_status, '') != 'Billed' THEN 1 ELSE 0 END) as non_billed_referrals
		FROM `tabAppointment Forward` af
		WHERE af.from_doctor = %(doctor)s
		AND af.from_doctor != af.to_doctor
		AND af.docstatus < 2
		{conditions}
	""".format(conditions=forward_conditions),
	{"doctor": doctor, **filters}, as_dict=True)[0]
	
	total_referrals = referral_stats.total_referrals or 0
	billed_referrals = referral_stats.billed_referrals or 0
	non_billed_referrals = referral_stats.non_billed_referrals or 0
	
	# Calculate referral percentage
	referral_percentage = 0
	if total_appointments > 0:
		referral_percentage = flt((total_referrals / total_appointments) * 100, 2)
	
	# Get doctor name
	doctor_name = frappe.db.get_value("Doctor", doctor, "first_name") or ""
	
	return {
		"doctor": doctor,
		"doctor_name": doctor_name,
		"total_appointments": total_appointments,
		"total_referrals": total_referrals,
		"referral_percentage": referral_percentage,
		"billed_referrals": billed_referrals,
		"non_billed_referrals": non_billed_referrals
	}


def get_conditions(filters):
	"""Build query conditions based on filters"""
	conditions = {
		"appointment_conditions": "",
		"forward_conditions": ""
	}
	
	if filters.get("from_date"):
		conditions["appointment_conditions"] += " AND ca.appointment_date >= %(from_date)s"
		conditions["forward_conditions"] += " AND DATE(af.date) >= %(from_date)s"
	
	if filters.get("to_date"):
		conditions["appointment_conditions"] += " AND ca.appointment_date <= %(to_date)s"
		conditions["forward_conditions"] += " AND DATE(af.date) <= %(to_date)s"
	
	if filters.get("doctor"):
		conditions["appointment_conditions"] += " AND ca.physician = %(doctor)s"
		conditions["forward_conditions"] += " AND af.from_doctor = %(doctor)s"
	
	return conditions
