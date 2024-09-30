// Copyright (c) 2022, GreyCube Technologies and contributors
// For license information, please see license.txt

frappe.ui.form.on('Appointment Forward', {
	refresh: function (frm) {




		if (frappe.user.name == 'Administrator' || frappe.user.name == 'alshahraninawaf8@gmail.com') {
			frappe.db.get_list("Sales Invoice", {
				"filters": {
					"appointment": cur_frm.doc.appointment_id,
					"docstatus": 1
				},
				"fields": ["name", "grand_total", "outstanding_amount"]
			}).then((r) => {
				var total = 0;
				r.forEach((i) => {
					total += i.grand_total - i.outstanding_amount
					console.log(`grand total ${i.grand_total}`)
				})
				cur_frm.doc.paid_amount = total
				cur_frm.refresh_field("paid_amount")
			})
		}
	}
});
