from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		{
			"label": _("Document"),
			"items": [
				{
					"type": "doctype",
					"name": "Doctor",
					"description": _("Doctor")
				},
				{
					"type": "doctype",
					"name": "Customer",
					"description": _("Client")
				},
				{
					"type": "doctype",
					"name": "Client Appointment CT",
					"description": _("Client Appointment")
				},
				{
					"type": "doctype",
					"name": "Consultation",
					"description": _("Consultation")
				},
				{
					"type": "doctype",
					"name": "Client Treatment",
					"description": _("Client Treatment")
				},
				{
					"type": "doctype",
					"name": "Client Package Schedule",
					"description": _("Client Package Schedule")
				},
				{
					"type": "doctype",
					"name": "Client Session",
					"description": _("Client Session")
				}

			]
		},
		{
			"label": _("Setup"),
			"items": [
				{
					"type": "doctype",
					"name": "Doctor Designation",
					"description": _("Doctor Designation")
				},
				{
					"type": "doctype",
					"name": "Clinic Settings",
					"description": _("Clinic Settings")
				},
				{
					"type": "doctype",
					"name": "Physician Schedule",
					"description": _("Doctor Schedule")
				},
				{
					"type": "doctype",
					"name": "Food Allergy",
					"description": _("Food Allergy")
				},
				{
					"type": "doctype",
					"name": "Drug Allergy",
					"description": _("Drug Allergy")
				},
				{
					"type": "doctype",
					"name": "Diseases",
					"description": _("Recent Diseases")
				},
				{
					"type": "doctype",
					"name": "Vital",
					"description": _("Vitals")
				},
				{
					"type": "doctype",
					"name": "Drug",
					"description": _("Drug")

				},
				{
					"type": "doctype",
					"name": "Clinic Room",
					"description": _("Clinic Room")

				},
				{
					"type": "doctype",
					"name": "Clinic Nurse",
					"description": _("Clinic Nurse")

				},
				{
					"type": "doctype",
					"name": "Clinic Package",
					"description": _("Clinic Package")

				}
			]



		},
		{
			"label": _("Reports"),
			"icon": "fa fa-list",
			"items": [
				{
					"type": "report",
					"is_query_report": True,
					"name": "Clinic Sales Analytics",
					"doctype": "Sales Invoice"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Client Treatment History",
					"doctype": "Client Appointment CT"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Treatment Analytics",
					"doctype": "Client Treatment"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Appointment Analytics",
					"doctype": "Client Appointment CT"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Lead Source Billing Analysis",
					"doctype": "Sales Invoice"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Appointment Status Analysis",
					"doctype": "Client Appointment CT"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Userwise Customer Count",
					"doctype": "Customer"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Login User Report",
					"doctype": "Activity Log"
				}

			]
		}
	]
