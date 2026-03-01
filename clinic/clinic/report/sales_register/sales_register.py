# Copyright (c) 2026, Clinic App
# License: GNU General Public License v3. See license.txt

"""
Override for Sales Register Report
Excludes return invoices and their reference invoices from the report
"""

import frappe
from frappe import _
from erpnext.accounts.report.sales_register.sales_register import (
	_execute as original_execute,
	get_columns,
	get_conditions,
	get_invoice_income_map,
	get_internal_invoice_map,
	get_invoice_tax_map,
	get_invoice_cc_wh_map,
	get_invoice_so_dn_map,
	get_mode_of_payments
)
from frappe.model.meta import get_field_precision
from frappe.utils import flt


def execute(filters=None):
	frappe.msgprint("heeeeellllo")
	"""
	Override execute to use custom get_invoices that excludes return invoices
	and their reference invoices
	"""
	if not filters:
		filters = frappe._dict({})

	# Use custom get_invoices that excludes return invoices and their references
	invoice_list = get_invoices(filters, None)
	columns, income_accounts, tax_accounts, unrealized_profit_loss_accounts = get_columns(
		invoice_list, None
	)

	if not invoice_list:
		frappe.msgprint(_("No record found"))
		return columns, invoice_list

	# Use the original functions from ERPNext for the rest
	invoice_income_map = get_invoice_income_map(invoice_list)
	internal_invoice_map = get_internal_invoice_map(invoice_list)
	invoice_income_map, invoice_tax_map = get_invoice_tax_map(
		invoice_list, invoice_income_map, income_accounts
	)
	invoice_cc_wh_map = get_invoice_cc_wh_map(invoice_list)
	invoice_so_dn_map = get_invoice_so_dn_map(invoice_list)
	company_currency = frappe.get_cached_value("Company", filters.get("company"), "default_currency")
	mode_of_payments = get_mode_of_payments([inv.name for inv in invoice_list])

	data = []
	for inv in invoice_list:
		# invoice details
		sales_order = list(set(invoice_so_dn_map.get(inv.name, {}).get("sales_order", [])))
		delivery_note = list(set(invoice_so_dn_map.get(inv.name, {}).get("delivery_note", [])))
		cost_center = list(set(invoice_cc_wh_map.get(inv.name, {}).get("cost_center", [])))
		warehouse = list(set(invoice_cc_wh_map.get(inv.name, {}).get("warehouse", [])))

		row = {
			"invoice": inv.name,
			"posting_date": inv.posting_date,
			"customer": inv.customer,
			"customer_name": inv.customer_name,
		}

		row.update(
			{
				"customer_group": inv.get("customer_group"),
				"territory": inv.get("territory"),
				"tax_id": inv.get("tax_id"),
				"receivable_account": inv.debit_to,
				"mode_of_payment": ", ".join(mode_of_payments.get(inv.name, [])),
				"project": inv.project,
				"owner": inv.owner,
				"remarks": inv.remarks,
				"sales_order": ", ".join(sales_order),
				"delivery_note": ", ".join(delivery_note),
				"cost_center": ", ".join(cost_center),
				"warehouse": ", ".join(warehouse),
				"currency": company_currency,
			}
		)

		# map income values
		base_net_total = 0
		for income_acc in income_accounts:
			if inv.is_internal_customer and inv.company == inv.represents_company:
				income_amount = 0
			else:
				income_amount = flt(invoice_income_map.get(inv.name, {}).get(income_acc))

			base_net_total += income_amount
			row.update({frappe.scrub(income_acc): income_amount})

		# Add amount in unrealized account
		for account in unrealized_profit_loss_accounts:
			row.update(
				{frappe.scrub(account + "_unrealized"): flt(internal_invoice_map.get((inv.name, account)))}
			)

		# net total
		row.update({"net_total": base_net_total or inv.base_net_total})

		# tax account
		total_tax = 0
		for tax_acc in tax_accounts:
			if tax_acc not in income_accounts:
				tax_amount_precision = (
					get_field_precision(
						frappe.get_meta("Sales Taxes and Charges").get_field("tax_amount"), currency=company_currency
					)
					or 2
				)
				tax_amount = flt(invoice_tax_map.get(inv.name, {}).get(tax_acc), tax_amount_precision)
				total_tax += tax_amount
				row.update({frappe.scrub(tax_acc): tax_amount})

		# total tax, grand total, outstanding amount & rounded total
		row.update(
			{
				"tax_total": total_tax,
				"grand_total": inv.base_grand_total,
				"rounded_total": inv.base_rounded_total,
				"outstanding_amount": inv.outstanding_amount,
			}
		)

		data.append(row)

	return columns, data


def get_invoices(filters, additional_query_columns):
	"""
	Custom get_invoices that excludes:
	1. Return invoices (is_return = 1)
	2. Reference invoices that have been returned
	"""
	if additional_query_columns:
		additional_query_columns = ", " + ", ".join(additional_query_columns)

	conditions = get_conditions(filters)
	
	# Get all return invoice names and their references
	return_invoice_data = frappe.db.sql("""
		SELECT name, return_against
		FROM `tabSales Invoice`
		WHERE docstatus = 1 AND is_return = 1
	""", as_dict=1)
	
	# Collect both return invoices and their references
	excluded_invoices = []
	for inv in return_invoice_data:
		excluded_invoices.append(inv.name)  # Add the return invoice itself
		if inv.return_against:
			excluded_invoices.append(inv.return_against)  # Add the reference invoice
	
	# Build exclusion condition
	exclusion_condition = ""
	if excluded_invoices:
		excluded_invoice_list = ", ".join(["'{0}'".format(inv) for inv in excluded_invoices])
		exclusion_condition = " and name not in ({0})".format(excluded_invoice_list)
	
	# Execute query with exclusion condition
	return frappe.db.sql(
		"""
		select name, posting_date, debit_to, project, customer,
		customer_name, owner, remarks, territory, tax_id, customer_group,
		base_net_total, base_grand_total, base_rounded_total, outstanding_amount,
		is_internal_customer, represents_company, company {0}
		from `tabSales Invoice`
		where docstatus = 1 {1} {2} 
		order by posting_date desc, name desc""".format(
			additional_query_columns or "",
			conditions,
			exclusion_condition
		),
		filters,
		as_dict=1,
	)
