frappe.listview_settings['Client Package Schedule'] = {
	get_indicator: function(doc) {

		if(doc.status=="To Bill"){
			return [__("To Bill"), "orange"];
		}
		if(doc.status=="Partial Billed"){
			return [__("Partial Billed"), "yellow"];
		}
		if(doc.docstatus==0){
			return [__("Draft"), "draft"];
		}
		if(doc.status=="Billed"){
			return [__("Billed"), "green"];
		}
		
	},
};
