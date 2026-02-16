// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Appointment Financial Summary"] = {
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
			"fieldtype": "MultiSelectList",
			"options": "Doctor",
			"reqd": 0,
			"get_data": function(txt) {
				return frappe.db.get_link_options('Doctor', txt);
			}
		}
	]
};
