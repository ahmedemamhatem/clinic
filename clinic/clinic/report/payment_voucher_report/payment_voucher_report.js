frappe.query_reports["Payment Voucher Report"] = {
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
		{
			"fieldname": "physician",
			"label": __("Doctor"),
			"fieldtype": "Link",
			"width": "80",
			"options": "Doctor",
			"default": "all"
		}
	],
	onload: function (report) {
		let user_mail = frappe.session.user_email

		

		frappe.db.get_value("Doctor", { "user_id": user_mail/*"fahadbinslmah@gmail.com" */ }, "name").then((r) => {
			//console.log(r.message.name)
			let username = frappe.session.user_fullname
			let allowed_users = ["Raghad Aljuhani","Nawaf Alotaibi","atheer alsaadan", "جمعه", "ناصر العريج","Rana Alqfari", "Dr.Nawaf Alshahrani","2Care ","Kholoud Alarfag","Nourah Alhnaia","Amir","Mohammed Eletrby", "Noura Alawaji"]
			let doc_code = r.message.name
			
			if (allowed_users.indexOf(username) >= 0) {
				console.log("allowed")
			}
			else if ((doc_code != "" && doc_code!=null)) {
				console.log(doc_code)
				frappe.query_report.filters[2].set_value(r.message.name)

			}
			else {
				frappe.query_report.filters[2].set_value("DOC0027")
				console.log("not allowed")
			}

			frappe.query_report.filters[2].$input.attr("readonly", true)
		})
	}

}
