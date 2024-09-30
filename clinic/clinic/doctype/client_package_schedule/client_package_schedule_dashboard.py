from __future__ import unicode_literals
from frappe import _

def get_data():
	return {
        'fieldname': 'client_package_schedule',
		'transactions': [
			{
				'items': ['Sales Invoice','Client Session']
			},
		]
	}