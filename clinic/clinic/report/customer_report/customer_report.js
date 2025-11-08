// Copyright (c) 2025, GreyCube Technologies and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Customer Report"] = {
	filters: [
		// {
		// 	fieldname: "district",
		// 	label: __("District"),
		// 	fieldtype: "Link",
		// 	options: "District",
		// 	reqd: 0
		// },
		{
			fieldname: "city",
			label: __("City"),
			fieldtype: "Link",
			options: "City",
			reqd: 0
		},
		{
			fieldname: "gender",
			label: __("Gender"),
			fieldtype: "Select",
			options: ["","Male","Female"],
			reqd: 0
		},
		{
			fieldname: "group_by",
			label: __("Group By"),
			fieldtype: "Select",
			options: ["", "District", "City", "Gender"], // Added "Gender" here
			description: "Choose one classification field",
			reqd: 0
		},
		{
			fieldname: "detail",
			label: __("Show Detail"),
			fieldtype: "Check",
			default: 0
		}
	]
};