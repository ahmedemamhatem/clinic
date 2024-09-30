# -*- coding: utf-8 -*-
# Copyright (c) 2015, ESS LLP and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
import json
from frappe.utils import getdate, cint
from frappe import _
import datetime
from frappe.core.doctype.sms_settings.sms_settings import send_sms
from clinic.clinic.doctype.clinic_settings.clinic_settings import get_receivable_account,get_income_account


class ClientAppointmentCT(Document):
	def on_update(self):
		today = datetime.date.today()
		appointment_date = getdate(self.appointment_date)


	def onload(self):
		# if self.parent_doctor:
		# 	self.flags.ignore_permissions = True
		# pass
		# self.ignore_permissions = True
		pass

	def save(self, *args, **kwargs):

		self.flags.ignore_permissions = True
		# duration is the only changeable field in the document
		if not self.is_new():
			self.db_set('duration', cint(self.duration))
			self.db_set('physician', self.physician)
			self.db_set('doctor_name', frappe.db.get_value("Doctor",self.physician,"first_name"))
			self.db_set('appointment_date', self.appointment_date)
			self.db_set('appointment_time', self.appointment_time)
			self.db_set('from_doctor', self.from_doctor)
			self.db_set('to_doctor', self.to_doctor)
			self.db_set('status', self.status)
		else:
			super(ClientAppointmentCT, self).save(*args, **kwargs)


def appointment_cancel(appointment_id):
	appointment = frappe.get_doc("Client Appointment CT", appointment_id)

	# If invoice --> fee_validity update with -1 visit
	if appointment.sales_invoice:
		validity = frappe.db.exists({"doctype": "Fee Validity", "ref_invoice": appointment.sales_invoice})
		if validity:
			fee_validity = frappe.get_doc("Fee Validity", validity[0][0])
			visited = fee_validity.visited - 1
			frappe.db.set_value("Fee Validity", fee_validity.name, "visited", visited)
			if visited <= 0:
				frappe.msgprint(
					_("Appointment cancelled, Please review and cancel the invoice {0}".format(appointment.sales_invoice))
				)
			else:
				frappe.msgprint(_("Appointment cancelled"))


@frappe.whitelist()
def get_availability_data(date, physician,duration = 15,notRamadan ='0'):
	"""
	Get availability data of 'physician' on 'date'
	:param date: Date to check in schedule
	:param physician: Name of the physician
	:param duration: uration of the appointment
	:return: dict containing a list of available slots, list of appointments and time of appointments
	"""

	date = getdate(date)
	weekday = date.strftime("%A")

	available_slots = []
	physician_schedule_name = None
	physician_schedule = None
	time_per_appointment = None

	#get ramadan start and end date
	
	ramadan_date =getdate( frappe.db.get_single_value("Ramadan Date","ramadan_start_date"))
	ramadan_end_date = getdate( frappe.db.get_single_value("Ramadan Date","ramadan_end_date"))

	#get ramadan schedule if it is ramadan
	if(getdate(date)==ramadan_date and (notRamadan == '0')):
		physician_schedule_name = frappe.db.get_value("Doctor",physician,"ramadan_schedule")
	elif(getdate(date)>ramadan_date and getdate(date)<=ramadan_end_date):
		physician_schedule_name = frappe.db.get_value("Doctor",physician,"ramadan_schedule")
	else:
		# get physicians schedule
		physician_schedule_name = frappe.db.get_value("Doctor", physician, "physician_schedule")


	if physician_schedule_name:
		physician_schedule = frappe.get_doc("Physician Schedule CT", physician_schedule_name)

		if(duration and int(duration)>15):
			time_per_appointment = duration
		else:
			time_per_appointment = frappe.db.get_value("Doctor", physician, "time_per_appointment")
		#frappe.msgprint(json.dumps(time_per_appointment))
	else:
		frappe.throw(_("Dr {0} does not have a Physician Schedule. Add it in Physician master".format(physician)))

	#custom:inside below block i did change divide block (from_time to to_time and each divide time per appointment)

	if physician_schedule:
		for t in physician_schedule.time_slots:
			if weekday == t.day:
				from_time=t.from_time
				to_time=t.to_time
				while from_time<to_time:
					time={}
					time["from_time"]=from_time
					time["to_time"]=from_time+datetime.timedelta(minutes = int(time_per_appointment))
					if(to_time>=time['to_time'] or to_time >= datetime.timedelta(hours=23, minutes=59)):
						available_slots.append(time)
					from_time=from_time+datetime.timedelta(minutes = int(time_per_appointment))

	# `time_per_appointment` should never be None since validation in `Patient` is supposed to prevent
	# that. However, it isn't impossible so we'll prepare for that.
	if not time_per_appointment:
		frappe.throw(_('"Time Per Appointment" hasn"t been set for Dr {0}. Add it in Physician master.').format(physician))

	# if physician not available return
	if not available_slots:
		# TODO: return available slots in nearby dates
		frappe.throw(_("Physician not available on {0}").format(weekday))

	# if physician on leave return

	# if holiday return
	# if is_holiday(weekday):

	# get appointments on that day for physician
	appointments = frappe.get_all(
		"Client Appointment CT",
		filters={"physician": physician, "appointment_date": date},
		fields=["name", "appointment_time", "duration", "status"])

	return {
		"available_slots": available_slots,
		"appointments": appointments,
		"time_per_appointment": time_per_appointment
	}


