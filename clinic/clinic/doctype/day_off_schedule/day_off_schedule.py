# Copyright (c) 2023, GreyCube Technologies and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe
from frappe.utils import getdate
from frappe.utils import add_to_date


class DayoffSchedule(Document):

	def on_update(self):
		#print("is new : {} name {} is child {}".format(self.is_new(),self.name, self.is_child))
		if(self.is_new() != None and self.is_child == 0):
			frappe.db.set_value("Day off Schedule",self.name,"is_parent",True)
			#self.is_parent=  True
			for val in range(1,self.repeat+1):
				doc = frappe.new_doc("Day off Schedule")
				doc.doctor = self.doctor
				doc.repeat = 0
				doc.repeat_every = 0
				doc.from_time = self.from_time
				doc.to_time = self.to_time
				doc.date =add_to_date(getdate(self.date), days=self.repeat_every*val,as_string= True)
				doc.note = self.note
				doc.parent_id = self.name
				doc.is_child = True
				#print("{}   {}".format(getdate(self.date), type(getdate(self.date))))
				doc.insert()
		pass



	pass
