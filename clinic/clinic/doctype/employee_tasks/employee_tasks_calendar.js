
// frappe.views.calendar["Employee Tasks"] = {
// 	field_map: {
// 		"start": "from_date",
// 		"end": "to_date",
// 		"id": "name",
// 		"title": "assigned_to_name",
// 		"allDay": "allDay"
// 	},



window.onload = function(){
	console.log("how")
	var sideBar = $('.sidebar-menu').find('.dropdown-item:contains("Employee Tasks Calendar")')
	sideBar.click()
}

frappe.views.calendar["Employee Tasks"] = {
	field_map: {
		"start": "from_date",
		"end": "to_date",
		"id": "name",
		"title": "assigned_to_name",
		"allDay": "all_Day",
		"color": "color"
	},
	gantt: true,
	order_by: 'ends_on',
	get_events_method: "clinic.clinic.doctype.employee_tasks.employee_tasks.get_events",
	view_options: {
		// Additional view options
		default_option: "Employee Tasks Calendar" // Change default option here
	},
	filters: [
		{
			'fieldtype': 'data',
			'fieldname': 'assigned_to',
			// 'options': 'Physician',
			'label': __('assigned to')
		},
		{
			'fieldtype': 'Select',
			'fieldname': 'status',
			'options': 'Scheduled\nOpen\nClosed\nPending',
			'label': __('Status')
		},
		{
            'fieldtype': 'Label',
            'fieldname': 'from_date',
            'label': 'From Date' // Set the label to the desired English string.
        },
        {
            'fieldtype': 'Label',
            'fieldname': 'to_date',
            'label': 'To Date' // Set the label to the desired English string.
        }
	],
	refresh: function(view){
		console.log("meow")
		var sideBar = $('.sidebar-menu').find('.dropdown-item:contains("Employee Tasks Calendar")')
		sideBar.click()
		
	},
};