@frappe.whitelist()
def get_time_off(date, physician):
	"""
	get time off for 'physician' on 'date'
	"""

	data = []
	day_off = frappe.db.get_list("Day off Schedule",filters={"Date":date,'Doctor':physician},fields=['from_time','to_time',"doctor"])
	
	#returning the time off in the same data shape(format) of the appointment
	for item in day_off:
		data.append(
			{
				'name':'none',
				'appointment_time':item.from_time,
				'duration':(item.to_time-item.from_time).total_seconds()/60,
				'status':'closed'
			}
		)
		
	return data		

@frappe.whitelist()
def update_status(appointment_id, status):
	old_status = ''
	if(appointment_id[:3] == "COP"):
		doc = frappe.get_doc("Client Appointment CT", appointment_id)
		old_status = doc.status
	frappe.db.set_value("Client Appointment CT", appointment_id, "status", status)
	if((status == "Attended" or status == 'waiting attend') and status != old_status):
		doc = frappe.get_doc("Client Appointment CT", appointment_id)
		doc.add_comment('Edit', 'status was changed to {}'.format(status))
		doc.save()
	if status == "Cancelled":
		appointment_cancel(appointment_id)

@frappe.whitelist()
def update_attended_field(appointment_id,state):
	frappe.db.set_value("Client Appointment CT",appointment_id,"attended",state)

@frappe.whitelist()
def set_open_appointments():
	today = getdate()
	frappe.db.sql(
		"update `tabClient Appointment CT` set status='Open' where status = 'Scheduled'"
		" and appointment_date = %s", today)


@frappe.whitelist()
def set_pending_appointments():
	today = getdate()
	frappe.db.sql(
		"update `tabClient Appointment CT` set status='Pending' where status in "
		"('Scheduled','Open') and appointment_date < %s", today)


def confirm_sms(doc):
	if frappe.db.get_value("Healthcare Settings", None, "app_con") == '1':
		message = frappe.db.get_value("Healthcare Settings", None, "app_con_msg")
		send_message(doc, message)


#custom:generate item
@frappe.whitelist()
def getItemForInvoice(appointment):
	consultant_data=frappe.get_all("Consultation",filters=[("Consultation","appointment","=",appointment),("Consultation","is_bill","!=",1)],fields=["name"])
	items=[]
	if len(consultant_data)>0:
		consult=frappe.get_doc("Consultation",consultant_data[0].name)
		line_item={}
		line_item["item_code"]=frappe.db.get_value("Clinic Settings","Clinic Settings","consultant_item")
		line_item["qty"]=1
		line_item["consultation"]=consultant_data[0].name
		op_consulting_charge = frappe.db.get_value("Doctor",consult.physician, "op_consulting_charge")
		cost_center = frappe.db.get_value("Doctor",consult.physician, "cost_center")
		if op_consulting_charge:
			line_item["rate"] = op_consulting_charge
		if cost_center:
			line_item["cost_center"]=cost_center
		items.append(line_item)

	treatment_data=frappe.get_all("Client Treatment",filters=[("Client Treatment","appointment","=",appointment),("Client Treatment","status","in",["Pending","Completed"]),("Client Treatment","is_bill","!=",1)],fields=["name"])
	if len(treatment_data)>0:
		for row in treatment_data:
			treatment=frappe.get_doc("Client Treatment",row.name)
			line_item={}
			line_item["item_code"]=treatment.treatment
			line_item["qty"]=treatment.qty
			line_item["treatment"]=row.name
			cost_center = frappe.db.get_value("Doctor",treatment.doctor, "cost_center")
			if cost_center:
				line_item["cost_center"]=cost_center

			items.append(line_item)
	return items


