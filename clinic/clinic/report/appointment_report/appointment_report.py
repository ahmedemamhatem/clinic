# Copyright (c) 2013, GreyCube Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
	columns=[
		{
		'fieldname':'name',
		'label':_('ID'),
		'fieldtype':'Data',
		'width':140
		},
		{
		'fieldname':'patient_name',
		'label':_('Patient_Name'),
		'fieldtype':'Data',
		"width":140,
		},
		{
		'fieldname':'client',
		'label':_('Client'),
		'fieldtype':'Data',
		"options":"Customer",
		"width":140,
		},
		{
		'fieldname':'status',
		'label':_('Status'),
		'fieldtype':'Data',
		"width":140,
		}
	]
	data =[]
	data = frappe.db.get_list('Client Appointment CT',fields=['name','patient_name','client','status'])
	#frappe.msgprint("test")
	#columns, data = [], []
	return columns, data
