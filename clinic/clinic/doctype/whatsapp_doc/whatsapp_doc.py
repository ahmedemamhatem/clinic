# Copyright (c) 2024, GreyCube Technologies and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe
import requests
from datetime import datetime
class whatsapp_doc(Document):





	pass
@frappe.whitelist()
def whatsapp_sched():

	current_month = datetime.today().month
	current_day = datetime.today().day

	# Construct SQL query to fetch users with birthday today
	sql_query = f"""
		SELECT `name`, `customer_name`, `date_of_birth`, `email`
		FROM `tabCustomer`
		WHERE MONTH(`date_of_birth`) = {current_month}
		AND DAY(`date_of_birth`) = {current_day}
	"""

	# Execute SQL query
	users = frappe.db.sql(sql_query, as_dict=True)
	message = ''
	if users:
		print('Users with birthday today:')
		for user in users:
			message+= f"Name: {user['name']} {user['customer_name']}, Birthdate: {user['date_of_birth']}, email:{user['email']}\n\n"
			# print(f"Name: {user['first_name']} {user['last_name']}, Birthdate: {user['birthdate']}")
	else:
		print('No users found with birthday today.')
	message = 'Happy birthday نواف سعيد الشهراني 🎉'
	receipients = ['alshahraninawaf8@gmail.com']
	# frappe.sendmail(
	# 	recipients =  receipients,
	# 	message = message,
	# 	header = 'Happy Birthday 🎉🎉🎉',
	# 	subject = 'تهنئة عيد الميلاد',
	
	# )

	
	pass