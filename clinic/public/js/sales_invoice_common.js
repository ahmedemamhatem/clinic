frappe.ui.form.on("Sales Invoice",{
    // refresh(frm){

    // }
    after_save(frm){
        let qitaf_amount=0;
        if(frm.doc.qitaf_amount>0 && frm.doc.use_qitaf===0 && frm.doc.is_return!==1){
            if(frm.doc.qitaf_amount<frm.doc.grand_total){
                qitaf_amount=frm.doc.qitaf_amount;
            }else{
                qitaf_amount=frm.doc.grand_total-0.1;
            }            
        
        let d = new frappe.ui.Dialog({
            title: 'Use Qitaf',
            fields: [
                {
                    label: 'Qitaf',
                    fieldname: 'qitaf',
                    fieldtype: 'Int',
                    default:qitaf_amount,
                    read_only:1

                },
                {
                    label: 'Use Qitaf',
                    fieldname: 'use_qitaf',
                    fieldtype: 'Check'
                },
            ],
            size: 'small',  
            primary_action_label: 'Submit',
            primary_action(values) {
                console.log(values);
                if(values.use_qitaf===1){
                    frm.set_value("discount_amount",values.qitaf);    
                    frm.set_value("additional_discount_account","الخصم نقدي - TM");
                    frm.set_value("use_qitaf",1);
                }

                d.hide();
                frm.save();
            }
        });
        
        d.show();
    }
    },
    // validate(frm){
    //     if((frm.doc.customer===undefined  || frm.doc.customer==='') && frm.doc.use_qitaf===1){
    //         frm.set_value("use_qitaf",0);
    //         frappe.throw(__("You have select the customer first"));
    //     }
    //     else if(frm.doc.use_qitaf===1){
    //         let dic_amount=0;
    //         if(frm.doc.qitaf_amount>0){
    //             if(frm.doc.qitaf_amount<frm.doc.grand_total){
    //                 dic_amount=frm.doc.qitaf_amount;
    //             }else{
    //                 dic_amount=frm.doc.grand_total-0.1;
    //             }
    //             frm.set_value("discount_amount",dic_amount);
    //             // frm.set_value("additional_discount_account","الخصم نقدي - TM")
    //         }else{
    //             frm.set_value("use_qitaf",0);
    //             frappe.throw(__("customer does not have balance in Qitaf"));
    //         }
    //     }else{
    //         frm.set_value("discount_amount",0);        
    //         frm.set_value("additional_discount_account","");
    //     }
    //     // frm.save();
    // },
    // use_qitaf:function(frm){
        
    // }
})