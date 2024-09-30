import frappe 
import json
from frappe.utils import getdate
from frappe.utils import add_to_date


@frappe.whitelist()
def sql_call(from_date,to_date,args):
    """
    from_date,to_date: is date data type
    args is an dict of dict that has only two values doctor and status
    this function returns the specific doctor schedule
    """
    args= json.loads(args)
    from_date = getdate(from_date)
    to_date = getdate(to_date)
    result = []

    sql = """
            select 
            CANAME as 'name',
            Clinic AS 'clinic',
            Doctor AS 'doctor',
            customer as customer,
            Status as 'status',
            T.Billed as 'Billed:Int:100',
            T.partially as 'partially Billed:Int:100'
            from
            (select 
            PA.name as 'CANAME',
            PA.patient_name as 'customer',
            PA.clinic as 'Clinic',
            PA.doctor_name as 'Doctor',
            PA.status as 'Status',
            (CASE WHEN SI.status = 'Paid' THEN 1 ELSE 0 END) as 'Billed',
            (CASE WHEN SI.status = 'Overdue' OR SI.status= 'Partly Paid' THEN 1 ELSE 0 END) as 'partially'
            FROM `tabClient Appointment CT` AS PA
            LEFT JOIN `tabSales Invoice` SI
            on PA.NAME = SI.appointment
            WHERE PA.appointment_date >= %(from_date)s 
            and PA.appointment_date <= %(to_date)s 
            and PA.doctor_name = %(doctor)s 
            and PA.status = %(status)s
            and PA.status != 'Cancelled') as T
            order by 
            T.clinic,
            T.Doctor,
            T.status





    """
    for item in args.values():
        data = {"from_date":from_date,"to_date":to_date,"doctor":item['doctor'],'status':item['status']}
        result= result + frappe.db.sql(sql,data,as_dict=1)
       
        pass
    
       
    return result
    pass



