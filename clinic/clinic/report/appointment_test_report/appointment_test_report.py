# Copyright (c) 2013, GreyCube Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
	columns=[
		{
		'fieldname':'name',
		'label':_('ID'),
		'fieldtype':'Link',
		'options':'name',
		'sort':'Desc',
		'width':140
		},
		{
		'fieldname':'patient_name',
		'label':_('Patient Name'),
		'fieldtype':'Data',
		"width":140,
		},
		{
		'fieldname':'client',
		'label':_('Client'),
		'fieldtype':'Link',
		'options':'client',
		"width":140,
		},
		{
		'fieldname':'physician',
		'label':_('Doctor'),
		'fieldtype':'Link',
		'options':'Doctor',
		'width':100
		},
		{
		'fieldname':'appointment_date',
		'label':_('Appointment Date'),
		'fieldtype':'Date',
		},
		{
		'fieldname':'doctor_name',
		'label':_('doctor name'),
		'fieldtype':'Data',
		},
		{
		'fieldname':'status',
		'label':_('Status'),
		'fieldtype':'Data',
		"width":140,
		},
		
	
	]
	filter_var = {'status':['!=','Cancelled']}
	if(filters):
		if(filters.client):
			filter_var['client'] = filters.client
		if(filters.doctor):
			filter_var['physician'] = filters.doctor
		if(filters.doctor_name):
			filter_var['doctor_name'] = filters.doctor_name
		if(filters.cancelled):
			filter_var['status'] = ['=','Cancelled']
		if(filters.appointment_date):
			filter_var['modified'] = ['>=',filters.appointment_date]

	data =[]
	data = frappe.db.get_list('Client Appointment CT',fields=['name','patient_name','client','status','physician','appointment_date','doctor_name'],filters=filter_var,order_by='name Desc')
	
	if(filters.cancelled):
		data = frappe.db.get_list('Client Appointment CT',fields=['physician','doctor_name','count(status) as count','status'],filters=filter_var,group_by = 'physician',order_by='count desc')
		columns=[
		{
		'fieldname':'physician',
		'label':_('Doctor'),
		'fieldtype':'Link',
		'options':'Doctor',
		'width':100
		},
		{
		'fieldname':'doctor_name',
		'label':_('doctor name'),
		'fieldtype':'Data',
		},
		{
		'fieldname':'count',
		'label':_('Count'),
		'fieldtype':'Int',
		'Sort':'Desc',
		},
		{
		'fieldname':'status',
		'label':_('Status'),
		'fieldtype':'Data',
		"width":140,
		},
		]


	return columns, data
