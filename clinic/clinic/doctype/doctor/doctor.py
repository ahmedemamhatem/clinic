# -*- coding: utf-8 -*-
# Copyright (c) 2018, Clinic and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from dataclasses import field
import frappe
from frappe.model.document import Document

class Doctor(Document):
	pass
@frappe.whitelist()
def get_doctor_user(user):
	try:
		return frappe.db.get_list('Doctor',filters={'user_id':user},fields = ['name','first_name'])[0]
	except:
		return {'name':"","first_name":""}
	
	pass