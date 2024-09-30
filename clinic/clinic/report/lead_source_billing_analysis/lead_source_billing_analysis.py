import frappe 
import json
from frappe.utils import getdate
from frappe.utils import add_to_date


@frappe.whitelist()
def sql_call(from_date,to_date,lead_source):
    """
    from_date,to_date: is date data type
    lead_source is an dict of strings
    this function returns the specific repeating customer form a lead source within a time frame
    """
    lead_source= json.loads(lead_source)
    from_date = getdate(from_date)
    to_date = getdate(to_date)
    result = []

    sql = """
                select
        T.customer_code as name,
        T.customer_name as customer_name,
        IFNULL(T.Lead_Source,'unknown') As "LeadSource:Data:250",
        SUM(T.NewBilling) as "New Billing:Currency:150", 
        SUM(T.RepeatBilling) as "Repeat Billing:Currency:150"
        
        from(
            SELECT 
            c.customer_name as customer_name,
            c.name as customer_code,
            c.lead_source as Lead_Source,
            sum(CASE WHEN mini.creation between %(from_date)s and %(to_date)s THEN si.paid_amount ELSE 0 END) as NewBilling,
            sum(CASE WHEN mini.creation < %(from_date)s THEN si.paid_amount ELSE 0 END) as RepeatBilling
            from `tabCustomer` c
            INNER JOIN `tabSales Invoice` as si
            on c.name= si.customer
            INNER JOIN
            (select 
            SI.customer_name, SI.customer, MIN(SI.creation) as creation
            from `tabSales Invoice` as SI
            group by SI.customer) as mini
            on mini.customer = c.name
            where si.posting_date between %(from_date)s and %(to_date)s
            and (si.status ='Paid' or si.status ='Overdue')
            and c.lead_source = %(lead_source)s
            group by c.lead_source, c.name

            UNION ALL 

            select
            c.customer_name as customer_name,
            c.name as customer_code,
            c.lead_source as Lead_Source,
            sum(CASE WHEN mini.creation between %(from_date)s and %(to_date)s THEN pv.paid_amount ELSE 0 END) as NewBilling,
            sum(CASE WHEN mini.creation < %(from_date)s THEN pv.paid_amount ELSE 0 END) as RepeatBilling
            from `tabCustomer` c
            INNER JOIN `tabPayment Entry` as pv
            on c.name = pv.party
            INNER JOIN
            (select 
            SI.customer_name, SI.customer, MIN(SI.creation) as creation
            from `tabSales Invoice` as SI
            group by SI.customer) as mini
            on mini.customer = c.name
            where pv.payment_type = 'Receive' and pv.posting_date between %(from_date)s and %(to_date)s
            and c.lead_source = %(lead_source)s
            group by c.lead_source, c.name
       
       
       ) as T group by Lead_Source, customer_name order by Lead_Source



    """
    for item in lead_source.values():
        data = {"from_date":from_date,"to_date":to_date,"lead_source":item}
        result= result + frappe.db.sql(sql,data,as_dict=1)
       
        pass
    
       
    return result
    pass



