import frappe

@frappe.whitelist()
def get_customer_classify(customer_name):
    total_amount=0
    payments=frappe.db.get_all("Sales Invoice",filters={"customer":customer_name,"docstatus":1,"status":"Paid"},fields=["grand_total"])
    total_amount=sum(payment["grand_total"] for payment in payments)
    if total_amount<=15000:

        return {"classify":"New"}
    elif  15001<total_amount<29999 :
        return {"classify":"Regular"}
    elif 30000<total_amount<49999:
        return {"classify":"VIP"}
    else:
        return {"classify":"VIP+"}











