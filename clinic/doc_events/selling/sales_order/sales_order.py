import frappe

@frappe.whitelist()
def before_validate(doc,method = None):
    add_tax(doc)


def add_tax(doc):
    if doc.client_appointment_ct and doc.is_new():
        doc.taxes_and_charges = ""
        # get customer id 
        customer_id = frappe.get_value("Customer", {"name": doc.customer}, "id_no")
        # chck if customer id starts with no != "1"
        if customer_id and not customer_id.startswith("1"):
            # get tax template 
            tax_template = frappe.get_value("Sales Taxes and Charges Template",{"tax_category":["like","%15%"]},"name")
            taxes = frappe.get_all("Sales Taxes and Charges",{"parent":tax_template},["charge_type","account_head","rate","description"])
            if taxes:
                # clear existing taxes
                doc.taxes = []
                for tax in taxes:
                    tax_row = doc.append("taxes", {})
                    tax_row.charge_type = tax.charge_type
                    tax_row.account_head = tax.account_head
                    tax_row.rate = tax.rate
                    tax_row.description = tax.description