import frappe
def set_qitaf(doc,method):
    if not doc.is_return:
        if doc.use_qitaf and doc.qitaf_amount>0 and doc.discount_amount>0:
            dis=doc.qitaf_amount-doc.discount_amount
            frappe.db.set_value("Customer",doc.customer,{"qitaf":dis})
    else:
        if doc.use_qitaf  and doc.discount_amount:
            customer_qitaf=frappe.db.get_value("Customer",doc.customer,"qitaf")
            print(customer_qitaf)
            frappe.db.set_value("Customer",doc.customer,{"qitaf":customer_qitaf+abs(doc.discount_amount)})

def return_qitaf_in_cancel(doc,method):
    if not doc.is_return and doc.use_qitaf and doc.discount_amount>0:
        customer_qitaf=frappe.db.get_value("Customer",doc.customer,"qitaf")
        frappe.db.set_value("Customer",doc.customer,{"qitaf":customer_qitaf+abs(doc.discount_amount)})