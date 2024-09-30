var x = {};

frappe.query_reports["Lead Source Billing Analysis"] = {
	"filters": [
		
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"width": "80",
			"default": frappe.datetime.month_start()
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"width": "80",
			"default": frappe.datetime.month_end()
		}
	],"onload":function(report){
		report.page.add_inner_button(__('more'), function () {
			frappe.call({
				method: "clinic.clinic.report.lead_source_billing_analysis.lead_source_billing_analysis.sql_call",
				args:{
					"from_date":report.filters[0].value,
					"to_date":report.filters[1].value,
					"lead_source":x
				},
				callback:function(r){
					console.log(r.message)
					tableData = r.message
					console.log(tableData[0])
					const tableHtml = `
					<table class="table table-bordered table-striped">
						<thead >
							<tr>
								<th>customer name</th>
								<th> lead source</th>
								<th>new billing</th>
								<th>repeat billing</th>
								<!-- Add more column headers as needed -->
							</tr>
						</thead>
						<tbody>
						${tableData
                            .map(data => `<tr>
								<td><a href="http://2care.wajihah.sa/app/customer/${data.name}">${data.customer_name}</a></td>
								<td>${data["LeadSource:Data:250"]}</td>
								<td>${data["New Billing:Currency:150"]}</td>
								<td>${data["Repeat Billing:Currency:150"]}</td>
							</tr>`)
                            .join('')}
						</tbody>
					</table>
				`;
	

					let d = new frappe.ui.Dialog({
					title:"sub report",
					fields: [
						{
							fieldtype: "HTML",
							label: __("Table"),
							fieldname: "table",
						}
					]

					})
					d.fields_dict.table.$wrapper.html(tableHtml);
					d.show()
			
				}
			});
			
		});



		//console.log(report)
	},
	"get_datatable_options":function(options) {

		return Object.assign(options,{
			checkboxColumn: true,
			events:{
				onCheckRow: function (data) {
					if(!data)
						return;
					let index = data[1].content
					if(!x[index])
					{
						x[index] = data[2].content
					}
					else{
						delete(x[index])
					}
					let from_date = frappe.query_report.filters[0].value;
					let to_date = frappe.query_report.filters[1].value;
					
					//console.log(x)
			
					
				},
				onRowClick: function(row, data) {
					// Custom event handler for row click
					console.log("Row Clicked:", data);
				}
			}
		})
		}

}
