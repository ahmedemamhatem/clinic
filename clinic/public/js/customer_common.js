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
                    setTimeout(() => {
                        createOrderSummarySection(frm, data);
                    }, 100);
                }
            }
        });
    }
}

function createOrderSummarySection(frm, data) {
    // Remove existing custom section if it exists
    $('.custom-order-summary').remove();
    
    const statsHtml = `
        <div class="custom-order-summary" style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; border: 1px solid #d1d8dd;">
            <div class="row">
                <div class="col-sm-12">
                    <h5 style="margin-top: 0; margin-bottom: 15px; color: #6c7680; border-bottom: 1px solid #e5e7e9; padding-bottom: 8px;">
                        <i class="fa fa-chart-bar"></i> Order Summary
                    </h5>
                </div>
                <div class="col-sm-6" style="margin-bottom: 10px;">
                    <div style="font-size: 14px; color: #36414c;">
                        <strong style="display: block; color: #74808b; font-size: 13px;">Total Orders</strong>
                        <span style="color: #2e7d32; font-size: 18px; font-weight: bold;">${data.total_orders}</span>
                    </div>
                </div>
                <div class="col-sm-6" style="margin-bottom: 10px;">
                    <div style="font-size: 14px; color: #36414c;">
                        <strong style="display: block; color: #74808b; font-size: 13px;">Unbilled Amount</strong>
                        <span style="color: #c62828; font-size: 18px; font-weight: bold;">${data.unbilled_amount}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Find the Connections section
    const connectionsSection = $('.form-dashboard-section.form-links');
    
    if (connectionsSection.length) {
        // Insert BEFORE the Connections section
        connectionsSection.before(statsHtml);
    } else {
        // Fallback: insert after page title but before form sections
        const formPage = $('.form-page:first');
        const firstSection = $('.form-section:first');
        
        if (firstSection.length) {
            firstSection.before(statsHtml);
        } else {
            formPage.prepend(statsHtml);
        }
    }
}