#custom:use to make invoice
@frappe.whitelist()
def create_forward(from_doctor, appointment_id, appointment_date, to_doctor):
	#if not appointment_id:
	#	return False
	appointment_doc = frappe.get_doc('Client Appointment CT', appointment_id)
	appointment_forward=frappe.get_doc(dict(
		doctype="Appointment Forward",
		from_doctor=from_doctor,
		date=getdate(),
		appointment_id=appointment_id,
		to_doctor=to_doctor,
		patient_name = appointment_doc.patient_name
		
	)).insert()
	return appointment_forward.name
	

#custom:use to make invoice
@frappe.whitelist()
def create_invoice(company, physician, patient, appointment_id, appointment_date):
	#if not appointment_id:
	#	return False

	#item_obj=getItemArray(company,physician,patient,appointment_id,appointment_date)
	item_object=getItemForInvoice(appointment_id)
	if len(item_object)>0:
		sales_invoice=frappe.get_doc(dict(
			doctype="Sales Invoice",
			customer=patient,
			due_date=getdate(),
			appointment=appointment_id,
			items=item_object
		)).insert()
		return sales_invoice.name
	else:
		return False	

def getItems(item_obj):
	items=[]
	counter=0
	obj=json.loads(item_obj)
	while counter<len(obj):
		line_item={}
		if not obj[counter][:2]=='CT':
			consult_data=frappe.get_doc("Consultation",obj[counter])
			line_item["item_code"]=frappe.db.get_value("Healthcare Settings","Healthcare Settings","consultant_item")
			line_item["qty"]=1
			op_consulting_charge = frappe.db.get_value("Doctor",consult_data.physician, "op_consulting_charge")
			cost_center = frappe.db.get_value("Doctor",consult_data.physician, "cost_center")

			if op_consulting_charge:
				line_item["rate"] = op_consulting_charge
			if cost_center:
				line_item["cost_center"]=cost_center

			items.append(line_item)

		else:
			treatment_data=frappe.get_doc("Client Treatment",obj[counter])
			line_item["item_code"]=treatment_data.treatment
			line_item["qty"]=treatment_data.qty
			cost_center = frappe.db.get_value("Doctor",treatment_data.doctor, "cost_center")
			if cost_center:
				line_item["cost_center"]=cost_center

			items.append(line_item)
		counter=counter+1
	return items



	
		


			
			
	

def get_fee_validity(physician, patient, date):
	validity_exist = validity_exists(physician, patient)
	if validity_exist:
		fee_validity = frappe.get_doc("Fee Validity", validity_exist[0][0])
		fee_validity = update_fee_validity(fee_validity, date)
	else:
		fee_validity = create_fee_validity(physician, patient, date)
	return fee_validity


def validity_exists(physician, patient):
	return frappe.db.exists({
			"doctype": "Fee Validity",
			"physician": physician,
			"patient": patient})


def update_fee_validity(fee_validity, date):
	max_visit = frappe.db.get_value("Healthcare Settings", None, "max_visit")
	valid_days = frappe.db.get_value("Healthcare Settings", None, "valid_days")
	if not valid_days:
		valid_days = 1
	if not max_visit:
		max_visit = 1
	date = getdate(date)
	valid_till = date + datetime.timedelta(days=int(valid_days))
	fee_validity.max_visit = max_visit
	fee_validity.visited = 1
	fee_validity.valid_till = valid_till
	fee_validity.save(ignore_permissions=True)
	return fee_validity


def create_fee_validity(physician, patient, date):
	fee_validity = frappe.new_doc("Fee Validity")
	fee_validity.physician = physician
	fee_validity.patient = patient
	fee_validity = update_fee_validity(fee_validity, date)
	return fee_validity


def create_invoice_items(appointment_id, physician, company, invoice):
	item_line = invoice.append("items")
	item_line.item_name = "Consulting Charges"
	item_line.description = "Consulting Charges:  " + physician
	item_line.qty = 1
	item_line.uom = "Nos"
	item_line.conversion_factor = 1
	item_line.income_account = get_income_account(physician, company)
	op_consulting_charge = frappe.db.get_value("Doctor", physician, "op_consulting_charge")
	if op_consulting_charge:
		item_line.rate = op_consulting_charge
		item_line.amount = op_consulting_charge
	return invoice

