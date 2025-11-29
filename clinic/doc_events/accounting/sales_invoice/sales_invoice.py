import frappe
from frappe import _

@frappe.whitelist()
def validate(doc, method=None):
    check_if_sales_order_created(doc)


def check_if_sales_order_created(doc):
    """
    Checks if a Sales Order exists for the given Client Appointment
    and is submitted (docstatus = 1). If not, it throws an error.

    Args:
        doc (Document): The current document being validated (e.g., Sales Invoice)

    Raises:
        frappe.ValidationError: If no submitted Sales Order is found for the appointment
    """
    # Proceed only if the document has an appointment linked
    if doc.appointment:
        # Check if the appointment has a schedule plan
        has_plan = frappe.db.get_value(
            "Client Appointment CT",
            {"name": doc.appointment},
            "has_schedule_plan"
        )

        if has_plan:
            # Check if a submitted Sales Order exists for this appointment
            sales_order_exists = frappe.db.exists(
                "Sales Order",
                {"client_appointment_ct": doc.appointment, "docstatus": 1}
            )

            # Throw an error if no Sales Order is found
            if not sales_order_exists:
                frappe.throw(
                    "Please ensure you have created and submitted a Sales Order "
                    "for this scheduled appointment before creating the invoice."
                )

@frappe.whitelist()
def get_customer_order_summary(customer):
    try:
        # Get total of all submitted sales orders linked to client appointments
        orders = frappe.db.get_all(
            "Sales Order",
            filters={"customer": customer, "docstatus": 1},
            fields=["grand_total", "name", "client_appointment_ct"]
        )

        # Extract appointments from orders (filter out None values)
        appointments = [o.client_appointment_ct for o in orders if o.get('client_appointment_ct')]
        
        # Calculate total orders amount (only those with appointments)
        total_orders = sum([o.grand_total for o in orders if o.get('client_appointment_ct')]) or 0

        # Initialize total_invoiced
        total_invoiced = 0

        # Only query invoices if there are appointments
        if appointments:
            # Get total of all submitted invoices linked to this customer and appointments
            invoices = frappe.db.get_all(
                "Sales Invoice",
                filters={
                    "customer": customer, 
                    "docstatus": 1,
                    "appointment": ["in", appointments]
                },
                fields=["grand_total"]
            )
            total_invoiced = sum([i.grand_total for i in invoices]) or 0

        unbilled_amount = total_orders - total_invoiced

        return {
            "total_orders": total_orders,
            "unbilled_amount": unbilled_amount
        }
    
    except Exception as e:
        frappe.log_error(f"Error in get_customer_order_summary: {str(e)}")
        return {
            "total_orders": 0,
            "unbilled_amount": 0
        }
