// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Referrals"] = {
	"filters": [
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			"reqd": 0
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today(),
			"reqd": 0
		},
		{
			"fieldname": "doctor",
			"label": __("Doctor"),
			"fieldtype": "Link",
			"options": "Doctor",
			"reqd": 0
		}
	]
};
