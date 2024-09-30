// Copyright (c) 2024, GreyCube Technologies and contributors
// For license information, please see license.txt

frappe.ui.form.on('Employee Tasks', {
	refresh: function(frm) {
		if(frm.doc.__islocal)
		{
			frm.set_value("assigned_by",frappe.session.user)
			frm.set_value("assigned_by_name",frappe.session.user_fullname)
		}
	}
});
