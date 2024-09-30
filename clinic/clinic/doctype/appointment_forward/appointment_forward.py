# Copyright (c) 2022, GreyCube Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class AppointmentForward(Document):
	pass


@frappe.whitelist()
def update_billstatus(self,method= None):


	bill_status = self.bill_status
	# if(bill_status != "Billed"):
	# 	bill_status= "To Bill"

	if(self.parent_doctor):
		refer_list = frappe.db.get_list("Appointment Forward", filters = {
			"appointment_id" : self.name
		},
		fields = ['name', "bill_status"])
		if(refer_list):
			doc = frappe.get_doc("Appointment Forward", refer_list[0].name)
			doc.db_set("bill_status", bill_status)




	# doc = frappe.get_doc("Client Appointment CT",self.appointment)
	# bill = "To Bill"
	# if((self.status == "Partly Paid") or (self.status == "Overdue") ):
	# 	bill = "Partial Billed"
	# elif(self.status  == 'Paid'):
	# 	bill= "Billed"
	# doc.db_set('bill_status',bill)
	#print(self.appointment)
	#print(self.status)
	pass
