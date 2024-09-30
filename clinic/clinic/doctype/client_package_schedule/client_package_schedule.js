// Copyright (c) 2019, GreyCube Technologies and contributors
// For license information, please see license.txt
frappe.ui.form.on('Client Package Schedule', {
	onload: function (frm) {
		if (frm.doc.__islocal==1) {
			frm.trigger('session_start_date')
			
		}
	},
	refresh: function (frm) {
		frm.add_fetch('package','is_full_payment_required','is_full_payment_required')
		frm.add_fetch('package','days_between_each_session','days_between_each_session')
		frm.add_fetch('client','customer_name','client_name')

		frm.fields_dict["session_schedule"].grid.wrapper.find('.grid-add-row').hide();
		frm.fields_dict["session_schedule"].grid.wrapper.find('.grid-remove-rows').hide();
		if (frm.doc.docstatus==1) {
				frm.add_custom_button("Make Sales Invoice", function() {
					frm.trigger("make_sales_invoice");
				});

		}
	},
	
	make_sales_invoice: function(frm) {
		frappe.model.open_mapped_doc({
			method: "clinic.clinic.doctype.client_package_schedule.client_package_schedule.make_sales_invoice",
			frm: cur_frm
		})
	},

	session_start_date: function (frm) {
		if (frm.doc.session_start_date) {
			frappe.call({
				method: 'clinic.clinic.doctype.client_package_schedule.client_package_schedule.validate_holiday',
				args: {
					'date_to_check': frm.doc.session_start_date,
				},
				callback: function (r) {
					if (!r.exc) {
						var message = r.message
						if (message == false) {
							frappe.msgprint(__("Session start date {0} is in Holiday List", [frm.doc.session_start_date]));
							frm.set_value('session_start_date', '')
						} else {
							// do nothing
							if (frm.doc.session_start_date && frm.doc.package) {
								frm.doc.session_schedule=[]
								frm.trigger("set_schedule_date");
							}
						}

					}
				}
			});
		}
	},
	is_full_payment_required: function(frm){
		// if (frm.doc.is_full_payment_required==1) {
		// 	frm.fields_dict["session_schedule"].grid.wrapper.find('.grid-add-row').hide();
		// 	frm.fields_dict["session_schedule"].grid.wrapper.find('.grid-remove-rows').hide();
			
		// }else{
		// 	frm.fields_dict["session_schedule"].grid.wrapper.find('.grid-add-row').show();
		// 	frm.fields_dict["session_schedule"].grid.wrapper.find('.grid-remove-rows').show();	
		// }
	
	},
	package: function (frm) {
		if (frm.doc.package) {
			frm.add_fetch('package','is_full_payment_required','is_full_payment_required')
			frm.add_fetch('package','days_between_each_session','days_between_each_session')

			if (frm.doc.session_start_date==undefined) {
				frappe.msgprint(__("Please set session start date before package selection"))
				frm.set_value('package', '')
				frm.set_value('days_between_each_session', '')
				frm.set_value('is_full_payment_required', '')
				return false
			} else {
				frm.doc.session_schedule=[]
				frm.trigger("set_schedule_date");
		}		
		}

	},
	set_schedule_date: function (frm) {
		
		frappe.model.with_doc("Clinic Package", frm.doc.package, function () {
			var tabletransfer = frappe.model.get_doc("Clinic Package", frm.doc.package)
			var last_session_date
			$.each(tabletransfer.package_items, function (index, row) {
				var d = frm.add_child("session_schedule");
				d.session_name = row.session_name;
				d.amount = row.amount;
				if (index==0) {
					d.session_date=frm.doc.session_start_date
					last_session_date=d.session_date
				} else {
					console.log(last_session_date)
					var date_to_check=frappe.datetime.add_days(last_session_date, frm.doc.days_between_each_session)
					console.log(date_to_check)
					
				frappe.call({
						method: "clinic.clinic.doctype.client_package_schedule.client_package_schedule.get_next_schedule_date",
						args: {
							'date_to_check': date_to_check,
						},
						freeze: true,
						async:false,
						callback: function (r) {
							if (!r.exc) {
								var message = r.message
								d.session_date=message
								console.log(message)
					console.log(d.session_date)

							}
						}
					});
					last_session_date=d.session_date
				}
				
			});
			frm.refresh_field("session_schedule");
		});
	},
	client: function (frm) {
		frm.add_fetch('client','customer_name','client_name')
	}
});
frappe.ui.form.on('Client Session Schedule', {

	refresh: function (frm) {
		frm.add_fetch('session_name','description','session_description')
		frm.add_fetch('session_name','standard_rate','amount')
	},
	session_name: function (frm) {
		frm.add_fetch('session_name','description','session_description')
		frm.add_fetch('session_name','standard_rate','amount')
	}	

});