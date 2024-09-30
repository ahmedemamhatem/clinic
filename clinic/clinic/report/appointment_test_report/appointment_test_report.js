// Copyright (c) 2016, GreyCube Technologies and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["appointment test report"] = {
	"filters": [
		{
			'fieldname':'doctor',
			'label':__('Doctor'),
			'fieldtype':"Link",
			'options':'Doctor'
		},
		{
			'fieldname':'client',
			'label':__('Client'),
			'fieldtype':"Link",
			'options':'Customer'
		},
		{
			'fieldname':'from_date',
			'label':__('from Date'),
			'fieldtype':"Date",
			'default':frappe.datetime.month_start()
		},
		{
			'fieldname':'to_date',
			'label':__('To Date'),
			'fieldtype':"Date",
			'default':frappe.datetime.month_start()
		},
		{
			'fieldname':'doctor_name',
			'label':__('Doctor Name'),
			'fieldtype':"Data",
		
		},
		{
			'fieldname':'cancelled',
			'label':__('Cancelled Report'),
			'fieldtype':"Check",
			'default':true
		},
	]
};
