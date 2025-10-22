// Copyright (c) 2024, GreyCube Technologies and contributors
// For license information, please see license.txt
/* eslint-disable */

document.head.innerHTML +="<style>.dt-cell--col-0,.dt-cell__content--col-0{width:70px!important;}</style>";
frappe.query_reports["Client First Appointment"] = {

	//document.head.innerHTML +="<style>.dt-cell--col-0,.dt-cell__content--col-0{width:70px!important;}</style>";


	formatter:function(value,row,column,data,default_formatter){
		
			column.width=300;

			return default_formatter(value,row,column,data);
		
	},
	"filters": [
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_start()
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_end()
		}
	]
};
