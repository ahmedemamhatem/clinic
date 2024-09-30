// Copyright (c) 2016, GreyCube Technologies and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Appointment Report"] = {
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
			'fieldname':'appointment_date',
			'label':__('Date'),
			'fieldtype':"Date",
		
		},
		{
			'fieldname':'cancelled',
			'label':__('Cancelled Report'),
			'fieldtype':"Check",
			'default':false
		},
		
	]
};
