# -*- coding: utf-8 -*-
# Copyright (c) 2019, GreyCube Technologies and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import getdate,formatdate,add_days
from frappe import _
from frappe.model.mapper import get_mapped_doc
from frappe.contacts.doctype.address.address import get_company_address
class NotAnOptionalHoliday(frappe.ValidationError): pass

class ClientPackageSchedule(Document):
	def on_submit(self):
		frappe.db.set_value("Client Package Schedule",self.name,"status","To Bill")

	def before_submit(self):
		for d in self.get('session_schedule'):
			doc = frappe.new_doc("Client Session")
			doc.client_package_schedule=self.name
			doc.session = d.session_name
			doc.client = self.client
			doc.client_name=self.client_name
			doc.nurse = d.nurse
			doc.is_billed = 0
			doc.date = d.session_date
			doc.time = d.session_time
			doc.skin_type=d.skin_type
			doc.room_no=d.room_no
			doc.flags.ignore_validate = True
			doc.insert(ignore_permissions=True)
			doc.save()
			d.client_session=doc.name
			# d.save()

	def on_cancel(self):
		for d in self.get('session_schedule'):
			if d.is_billed == 0:
				if frappe.db.exists("Client Session",d.client_session):
					frappe.delete_doc("Client Session",d.client_session)

@frappe.whitelist()
def make_sales_invoice(source_name, target_doc=None, ignore_permissions=False):
	def postprocess(source, target):
		set_missing_values(source, target)
		#Get the advance paid Journal Entries in Sales Invoice Advance
		if target.get("allocate_advances_automatically"):
			target.set_advances()

	def set_missing_values(source, target):
		target.is_pos = 0
		target.ignore_pricing_rule = 1
		target.flags.ignore_permissions = True
		target.run_method("set_missing_values")
		target.run_method("set_po_nos")
		target.run_method("calculate_taxes_and_totals")

		# set company address
		target.update(get_company_address(target.company))
		if target.company_address:
			target.update(get_fetch_values("Sales Invoice", 'company_address', target.company_address))


	def update_item(source, target, source_parent):
		pass
		# frappe.db.set_value("Client Session Schedule", source.name, "is_billed", 1)
		# frappe.db.set_value("Client Session", source.client_session, "is_billed", 1)


	doclist = get_mapped_doc("Client Package Schedule", source_name, {
		"Client Package Schedule": {
			"doctype": "Sales Invoice",
			"field_map": {
				"client": "customer",
				"client_name": "customer_name"
			},
			"validation": {
				"docstatus": ["=", 1]
			}
		},
		"Client Session Schedule": {
			"doctype": "Sales Invoice Item",
			"condition": lambda row: row.is_billed==0,
			"field_map": {
				"session_schedule": "name",
				"client_session_schedule": "parent",
				"session_name":"item_code",
				1:"qty",
				"amount":"rate"
			},
			"postprocess": update_item
		},
		"Sales Taxes and Charges": {
			"doctype": "Sales Taxes and Charges",
			"add_if_empty": True
		}
	}, target_doc, postprocess, ignore_permissions=ignore_permissions)

	return doclist

@frappe.whitelist()
def validate_holiday(date_to_check):
	company=frappe.db.get_value("Global Defaults", None, "default_company")
	optional_holiday_list = frappe.db.get_value("Company", company, "default_holiday_list")
	day = getdate(date_to_check)
	if frappe.db.exists({"doctype": "Holiday", "parent": optional_holiday_list, "holiday_date": day}):
		return False
	else:
		return True
		# frappe.throw(_("{0} is in Holiday List").format(formatdate(day)), NotAnOptionalHoliday)

@frappe.whitelist()
def get_next_schedule_date(date_to_check):
	correct_date=date_to_check
	while validate_holiday(date_to_check)==False:
		date_to_check=add_days(date_to_check, 1)
		correct_date=date_to_check
	else:
		return correct_date
	