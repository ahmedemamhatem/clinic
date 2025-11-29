frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        get_customer_id(frm);
    }
});

function get_customer_id(frm){
    if(frm.doc.client_appointment_ct && frm.is_new()){
        console.log("Fetching customer...");
        frappe.call({
            method: "frappe.client.get_value",
            args: {
                doctype: "Client Appointment CT",
                filters: { "name": frm.doc.client_appointment_ct },
                fieldname: "client"
            },
            callback: function(response){
                console.log(response);
                if (response.message && response.message.client){
                    frm.set_value("customer", response.message.client);
                }
            }
        });
    }
}