def create_invoice_items1(appointment_id, physician, company, invoice):
	item_line = invoice.append("items")
	item_line.item_name = "Consulting Charges"
	item_line.description = "Consulting Charges:  " + physician
	item_line.qty = 1
	item_line.uom = "Nos"
	item_line.conversion_factor = 1
	item_line.income_account = get_income_account(physician, company)
	op_consulting_charge = frappe.db.get_value("Doctor", physician, "op_consulting_charge")
	if op_consulting_charge:
		item_line.rate = op_consulting_charge
		item_line.amount = op_consulting_charge
	return invoice


@frappe.whitelist()
def create_consultation(appointment):
	appointment = frappe.get_doc("Client Appointment CT", appointment)
	consultation = frappe.new_doc("Consultation")
	consultation.appointment = appointment.name
	consultation.patient = appointment.client
	consultation.patient_name=appointment.patient_name
	consultation.physician = appointment.physician
	consultation.doctor_name=appointment.doctor_name	
	consultation.consultation_date = appointment.appointment_date
	if appointment.sales_invoice:
		consultation.invoice = appointment.sales_invoice
	return consultation.as_dict()


def remind_appointment():
	if frappe.db.get_value("Healthcare Settings", None, "app_rem") == '1':
		rem_before = datetime.datetime.strptime(frappe.get_value("Healthcare Settings", None, "rem_before"), "%H:%M:%S")
		rem_dt = datetime.datetime.now() + datetime.timedelta(
			hours=rem_before.hour, minutes=rem_before.minute, seconds=rem_before.second)

		appointment_list = frappe.db.sql(
			"select name from `tabClient Appointment CT` where start_dt between %s and %s and reminded = 0 ",
			(datetime.datetime.now(), rem_dt)
		)

		for i in range(0, len(appointment_list)):
			doc = frappe.get_doc("Client Appointment CT", appointment_list[i][0])
			message = frappe.db.get_value("Healthcare Settings", None, "app_rem_msg")
			send_message(doc, message)
			frappe.db.set_value("Client Appointment CT", doc.name, "reminded",1)

'''
def send_message(doc, message):
	patient = frappe.get_doc("Patient", doc.patient)
	if patient.mobile:
		context = {"doc": doc, "alert": doc, "comments": None}
		if doc.get("_comments"):
			context["comments"] = json.loads(doc.get("_comments"))

		# jinja to string convertion happens here
		message = frappe.render_template(message, context)
		number = [patient.mobile]
		send_sms(number, message)'''


@frappe.whitelist()
def get_events(start, end, filters=None):
	"""Returns events for Gantt / Calendar view rendering.

	:param start: Start date-time.
	:param end: End date-time.
	:param filters: Filters (JSON).
	"""
	from frappe.desk.calendar import get_event_conditions
	conditions = get_event_conditions("Client Appointment CT", filters)
	data = frappe.db.sql("""select name, client as patient, physician, status,
		duration, timestamp(appointment_date, appointment_time) as
		'appointment_date' from `tabClient Appointment CT` where
		(appointment_date between %(start)s and %(end)s)
		and docstatus < 2 {conditions}""".format(conditions=conditions),
		{"start": start, "end": end}, as_dict=True, update={"allDay": 0})
	for item in data:
		item.appointment_datetime = item.appointment_date + datetime.timedelta(minutes = item.duration)
	return data

@frappe.whitelist()
def get_doctor(first_name):
	return 'meow'
	#doctor_code = frappe.db.get_value("Doctor",fieldname = ['name'],filters={'first_name':first_name})
	#return doctor_code
	pass
from frappe.desk.reportview import get_filters_cond, get_match_cond
@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def client_get_query(doctype, txt, searchfield, start, page_len, filters):
	#frappe.msgprint("was called")
	return frappe.db.sql("""
	SELECT name, customer_name, cell_phone
	FROM `tabCustomer`
	WHERE docstatus < 2
		AND disabled = 0
		AND ({key} LIKE %(txt)s
			OR customer_name LIKE %(txt)s
			OR name LIKE %(txt)s
			OR cell_phone LIKE %(txt)s)
		{mcond}
	ORDER BY
		IF(LOCATE(%(_txt)s, customer_name), LOCATE(%(_txt)s, customer_name), 99999),
		IF(LOCATE(%(_txt)s, name), LOCATE(%(_txt)s, name), 99999),
		IF(LOCATE(%(_txt)s, cell_phone), LOCATE(%(_txt)s, cell_phone), 99999),
		customer_name, name, cell_phone
	LIMIT %(start)s, %(page_len)s
	""".format(**{
		'key': searchfield,
		'mcond': get_match_cond(doctype)
	}), {
	'txt': "%{}%".format(txt),
	'_txt': txt.replace("%", ""),
	'start': start,
	'page_len': page_len
	})
	pass