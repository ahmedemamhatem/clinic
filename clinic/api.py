from __future__ import unicode_literals
import frappe
from frappe.utils import cint, get_gravatar,flt,format_datetime, now_datetime,add_days,today,formatdate,date_diff,getdate,get_last_day
from frappe import throw, msgprint, _
from frappe.utils.password import update_password as _update_password
from frappe.desk.notifications import clear_notifications
from frappe.utils.user import get_system_managers
from erpnext.accounts.doctype.sales_invoice.sales_invoice import make_delivery_note
import frappe.permissions
import frappe.share
import re
import string
import random
import json
import time
from datetime import datetime
from datetime import date
from datetime import timedelta
import collections
import math
import logging
from operator import itemgetter 
import traceback



#custom:make error log when any issue coming in all functions
@frappe.whitelist()
def app_error_log(title,error):
	d = frappe.get_doc({
			"doctype": "Custom Error Log",
			"title":str("User:")+str(title+" "+"App Name:Clinic"),
			"error":traceback.format_exc()
		})
	d = d.insert(ignore_permissions=True)
	return d


@frappe.whitelist()
def generateResponse(_type,status=None,message=None,data=None,error=None):
	response= {}
	if _type=="S":
		if status:
			response["status"]=status
		else:
			response["status"]="200"
		response["message"]=message
		response["data"]=data
	else:
		error_log=app_error_log(frappe.session.user,str(error))
		if status:
			response["status"]=status
		else:
			response["status"]="500"
		if message:
			response["message"]=message
		else:
			response["message"]="Something Went Wrong"		
		response["message"]=message
		response["data"]=None
	return response



#custom this function used to check availability of doctor based on this appointment status 'Waiting' or 'Schedule'
@frappe.whitelist()
def checkAvailability(self,method):
	try:
		checkAppointment=frappe.get_all("Client Appointment CT",filters=[("Client Appointment CT","status","in",["Billed","To Bill","Under Treatment","Scheduled"]),("Client Appointment CT","appointment_date","=",self.appointment_date),("Client Appointment CT","physician","=",self.physician),("Client Appointment CT","appointment_time","=",self.appointment_time)],fields=["name"])
		checkApp=frappe.db.sql("""select name from `tabClient Appointment CT` where status="Schedule" and appointment_date=%s and physician=%s and appointment_time=%s""",(self.appointment_date,self.physician,self.appointment_time))	
		
	
		#frappe.msgprint(json.dumps(checkAppointment))
		if len(checkAppointment)>1:
			#frappe.db.set_value("Client Appointment CT", self.name, "status", "Waiting")
			return self.name
		else:
			#frappe.db.set_value("Client Appointment CT", self.name, "status", "Scheduled")
			return self.name

	except Exception as e:
		return generateResponse("F",error=e)


#custom change status of consultation and appointment
@frappe.whitelist()
def changeStatus(self,method):
	# try:
	if self.client_package_schedule:
		client_package_schedule=self.client_package_schedule
		for item in self.items:
			item_code=item.item_code
			doc=frappe.get_doc('Client Package Schedule', client_package_schedule)
			for session_item in doc.get('session_schedule'):
				if doc.is_full_payment_required==1:
					is_item_found = False
					
					for find_item in self.items:
						if session_item.session_name == find_item.item_code :
							is_item_found= True
							break
						else:
							is_item_found= False
					if is_item_found==False:
						frappe.throw(_("Client Package Schedule - {0} has item - {1} which doesnot exist in sales invoice").format(doc.name,session_item.session_name))
				if item_code==session_item.session_name:
					frappe.db.set_value("Client Session Schedule",session_item.name,"is_billed",1)
					frappe.db.set_value("Client Session",session_item.client_session,"is_billed",1)
					# client_session=frappe.get_doc('Client Session', session_item.client_session)
					# client_session.is_billed=1
					# client_session.save(ignore_permissions=True)
		
		# set status field of 'Client Package Schedule' for color change in list view later
		doc=frappe.get_doc('Client Package Schedule', client_package_schedule)
		payment_status=True
		for session_item in doc.get('session_schedule'):
			if session_item.is_billed==0:
				payment_status=False
		if payment_status==False:
			frappe.db.set_value("Client Package Schedule",client_package_schedule,"status","Partial Billed")
		else:
			frappe.db.set_value("Client Package Schedule",client_package_schedule,"status","Billed")

	else:
		for item in self.items:
			if item.consultation:
				frappe.db.set_value("Consultation",item.consultation,"is_bill",1)
			if item.treatment:
				frappe.db.set_value("Client Treatment",item.treatment,"is_bill",1)
		if self.appointment:
			consultant_data=frappe.get_all("Consultation",filters=[("Consultation","appointment","=",self.appointment),("Consultation","is_bill","!=",1)],fields=["name"])
			treatment_data=frappe.get_all("Client Treatment",filters=[("Client Treatment","appointment","=",self.appointment),("Client Treatment","status","in",["Pending","Completed"]),("Client Treatment","is_bill","!=",1)],fields=["name"])
			#if len(consultant_data)==0 and len(treatment_data)==0:
				#frappe.db.set_value("Client Appointment CT",self.appointment, "status", "Billed")
			#else:
				#frappe.db.set_value("Client Appointment CT",self.appointment, "status", "Partial Billed")

	# except Exception as e:
	# 	return generateResponse("F",error=e)


#custom when cancel consultation this function call
@frappe.whitelist()
def updateDocument(self,method):
	try:
		if self.appointment:
			frappe.db.set_value("Client Appointment CT",self.appointment,"status","Closed")
			treatment_data=frappe.get_all("Client Treatment",filters={'consulatation':self.name},fields=["name"])
			if len(treatment_data)>0:
				for treatment in treatment_data:
					tr_doc=frappe.get_doc("Client Treatment",treatment.name)
					if tr_doc.docstatus==0:
						tr_doc.submit()
						tr_doc_update=frappe.get_doc("Client Treatment",treatment.name)
						tr_doc_update.cancel()
					else:
						tr_doc.cancel()
	except Exception as e:
		return generateResponse("F",error=e)


#custom delete already available translation
@frappe.whitelist()
def deleteTranslation(self=None,method=None):
	try:
		frappe.db.sql("""delete from `tabTranslation` where language in ('en','ar')""")

	except Exception as e:
		return generateResponse("F",error=e)





#custom change IsBilled of Client Session Schedule and Client Session
@frappe.whitelist()
def changeIsBilled(self,method):
	try:
		if self.client_package_schedule:
			client_package_schedule=self.client_package_schedule
			for item in self.items:
				item_code=item.item_code
				doc=frappe.get_doc('Client Package Schedule', client_package_schedule)
				for session_item in doc.get('session_schedule'):
					if item_code==session_item.session_name:
						frappe.db.set_value("Client Session Schedule",session_item.name,"is_billed",0)
						client_session=frappe.get_doc('Client Session', session_item.client_session)
						client_session.is_billed=0
						client_session.save(ignore_permissions=True)
			# set status field of 'Client Package Schedule' for color change in list view later
			doc=frappe.get_doc('Client Package Schedule', client_package_schedule)
			payment_status=False
			for session_item in doc.get('session_schedule'):
				if session_item.is_billed==1:
					payment_status=True
			if payment_status==False:
				frappe.db.set_value("Client Package Schedule",client_package_schedule,"status","To Bill")
			else:
				frappe.db.set_value("Client Package Schedule",client_package_schedule,"status","Partial Billed")

	except Exception as e:
		return generateResponse("F",error=e)