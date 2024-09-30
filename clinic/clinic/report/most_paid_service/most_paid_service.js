frappe.query_reports["Most Paid Service"] = {
	"filters": [

		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"width": "80",
			"default": frappe.datetime.month_start()
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"width": "80",
			"default": frappe.datetime.month_end()
		},
	
	],
    onload : function (frm){
		$('h3[title ="Most Paid Service"]').text("الخدمات الأكثر بيع")
		$(document).prop("title","الخدمات الأكثر بيع")
	
	}
}