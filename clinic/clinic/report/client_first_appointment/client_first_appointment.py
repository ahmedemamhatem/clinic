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
	tmp_list=[]
	all_customers=frappe.db.get_all("Customer",filters={"disabled":0},fields=["name","customer_name"])

	for customer in all_customers:
		cact=frappe.db.get_all("Client Appointment CT",filters={"client":customer["name"]},fields=["name","appointment_date"],order_by='appointment_date ASC' ,limit=1)
		if cact:
			if  from_date <= cact[0]["appointment_date"]<= to_date:
				obj={"client":customer["name"],"client_name":customer["name"],"appointment":cact[0]["name"],"appointment_date":cact[0]["appointment_date"]}
				tmp_list.append(obj)

	return tmp_list				

	# sql=f""" select c.name,c.customer_name from `tabCustomer` c
	# 		join `tabClient Appointment CT`  cact on c.name=cact.client
	# 		where cact.appointment_date between {from_date} and {to_date}
	# 		and cact.appointment_date=(
	# 			select min(a2.appointment_date)
	# 			from `tabClient Appointment CT` a2
	# 			where a2.client=c.name
	# 		);"""

def get_columns():
	columns=[
		{
			"label":_("Client"),
			"fieldname":"client",
			"fieldtype":"Link",
			"options":"Customer",
			"width":150
		},
		{
			"label":_("Client Name"),
			"fieldname":"client_name",
			"fieldtype":"Data",
			"width":150
		},
		{
			"label":_("Appointment"),
			"fieldname":"appointment",
			"fieldtype":"Link",
			"options":"Client Appointment CT",
			"width":150
		},
		{
			"label":_("Appointment Date"),
			"fieldname":"appointment_date",
			"fieldtype":"Data",
			"width":150
		}
	]
	return columns
