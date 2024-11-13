frappe.ui.form.on("Customer",{
    refresh(frm){
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
