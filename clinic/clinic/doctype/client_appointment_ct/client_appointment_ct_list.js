/*
(c) ESS 2015-16
*/
/*var patient_nm = ''
if(frappe.user_roles.includes('Administrator'))
{
	console.log(frappe.session.user_fullname);
	patient_nm = frappe.session.user_fullname;
}*/

/*frappe.call({
	mehtod:'clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.get_doctor',
	async:false,
	args:{
		'first_name':'DR.nehal hussain'
	},
	callback:function(r){
		console.log(r.message);
		
	}
});*/




frappe.listview_settings['Client Appointment CT'] = {
	hide_name_column: false,
	get_indicator: function (doc) {

		if (doc.status == "Waiting") {
			return [__("Waiting"), "darkgrey", "status,=,Waiting"];
		}
		if (doc.status == "Scheduled") {
			return [__("Scheduled"), "purple", "status,=,Scheduled"];
		}

		if (doc.status == "Closed") {
			return [__("Closed"), "blue", "status,=,Closed"];
		}

		if (doc.status == "Cancelled") {
			return [__("Cancelled"), "red", "status,=,Cancelled"];
		}

		if (doc.status == "Under Treatment") {
			return [__("Under Treatment"), "yellow", "status,=,Under Treatment"];
		}
		if (doc.status == "To Bill") {
			return [__("To Bill"), "orange", "status,=,To Bill"];
		}
		if (doc.status == "Partial Billed") {
			return [__("Partial Billed"), "orange", "status,=,Partial Billed"];
		}
		if (doc.status == "Billed") {
			return [__("Billed"), "green", "status,=,Billed"];
		}



	},

	refresh: function (list_view) {
		console.log("meow")
		
		setTimeout(() => {
			$(`.filterable[data-filter="bill_status,=,To Bill"]`).removeClass('gray').addClass('red');
			$(`.filterable[data-filter="bill_status,=,Partial Billed"]`).removeClass('gray').addClass('orange');
			$(`.filterable[data-filter="bill_status,=,Billed"]`).removeClass('gray').addClass('green');
			var ele = $(`header`).find($('span:contains("Name")'))
			ele[ele.length - 1].remove()
			ele = $('header.level').find($('.list-row-col'))
			ele[ele.length - 1].remove()
			$('.list-row-col .ellipsis:contains("COP")').parent().remove()
			console.log("refressh called")
		}, 500)
	}
};
