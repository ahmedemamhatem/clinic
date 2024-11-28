# Copyright (c) 2024, GreyCube Technologies and contributors
# For license information, please see license.txt

import frappe

from frappe import _
from datetime import datetime
def execute(filters=None):
	columns, data = get_columns(), get_data(filters)
	return columns, data



def get_data(filters):
	from_date=datetime.strptime(filters.get("from_date"),'%Y-%m-%d').date()
	to_date=datetime.strptime(filters.get("to_date"),'%Y-%m-%d').date()

	sql=f""" select c.name as client,c.customer_name as client_name,cact.name as appointment,cact.appointment_date as appointment_date from `tabCustomer` c
			join `tabClient Appointment CT`  cact on c.name=cact.client
			where cact.appointment_date between '{from_date}' and '{to_date}'
			and  cact.status='Attended'
			and cact.appointment_date=(
				select min(a2.appointment_date)
				from `tabClient Appointment CT` a2
				where a2.client=c.name
			);"""
	data=frappe.db.sql(sql,as_dict=True)
	
	return data
def get_columns():
	columns=[
		{
			"label":_("Client"),
			"fieldname":"client",
			"fieldtype":"Link",
			"options":"Customer",
		},
		{
			"label":_("Client Name"),
			"fieldname":"client_name",
			"fieldtype":"Data",
		},
		{
			"label":_("Appointment"),
			"fieldname":"appointment",
			"fieldtype":"Link",
			"options":"Client Appointment CT",
		},
		{
			"label":_("Appointment Date"),
			"fieldname":"appointment_date",
			"fieldtype":"Data",
		}
	]
	return columns
