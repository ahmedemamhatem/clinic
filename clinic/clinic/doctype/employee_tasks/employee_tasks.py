# Copyright (c) 2024, GreyCube Technologies and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe

class EmployeeTasks(Document):
	pass

@frappe.whitelist()
def get_events(start, end, filters=None):
	"""Returns events for Gantt / Calendar view rendering.

	:param start: Start date-time.
	:param end: End date-time.
	:param filters: Filters (JSON).
	"""
	from frappe.desk.calendar import get_event_conditions
	conditions = get_event_conditions("Employee Tasks", filters)
	data = frappe.db.sql("""select name, assigned_to, assigned_to_name, status,
	 	timestamp(from_date) as
		'from_date', timestamp(to_date)
		'to_date' from `tabEmployee Tasks` where
		(from_date >= %(start)s and to_date <= %(end)s)
		and docstatus < 2 {conditions}""".format(conditions=conditions),
		{"start": start, "end": end}, as_dict=True, update={"allDay": 0})
	# for item in data:
	# 	item.appointment_datetime = item.appointment_date + datetime.timedelta(minutes = item.duration)
	for item in data:
		item["start"] = start
		item["end"] = end
	return data