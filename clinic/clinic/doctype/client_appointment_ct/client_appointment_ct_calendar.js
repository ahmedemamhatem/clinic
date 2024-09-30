
frappe.views.calendar["Client Appointment CT"] = {
	field_map: {
		"start": "appointment_date",
		"end": "appointment_datetime",
		"id": "name",
		"title": "physician",
		"allDay": "allDay"
	},
	gantt: true,
	get_events_method: "clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.get_events",
	filters: [
		{
			'fieldtype': 'Link',
			'fieldname': 'physician',
			'options': 'Physician',
			'label': __('Physician')
		},
		{
			'fieldtype': 'Link',
			'fieldname': 'patient',
			'options': 'Patient',
			'label': __('Patient')
		},
		{
			'fieldtype': 'Link',
			'fieldname': 'appointment_type',
			'options': 'Appointment Type',
			'label': __('Appointment Type')
		},
		{
			'fieldtype': 'Link',
			'fieldname': 'department',
			'options': 'Medical Department',
			'label': __('Department')
		},
		{
			'fieldtype': 'Select',
			'fieldname': 'status',
			'options': 'Scheduled\nOpen\nClosed\nPending',
			'label': __('Status')
		}
	]
};
