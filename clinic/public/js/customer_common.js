frappe.ui.form.on("Customer",{
    refresh(frm){
        order_summary(frm)
    	frm.events.set_customer_classifiy(frm);
    },
    onload(frm){
        frm.events.set_customer_classifiy(frm);
    },
    after_save(){
	frm.events.set_customer_classifiy(frm);
   },
   set_customer_classifiy(frm){
	
	frappe.call({
            method:"clinic.clinic.common.customer_common.get_customer_classify",
            args:{
                "customer_name":frm.doc.name
            },
            callback: function (r) {
                let color="";
                if(r.message.classify==="New"){
                    color="#84d6aa";
                }else if(r.message.classify==="Regular"){
                    color="#72b1db";
                }else if(r.message.classify==="VIP"){
                    color="#c6bda1";
                }else{
                    color="#4e62aa";
                }
                cur_frm.page.add_inner_message(`<span style='color:${color};font-weight: bold;font-size: 24px;'>${r.message.classify}</span>`)
            }

        })

   }

})


function order_summary(frm){
    if (!frm.is_new()) {
        frappe.call({
            method: "clinic.doc_events.accounting.sales_invoice.sales_invoice.get_customer_order_summary",
            args: {
                customer: frm.doc.name
            },
            callback: function(response) {
                const data = response.message;
                if (data) {
                    // Wait for the dashboard to be fully rendered
                    setTimeout(() => {
                        const dashboardSection = $('.form-stats .section-body .row');
                        
                        if (dashboardSection.length) {
                            // Create and append new state elements
                            const newStateHtml = `
                                <div class="col-sm-6 indicator-column">
                                    <span class="indicator green">(Total Orders): ${data.total_orders}</span>
                                </div>
                                <div class="col-sm-6 indicator-column">
                                    <span class="indicator red">Unbilled Amount: ${data.unbilled_amount}</span>
                                </div>
                            `;
                            
                            dashboardSection.append(newStateHtml);
                        }
                    }, 100);
                }
            }
    });
}
}