
var x = {};

frappe.query_reports["Appointment Analytics"] = {
	"filters": [

		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"width": "80",
			"default": frappe.datetime.get_today()
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"width": "80",
			"default": frappe.datetime.get_today()
		}
	],
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
						x[index] = {'doctor':data[3].content,
									'status':data[4].content
						}
					}
					else{
						delete(x[index])
					}
					let from_date = frappe.query_report.filters[0].value;
					let to_date = frappe.query_report.filters[1].value;
					
					console.log(x)
			
					
				},
				
			}
		})
		},
		"onload":function(report){
			report.page.add_inner_button(__('more'), function () {
				frappe.call({
					method: "clinic.clinic.report.appointment_analytics.appointment_analytics.sql_call",
					args:{
						"from_date":report.filters[0].value,
						"to_date":report.filters[1].value,
						"args":x
					},
					callback:function(r){
						console.log(r.message)
						tableData = r.message
						console.log(tableData[0])
						const tableHtml = `
						<table class="table table-bordered table-striped">
							<thead >
								<tr>
									<th> Client name </th>
									<th>customer name</th>
									<th> status</th>
									<th> paid </th>
									<th> partially paid </th>
									<!-- Add more column headers as needed -->
								</tr>
							</thead>
							<tbody>
							${tableData
								.map(data => `<tr>
									<td><a href="http://2care.wajihah.sa/app/client-appointment-ct/${data.name}">${data.name}</a></td>
									<td>${data.customer}</td>
									<td>${data.status}</td>
									<td>${data['Billed:Int:100']}</td>
									<td>${data['partially Billed:Int:100']}</td>
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

    formatter: function(value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);
        
        // Check if this is the status column (lowercase fieldname from query)
        if (column.fieldname == "status" && value) {
            let status = value.toLowerCase().trim();
            let color = "gray";

            if (status == "attended" || status == "waiting attend") {
                color = "#17a2b8"; // Teal/cyan color like in Client Appointment CT
            }
            else if (status == "waiting" || status.includes("انتظار")) {
                color = "orange"; // Orange for waiting status
            }
            else if (status == "scheduled") {
                color = "green";
            }
            else if (status == "cancelled") {
                color = "red";
            }
            else if (status == "لم يحضر") {
                color = "gray";
            }

            value = `<span style="
                background:${color};
                color:white;
                padding:2px 8px;
                border-radius:12px;
                font-size:12px;
                display:inline-block;
            ">${value}</span>`;
        }

        return value;
    }
};