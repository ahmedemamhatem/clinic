frappe.query_reports["sales query report"] = {
	"filters": [

		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"width": "80",
			"default": frappe.datetime.month_start()
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"width": "80",
			"default": frappe.datetime.month_end()
		},
		{
			"fieldname": "doctor",
			"label": __("Doctor"),
			"fieldtype": "Link",
			"options": "Doctor",
			"reqd": 1,
			"width": "80",
			"default": "all"
		},
		{
			"fieldname": "status",
			"label": __("Status"),
			"fieldtype": "Select",
			"options": "Paid\nOverdue \nCancelled\nall",
			"reqd": 1,
			"width": "80",
			"default": "Paid"
		},
		{
			"fieldname": "service_group",
			"label": __("Service Group filter"),
			"fieldtype": "Select",
			"options": "خدمات الجلدية\nخدمات الاسنان\nall",
			"reqd": 1,
			"width": "80",
			"default": "all"
		},
		{
			"fieldname": "service",
			"label": __("Service filter"),
			"fieldtype": "Link",
			"options": "Services",
			"reqd": 1,
			"width": "80",
			"default": "all"
		}
	],
	get_chart_data: function(columns, result) {
		var label = result.map(d=>d.service);
		label.pop();
		console.log(label);
		var value = result.map(d=>d.grand_total);
		value.pop()
		return {
			data: {
				labels: label,
				datasets: [{
					title: 'Project Stock Status',
					values: value
				}]
			},
			type: 'bar',
		
		}
	}
}


$(document).ready(function () {

setTimeout(()=>{

	let doc = $('.dt-scrollable').find('div[data-col-index=4]').children().children()
	let total_arr = []
	for(let i =0;i<doc.length;i++){
	total_arr[i]=parseInt(doc[i].outerText.split(" ")[1].replace(',',''))
	}
	doc = $('.dt-scrollable').find('div[data-col-index="1"]').children()
	let first_service_name = doc[0].outerText
	let second_service_name = '';
	let total_1 = 0, total_2 = 0;
	for(let i = 0 ;i<doc.length/2;i++){
	   if(doc[i*2].outerText != first_service_name)
	   { 
		total_2+=total_arr[i];
		second_service_name = doc[i*2].outerText
	   }
		else{

			total_1+=total_arr[i]
			
		}
	}
	let text = first_service_name+": "+total_1+"  "+'\t'+second_service_name+": "+total_2+" "
	$(`<div style="text-align:center"><h3>${text}</h3></div>`).insertBefore('div.row.layout-main')
},1000)

	



})