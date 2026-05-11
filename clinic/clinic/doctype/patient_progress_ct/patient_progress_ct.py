# -*- coding: utf-8 -*-
# Copyright (c) 2020, GreyCube Technologies and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class PatientProgressCT(Document):
	pass


def set_added_on_for_new_rows(doc, method=None):
	"""Called on Customer before_save to stamp added_on on newly added rows."""
	now = now_datetime()
	for row in doc.get("client_progress") or []:
		if not row.added_on:
			row.added_on = now
