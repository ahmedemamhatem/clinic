// Copyright (c) 2016, ESS LLP and contributors
// For license information, please see license.txt
frappe.provide("erpnext.queries");
frappe.ui.form.on('Client Appointment CT', {
	setup: function (frm) {
		frm.custom_make_buttons = {
			'Sales Invoice': 'Invoice',
			'Vital Signs': 'Vital Signs',
			'Consultation': 'Consultation'
		};
		console.log("setups works")	
	},
	after_save: function (frm) {
		var status = frm.doc.status;
		frappe.call({
			method: "clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.update_status",
			args: { appointment_id: frm.doc.name, status: status },
			callback: (r) => {

			},
			error: (r) => {
				console.log(r.message)
			}
		});

		if(cur_frm.doc.parent_doctor != null && cur_frm.doc.saved == '0')
			{
				//console.log("---------------------------------------------")
				create_appforward(cur_frm,cur_frm.doc.physician)
				//console.log("meow appointment forward")
			}
		//console.log("test after save "+frm.doc.status)

	},
	refresh: function (frm) {


		frm.set_df_property("doctor_t", "read_only", frm.is_new() ? 0 : 1);

		//hide Consultation from the connections
		$('div[data-doctype="Consultation"]').parent().hide()
		// localStorage.setItem("hideS", true)
		$('div.document-link[data-doctype="Sales Invoice"]').unbind("click.salesFunc")
		$('div.document-link[data-doctype="Sales Invoice"]').bind("click.salesFunc",async function(){
			await localStorage.setItem("hideS", true) 
		 })

		let $foot_warper = $('.timeline-content').find('.frappe-timestamp');
		for (let i = 0; i < $foot_warper.length; i++) {
			$($foot_warper[i]).text($($foot_warper[i]).attr('data-timestamp').split('.')[0]).wrapInner("<strong />")
			$($foot_warper[i]).removeClass('frappe-timestamp')
		}

		//DR.nehal hussain dr.khalid Room 14 (Qswitch) LASER 2 LASER
		//setting up services filters
		cur_frm.fields_dict.service.get_query = function (doc, cdt, cdn) {
			return {
				filters: [['service_group', '=', cur_frm.doc.service_group]]
			}
		}

		if(frm.is_new()){
			frm.doc.saved = '0'
			frm.refresh_field("saved")
		}
		else
		{
			frm.doc.saved = '1'
			frm.refresh_field("saved")
		}
		
		

		//edit datepicker today button in ramadan
		// $(".datepicker").find('[data-action="today"]').off().on('click',function(){

		// 	if(cur_frm.get_field("appointment_date") != null)
		// {	
		// 	let ramadan_date_up = '';
		// 	console.log("meow")
		// 	if(frappe.datetime._date("HH:mm") < "05:00"  )
		// 	{
		// 		ramadan_date_up = moment(frappe.datetime._date(), "YYYY-MM-DD").subtract(1, "day").format("YYYY-MM-DD")
		// 		console.log(ramadan_date_up)
		// 		cur_frm.set_value("appointment_date", ramadan_date_up)
		// 		ramadan_date_up = ''
		// 	}
		// 	else{
		// 		cur_frm.set_value("appointment_date",frappe.datetime._date())
		// 		console.log(moment(cur_frm.doc.appointment_date, "YYYY-MM-DD").format("YYYY-MMM-DD"))
		// 	}
		// }
		// })




		//this part of the code is for dynamic Link filter
		//you can show clients depending on either phone number or name

		
		//remove disabled customers from the link
		/*cur_frm.fields_dict.client.get_query = function(doc){
			return {
					 filters: {
						 disabled: 0  
					 }
				 };
		 
	 }*/

		//console.log("refresh event " + frm.doc.status)

		frm.set_query("patient", function () {
			return {
				filters: { "disabled": 0 }
			};
		});

		cur_frm.set_query("client", function() {
			return {
				query: "clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.client_get_query",
			   
			};
		});




	
		if(frm.doc.__islocal)
		{
			let status_feild = frm.get_field('status');
			status_feild.df.options = 'Scheduled\nRetouch'
			status_feild.refresh();
		}


		if (frm.doc.patient) {
			frm.add_custom_button(__('Medical Record'), function () {
				frappe.route_options = { "patient": frm.doc.patient };
				frappe.set_route("medical_record");
			}, __("View"));
		}
	
		if (frm.doc.status == "Open" || frm.doc.status == "Waiting" || frm.doc.status == "Schedule") {
			frm.add_custom_button(__('Cancel'), function () {
				btn_update_status(frm, "Cancelled");
			});

			// frm.add_custom_button(__("Consultation"), function () {
			// 	btn_create_consultation(frm);
			// }, "Create");
			frm.add_custom_button(__('لم يحضر'), function () {
				btn_attend(frm, "لم يحضر");
			});
			
		}
		if ((frm.doc.status == "Scheduled" || frm.doc.status == "Retouch") && !frm.doc.__islocal) {
			frm.add_custom_button(__('Cancel'), function () {
				btn_update_status(frm, "Cancelled");
			});
			frm.add_custom_button(__('Patient is Attended'), function () {
				btn_attend(frm, "Attended");
			});
			frm.add_custom_button(__('لم يحضر'), function () {
				btn_attend(frm, "لم يحضر");
			});
			
			// frm.add_custom_button(__("Consultation"), function () {
			// 	btn_create_consultation(frm);
			// }, "Create");

		}
		if(frm.doc.status == "Waiting")
		{
			frm.add_custom_button(__("waiting attend"),function(){
				btn_attend(frm,"waiting attend");
			})
		}
		if (frm.doc.status == "Pending") {
			frm.add_custom_button(__('Set Open'), function () {
				btn_update_status(frm, "Open");
			});
			frm.add_custom_button(__('Cancel'), function () {
				btn_update_status(frm, "Cancelled");
			});
		}

		if (!frm.doc.__islocal) {


			

			cur_frm.add_custom_button(__("Refer"),function(){
					
				cur_frm.doc.parent_doctor = cur_frm.doc.physician
				cur_frm.refresh_field("parent_doctor")
				cur_frm.doc.physician = ''
				cur_frm.refresh_field("physician")
				cur_frm.make_new("Client Appointment CT")
			})



			if (frm.doc.sales_invoice) { //&& frappe.user.has_role("Accounts User")){
				frm.add_custom_button(__('Invoice'), function () {
					//frappe.msgprint('TEST');
					frappe.set_route("Form", "Sales Invoice", frm.doc.sales_invoice);
				}, __("View"));

		
			}
			else if (frm.doc.status != "Cancelled") {// && frappe.user.has_role("Accounts User")){
				// frm.add_custom_button(__('Invoice'), function () {
				// 	//btn_invoice_consultation(frm);
				// 	//var data=get_data(frm)

					
				// 	// var doc = frm.doc;
				
				// 	// frappe.call({
				// 	// 	method: "clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.create_invoice",
				// 	// 	args: {
				// 	// 		company: frm.doc.company, physician: frm.doc.physician, patient: frm.doc.client,
				// 	// 		appointment_id: cur_frm.doc.name, appointment_date: frm.doc.appointment_date
				// 	// 	},
				// 	// 	freeze: true,
				// 	// 	freeze_message: "Please Wait",
				// 	// 	//async: false,
				// 	// 	callback: function (res) {
				// 	// 		if (res.message) {
				// 	// 			frappe.set_route("Form", "Sales Invoice", res.message);
				// 	// 		}

				// 	// 		cur_frm.reload_doc();

				// 	// 	}
				// 	// });
				// 	frappe.route_options = {
				// 		"appointment" : cur_frm.doc.name,
				// 		"customer" : cur_frm.doc.client,
				// 		"client" : cur_frm.doc.client
				// 						   }
				// 	frappe.set_route("form", "Sales Invoice","new-sales-invoice-1");
				// 	window.open(route,'_blank')
				// 	// cur_frm.reload_doc();						   






				// }, __("Create"));
				// this is to add the functionality to the connections
				// $('div[data-label="Create"]').hide()
				// frm.add_custom_button(__('Extend Time'), function () {
				// 	var d = new frappe.ui.Dialog({
				// 		'fields': [
				// 			{ 'fieldname': 'ht', 'fieldtype': 'HTML' },
				// 			{ 'fieldname': 'duration', 'fieldtype': 'Select', 'options': '60\n120\n180', 'label': 'Duration' }
				// 		],
				// 		primary_action: function (values) {
				// 			debugger;
				// 			d.hide();
				// 			cur_frm.set_value("duration", values.duration.toString());
				// 			//cur_frm.set_value("doctor_name",'physician.doctor_name');
				// 			//cur_frm.timeline.insert_comment(values.comment.toString());

				// 			refresh_field("duration");
				// 			frm.save();
				// 			//show_alert(values.account.toString());
				// 			frappe.show_alert('تم تمديد الوقت');

				// 			frm.save();

				// 			//cur_frm.reload_doc();
				// 		}
				// 	});
				// 	d.fields_dict.ht.$wrapper.html('اختر الوقت');
				// 	d.show();
				// 	//frm.enable_save();
				// 	frm.save();
				// }, __("Create"));


				


				//(dashboard) document Link actions
				// var appointment_forward = $('a:contains("Appointment Forward").badge-link')
				// $('.icon-btn[data-doctype="Appointment Forward"]').off('click');
				// appointment_forward.off('click')
				// appointment_forward.on('click',function(){
				// 	cur_frm.doc.parent_doctor = cur_frm.doc.physician
				// 	cur_frm.refresh_field("parent_doctor")
				// 	cur_frm.doc.physician = ''
				// 	cur_frm.refresh_field("physician")
				// 	cur_frm.make_new("Client Appointment CT")
				// })



				
				// frm.add_custom_button(__('Convert To Doctor'), function () {
				// 	///this.check_availability();
				// 	var d = new frappe.ui.Dialog({
				// 		'fields': [
				// 			{ 'fieldname': 'ht', 'fieldtype': 'HTML' },
				// 			{ 'fieldname': 'appointment_date', 'fieldtype': 'Date', 'label': 'Appointment Date' },
				// 			{ 'fieldname': 'therapist', 'fieldtype': 'Link', 'options': 'Doctor', 'label': 'Doctor', 'ignore_user_permissions': 1 },
				// 		],

				// 		primary_action: function (values) {
				// 			debugger;
				// 			d.hide();
				// 			create_appforward(frm, values.therapist.toString());
				// 			var xc = frappe.call({
				// 				method: "frappe.client.get_value",
				// 				args: {
				// 					doctype: "Doctor",
				// 					fieldname: ["user_id"],
				// 					filters: {
				// 						name: ["=", cur_frm.doc.physician]
				// 					}
				// 				},
				// 				async: false,
				// 				callback: function (data) {
				// 					debugger;
				// 					if (typeof (data.message) != 'undefined') {
				// 						if (data.message.user_id) {
				// 							cur_frm.set_value("from_doctor", data.message.user_id);
				// 							refresh_field("from_doctor");
				// 							//frm.save();
				// 						}
				// 					}
				// 				}
				// 			});
				// 			cur_frm.set_value("physician", values.therapist.toString());
				// 			cur_frm.set_value("appointment_date", values.appointment_date);
				// 			/*var xx= frappe.call({
				// 				method:"frappe.client.get_value",
				// 				args: {
				// 					doctype: "Doctor",
				// 					fieldname: ["user_id"],
				// 					filters: {
				// 									name:["=",values.therapist.toString()]
				// 						 }
				// 					},
				// 					async: false,
				// 				   callback: function (data) {
				// 					debugger;
				// 					if(typeof(data.message) != 'undefined' )
				// 						{
				// 						if(data.message.user_id){
				// 							cur_frm.set_value("to_doctor",data.message.user_id);
				// 						refresh_field("to_doctor");
				// 					 //frm.save();
				// 						}
				// 					}
				// 				}
				// 			});*/

				// 			cur_frm.set_value("appointment_date", values.appointment_date);
				// 			//cur_frm.timeline.insert_comment(values.comment.toString());
				// 			refresh_field("appointment_date");
				// 			refresh_field("physician");
				// 			//refresh_field("from_doctor");
				// 			//refresh_field("to_doctor");
				// 			frm.save();
				// 			//show_alert(values.account.toString());
				// 			frappe.show_alert('تم تغيير الطبيب بنجاح');

				// 			frm.save();
				// 			showavailability(frm);

				// 			//cur_frm.reload_doc();
				// 		}
				// 	});
				// 	d.fields_dict.ht.$wrapper.html('اختر الطبيب الذي تود توجيه الموعد له');
				// 	d.show();
				// 	//frm.enable_save();
				// 	frm.save();

				// 	//cur_frm.reload_doc();

				// }, __("Create"));


				frm.add_custom_button(__("Time"), function () {
					showavailability(frm)
				}, 'Reschedule')

				frm.add_custom_button(__("Date"), function () {
					var d = new frappe.ui.Dialog({
						title: __('choose Date'),
						fields: [{ fieldtype: 'HTML', fieldname: "availale_slots" }, { fieldtype: "Date", fieldname: "appointment_date" }],
						primary_action_label: __("change"),
						primary_action: function (value) {
							d.hide();
							cur_frm.set_value("appointment_date", value.appointment_date);
							showavailability(frm);
						}
					});

					d.show();
					var dialog_ = d.$wrapper.find('.modal-dialog');
					dialog_.parent().unbind('click');
					d.$wrapper.find('.modal-actions').click(() => {
						frm.reload_doc();
						d.hide();
					});
				}, 'Reschedule')

			}
		}
		//console.log("refresh event end "+frm.doc.status)
	},
	physician: function (frm) {
		//debugger;
		var c = frappe.call({
			method: "frappe.client.get_value",
			args: {
				doctype: "Doctor",
				fieldname: ["first_name", "user_id"],
				filters: { name: ["=", cur_frm.doc.physician] }
			},

			async: false,
			callback: function (data) {
				debugger;
				if (typeof (data.message) != 'undefined') {
					if (data.message.first_name) {
						cur_frm.set_value("doctor_name", data.message.first_name);
						refresh_field("doctor_name");
						cur_frm.set_value("to_doctor", data.message.user_id);
						refresh_field("to_doctor");
						if (frm.doc.__islocal) {
							cur_frm.set_value("first_doctor", frm.doc.doctor_name);
							refresh_field("first_doctor");
						}

					}

				}
			}
		});
	},
	check_availability: function (frm) {
		var { physician, appointment_date, duration } = frm.doc;
		if (!(physician && appointment_date)) {
			frappe.throw(__("Please select Physician and Date"));
		}

		// show booking modal
		frm.call({
			method: 'get_availability_data',
			args: {
				physician: physician,
				date: appointment_date,
				duration: duration,
				notRamadan:frm.doc.not_ramadan,
			},
			callback: (r) => {
				console.log(r);
				var data = r.message;
				frm.call({
					method:'get_time_off',
					args:{
						physician:physician,
						date:appointment_date
					},
					callback:(r)=>{
						
						data.appointments= data.appointments.concat(r.message)
						//console.log(data)
						if (data.available_slots.length > 0) {
							show_availability(data);
						} else {
							show_empty_state();
						}
					}
				});
			}
		});

		function show_empty_state() {
			frappe.msgprint({
				title: __('Not Available'),
				message: __("Physician {0} not available on {1}", [physician.bold(), appointment_date.bold()]),
				indicator: 'red'
			});
		}
		function time_equality_comp(t1,t2){
			return t2.getMinutes()==t1.getMinutes() && t2.getHours()==t1.getHours() ;
		}

		function time_string_parse(time) {
			time = time.split(":");
			let date = new Date();
			date.setHours(time[0]);
			date.setMinutes(time[1]);
			date.setSeconds(time[2]);
			return date;
		}
		function show_availability(data) {


			console.log('here');
			console.log(data)
			var d = new frappe.ui.Dialog({
				title: __("Available slots"),
				fields: [{ fieldtype: 'HTML', fieldname: 'available_slots' }],
				primary_action_label: __("Book"),
				primary_action: function () {
					// book slot
					frm.set_value('appointment_time', selected_slot);
					frm.set_value('duration', data.time_per_appointment);
					//frm.set_value('status','Scheduled');
					d.hide();
					frm.enable_save();
					frm.save();
				}
			});
			var $wrapper = d.fields_dict.available_slots.$wrapper;
			var selected_slot = null;

			// disable dialog action initially
			d.get_primary_btn().attr('disabled', true);

			// make buttons for each slot
			var slot_html = data.available_slots.map(slot => {
				return `<button class="btn btn-default"
					data-name=${slot.from_time}
					style="margin: 0 10px 10px 0; width: 72px" title="Available">
					${slot.from_time.substring(0, slot.from_time.length - 3)}
				</button>`;
			}).join("");

			$wrapper
				.css('margin-bottom', 0)
				.addClass('text-center')
				.html(slot_html);
			//by Reda
			data.appointments.map(slot => {
				//if(slot.duration)
			});
			//console.log("data check")
			//console.log(data);
			// disable buttons for which appointments are booked

			//custom:change button color and tooltip using css attribute
			console.log("meow")

			if(cur_frm.doc.appointment_date == frappe.datetime.now_date() && frappe.datetime._date("HH", false) > "12")
			{
				// console.log("is in")
				let dialog_length = $($wrapper[0].children).length
				
				// console.log($($wrapper[0].children[0]).text().trim())
				let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
				let time_limit = ""
				var currentDate = new Date()
				if(dayNames[currentDate.getDay()] == "Thursday" && frappe.datetime._date("hh:mm", false) >= "08:00" && frappe.datetime._date("hh:mm", false) <= "12:00")
					{time_limit = "8:00"}
				else if (frappe.datetime._date("hh:mm", false) >= "09:00" && frappe.datetime._date("hh:mm", false) <= "12:00")
					{time_limit = "9:00"}
				else
					{
						time_limit = frappe.datetime._date("hh:mm",false)
						if(time_limit < "10:00")
						{
							time_limit = time_limit.slice(1)
						}
					}
				// if( frappe.datetime._date("HH:MM",false) >= "12:00" && frappe.datetime._date("HH:MM",false) <= "23:59")
				// 	time_limit = frappe.datetime._date("hh:mm",false)
				// else
				// 	time_limit = "00:00"
				// 	let current_time_wrap = ""
				for(let i=0; i<dialog_length-1; i++)
				{
					// current_time_wrap = moment($($wrapper[0].children[i]).text().trim(),"HH:mm").format("HH:mm");
					console.log(`time limit: ${time_limit}`)
					// console.log(`time wrap: ${current_time_wrap}`)
					if( $($wrapper[0].children[i]).text().trim() < time_limit )
							{
								
								$($wrapper[0].children[i]).hide()
								console.log("true")
							}

					// if(time_limit < "12:00"  && current_time_wrap >= "12:00")
					// {
					// 	console.log("entered")
					// 	$($wrapper[0].children[i]).hide()
					// }
					
				}
			}
			// else if (cur_frm.doc.appointment_date == moment(frappe.datetime.now_date(), "YYYY-MM-DD").subtract(1,"days").format("YYYY-MM-DD") && frappe.datetime._date("HH:MM",false) < "05:00" )
			// {
			// 	let dialog_length = $($wrapper[0].children).length
			// 	let time_limit = "";
			// 	let current_time_wrap = ""
			// 	// current_time_wrap = moment($($wrapper[0].children[i]).text().trim(),"HH:mm").format("HH:mm");
			// 	time_limit = frappe.datetime._date("HH:MM",false)
			// 		for(let i=0; i<dialog_length; i++)
			// 	{
			// 		current_time_wrap = moment($($wrapper[0].children[i]).text().trim(),"HH:mm").format("HH:mm");

			// 		if(current_time_wrap > "12:00")
			// 			$($wrapper[0].children[i]).hide()
			// 		if(i < dialog_length-1 && current_time_wrap <= time_limit )
			// 			$($wrapper[0].children[i]).hide()
					
			// 		// if(time_limit < "12:00"  && current_time_wrap >= "12:00")
			// 		// {
			// 		// 	console.log("entered")
			// 		// 	$($wrapper[0].children[i]).hide()
			// 		// }
					
			// 	}
				
			// }



			data.appointments.map(slot => {
				if ( slot.status == "waiting attend" || slot.status == "Attended" || slot.status == "Scheduled" || slot.status == "Open" || slot.status == "closed" || slot.status == "To Bill" || slot.status == "Billed" || slot.status == "Under Treatment" || slot.status == 'Retouch') {
					let slots_booked = Math.ceil(slot.duration / data.time_per_appointment);
					//console.log("available slot" )
					//console.log(data.available_slots)
					//console.log("\n");
					//console.log(slot.appointment_time)
					//console.log("meow no error")
					try {
						//var slot_name = data.available_slots.find(e => time_string_parse(e.from_time) >= time_string_parse(slot.appointment_time) && time_string_parse(e.from_time).getHours() == time_string_parse(slot.appointment_time).getHours() ).from_time;
						
						try{
							var slot_name = data.available_slots.find(e => time_string_parse(e.from_time) > time_string_parse(slot.appointment_time) ).from_time;
							//console.log("slot name :="+slot_name)
						}catch(error){
							let i = data.available_slots.findIndex(e=>time_string_parse(e.from_time).getHours() == time_string_parse('00:00:00').getHours());
							var slot_name = data.available_slots[i-1].from_time
							//console.log("error")
							//console.log(`second error ${error}`)
							//console.log(slot_name)
						}
						

						//console.log(`first slot name ${slot_name}`)
						//console.log('meow')
						//console.log(slot.appointment_time)
							if(slot.appointment_time.split(':')[0]< 11)
						{
							let slotindex = data.available_slots.findIndex(e=>time_string_parse(e.from_time).getHours() == time_string_parse('00:00:00').getHours());
							if(slotindex!= -1){

							
							let new_available_slots = data.available_slots.slice(slotindex)
							//console.log("new available slots")
							//console.log(new_available_slots)
							slot_name =  new_available_slots.find(e => time_string_parse(e.from_time) >= time_string_parse(slot.appointment_time) ).from_time;
							//console.log("slot name :="+slot_name)
							}
						}

						let currentindex = data.available_slots.findIndex(e=> e.from_time ==  slot_name)
						if(currentindex != 0 && slot_name!= slot.appointment_time )
						{
							//console.log(`index is ${index}`)
							slot_name = data.available_slots[currentindex-1].from_time
							//console.log(`slot_name is ${slot_name}`)
						}
						//console.log(`slot name : ${slot_name}`)
					} catch (error) {
						slot_name = slot.appointment_time
						//console.log('errror')
						//console.log(`===============================================\n${error}`)
					}

					//console.log("first slot" + slot_name + "meow" + slots_booked);
					//console.log(`here is the slot name ::::::::::::`)
					//console.log(`slot name ::::::::::::::: ${slot_name}`)
					//console.log(slot.appointment_time)
					//if(time_string_parse(slot_name).setMinutes(time_string_parse(slot_name).getMinutes()+slot.duration) >time_string_parse( slot.appointment_time))
					let testtime = time_string_parse(slot_name);
					//console.log(testtime);
					//console.log(slot.duration);
					let minutes = testtime.getMinutes();
					//console.log(minutes)
					testtime.setMinutes(minutes + slot.duration);
					//console.log(testtime);
					//console.log(time_string_parse( slot.appointment_time))
				   //	console.log(testtime >time_string_parse( slot.appointment_time)|| time_equality_comp(testtime,time_string_parse(slot.appointment_time)) )

					//console.log("moew");
					//let dialog_length = $($wrapper[0].children).length


					//for(let i=0; i<dialog_length; i++)
					//{
					//if( $($wrapper[0].children[i]).text().trim() < frappe.datetime._date('hh:mm',false).slice(1))
						//$($wrapper[0].children[i]).hide()
					//}

					if(testtime >time_string_parse( slot.appointment_time)|| time_equality_comp(testtime,time_string_parse(slot.appointment_time)))
					{
						$wrapper
						.find(`button[data-name="${slot_name + ""}"]`)
						.attr('title', 'Booked')
						.css('background-color', 'red')
						if(slot.status == 'closed')
						{
							$wrapper.find(`button[data-name="${slot_name + ""}"]`)
							.attr('title', 'time off')
							.attr('disabled',true)
						}
					}
					

					slot_name = time_string_parse(slot_name + "");
					//console.log(slot)
					//console.log(`slots_booked = ${slots_booked} duration ${slot.duration}   time appointment ${data.time_per_appointment}`)
					let end_time =time_string_parse( slot.appointment_time)
					end_time.setMinutes(end_time.getMinutes()+slot.duration)
					//console.log(`end time ${end_time}`)
					for (let i = 0; i < slots_booked ; i++) {
						console.log(`slot name: ${slot_name}`);
						slot_name.setMinutes(slot_name.getMinutes() + parseInt(data.time_per_appointment));
						var s_slot_name = slot_name.toTimeString().split(" ")[0];
						console.log(s_slot_name)
						//console.log(`end time ${end_time}`)
						if(time_string_parse(s_slot_name)> end_time || time_equality_comp(time_string_parse(s_slot_name),end_time))
							{
								//console.log(`end time \n${end_time} slot name:\n ${time_string_parse(s_slot_name)}`)
								break;
							}
						//console.log("here")
						//console.log(s_slot_name + " " + data.time_per_appointment + "\n");
						if (s_slot_name[0] == '0') {
							var arr = s_slot_name.split("");
							arr.shift();
							s_slot_name = arr.join("");
						}
						console.log(`appointment time : ${slot.appointment_time}\n slot name:${s_slot_name}\n`)
						console.log('----------------------------------------------------------------------')
						
						//if(appointment_time.from_time)
						$wrapper
							.find(`button[data-name="${s_slot_name}"]`)
							.attr('title', 'Booked')
							.css('background-color', 'red')
							if(slot.status == 'closed')
						{
							$wrapper.find(`button[data-name="${s_slot_name}"]`)
							.attr('title', 'time off')
							.attr('disabled',true)
						}
						//.attr('disabled','true')
					}

				}
				console.log("moew")
			});

			// blue button when clicked
			$wrapper.on('click', 'button', function () {
				var $btn = $(this);
				$wrapper.find('button').removeClass('btn-primary');
				$btn.addClass('btn-primary');
				selected_slot = $btn.attr('data-name');
				if (cur_frm.doc.status != "Retouch") {
					if ($btn.attr('title') == 'Booked') {
						console.log($btn.attr('title'));
						frm.set_value('status', 'Waiting');
					}
					else {
						frm.set_value('status', 'Scheduled');
						console.log('else ' + $btn.attr('title'));
					}
				}
				else {
					frm.set_value('status', 'Retouch');
				}
				// enable dialog action
				d.get_primary_btn().attr('disabled', null);
			});

			d.show();
		}
	},
	onload: function (frm) {


		let $foot_warper = $('.timeline-content').find('.frappe-timestamp');
		for (let i = 0; i < $foot_warper.length; i++) {
			$($foot_warper[i]).text($($foot_warper[i]).attr('data-timestamp').split('.')[0]).wrapInner("<strong />")
			$($foot_warper[i]).removeClass('frappe-timestamp')
		}

		//console.log("onload function"+frm.doc.status)
		if (frm.is_new()) {
			frm.set_value("appointment_time", null);
			frm.disable_save();
		}
		let service = frm.doc.service;
		frappe.db.get_value('Services', service, 'service', function (r) {
			cur_frm.doc.service_name = r.service
			cur_frm.refresh_field('service_name')
			//console.log(frm.doc.service)
			//console.log(r.service)

		})

		
	},
});

var get_selected_item = function (frm, tableControl) {
	//console.log(tableControl)
	var arrayOfValues = [];
	$('input:checkbox:checked', tableControl).each(function () {
		arrayOfValues.push($(this).closest('tr').find('td:last').text());
	}).get();
	return arrayOfValues



};
var btn_create_consultation = function (frm) {
	var doc = frm.doc;
	frappe.call({
		method: "clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.create_consultation",
		args: { appointment: doc.name },
		callback: function (data) {
			if (!data.exc) {

				var doclist = frappe.model.sync(data.message);
				frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
			}
		}
	});
};

var btn_create_vital_signs = function (frm) {
	if (!frm.doc.patient) {
		frappe.throw("Please select patient");
	}
	frappe.route_options = {
		"patient": frm.doc.patient,
		"appointment": frm.doc.name,
	};
	frappe.new_doc("Vital Signs");
};

var btn_update_status = function (frm, status) {
	var doc = frm.doc;
	let option = status == "Cancelled"? 'cancel':status;
	
	frappe.confirm(__(`Are you sure you want to ${option} this appointment?`),
		function () {
			frappe.call({
				method:
					"clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.update_status",
				args: { appointment_id: doc.name, status: status },
				callback: function (data) {
					if (!data.exc) {
						frm.reload_doc();
					}
				}
			});
		}
	);
};

var btn_attend = function (frm, status) {
	var doc = frm.doc;
	frappe.confirm(__(`Are you sure you want to make the patient appointment ${status}?`),
		function () {
			if(status == "Attended" || status == 'waiting attend')
			{
				frappe.db.get_value("Customer",cur_frm.doc.client,"id_no").then(
			    (r)=>{
					if(r.message.id_no == '' || r.message.id_no == '0000000000' || r.message.id_no == null )
					{
						//console.log("does it actually work?")
						//console.log(r.message)
						frappe.validated = false;
						frappe.msgprint(__("بالرجاء ادخال رقم هوية صحيح"));
						//frappe.validated = false;
						
					}
					else
					{
						frm.set_value("status",status)
					}
					
						}
					
			)
			}
			else
			{
					frappe.call({
					method:
						"clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.update_status",
					args: { appointment_id: doc.name, status: status },
					callback: function (data) {
						if (!data.exc) {
							frm.reload_doc();
						}
					}
				});
			}
		}
	);
};

var btn_invoice_consultation = function (frm) {
	var doc = frm.doc;
	frappe.call({
		method:
			"clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.create_invoice",
		args: {
			company: doc.company, physician: doc.physician, patient: doc.client,
			appointment_id: doc.name, appointment_date: doc.appointment_date
		},
		callback: function (data) {
			if (!data.exc) {
				if (data.message) {
					frappe.set_route("Form", "Sales Invoice", data.message);
				}
				cur_frm.reload_doc();
			}
		}
	});
};



frappe.ui.form.on("Client Appointment CT", "patient", function (frm) {
	if (frm.doc.patient) {
		frappe.call({
			"method": "frappe.client.get",
			args: {
				doctype: "Patient",
				name: frm.doc.patient
			},
			callback: function (data) {
				var age = null;
				if (data.message.dob) {
					age = calculate_age(data.message.dob);
				}
				frappe.model.set_value(frm.doctype, frm.docname, "patient_age", age);
			}
		});
	}
});

frappe.ui.form.on("Client Appointment CT", "doctor_t", function(frm){


	cur_frm.doc.physician = cur_frm.doc.doctor_t
	cur_frm.refresh_field("physician")

})

// frappe.ui.form.on("Client Appointment CT", "appointment_date", function (frm) {
// 	let ramadan_date_up = ''
// 	if(!cur_frm.doc.ramadan_next_day )
// 	{		
// 			if(frappe.datetime._date("HH:mm") < "05:00" && cur_frm.doc.appointment_date == frappe.datetime.now_date() )
// 		{
// 			ramadan_date_up = moment(cur_frm.doc.appointment_date, "YYYY-MM-DD").subtract(1, "day").format("YYYY-MM-DD")
// 			cur_frm.set_value("appointment_date", ramadan_date_up)
// 			ramadan_date_up = ''
// 		}
// 	}
	
// })



//custom:this is use to reload doc after update status
frappe.ui.form.on("Client Appointment CT", "status", function (frm) {
	frm.refresh_field('status');
	frm.set_value('status', frm.doc.status);
	/*var timeline_item = {
		doctype: "Client Appointment CT",
		name: "test_name",
		title: "test_title",
		content: `<a href =http://2care.wajihah.sa/app/user/${frappe.user.name}> ${frappe.user.name} </a> changed status to ${frm.doc.status} at <h5>${frappe.datetime.get_datetime_as_string()} </h5> `,
		creation: frappe.datetime.get_datetime_as_string()
	}

	if(frm.doc.status == "Attended")
	{
		console.log("was called")
		cur_frm.timeline.add_timeline_item(timeline_item, false);
	}*/

	frappe.call({
		method: "clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.update_status",
		args: { appointment_id: frm.doc.name, status: frm.doc.status },
		callback: (r) => {

		},
		error: (r) => {
			console.log(r.message)
		}
	});
	console.log("refresh on change")
	setTimeout(function () {
		cur_frm.reload_doc();

	}, 2000)

});

frappe.ui.form.on("Client Appointment CT","attended",function(frm){
	frappe.call({
		method:"clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.update_attended_field",
		args:{appointment_id:frm.doc.name, state:frm.doc.attended},
		callback:(r)=>{},
		error:(r)=>{console.log(r.message)}
	})
})

frappe.ui.form.on('Client Appointment CT', 'doctor_name', function (frm) {
	if(cur_frm.doc.clinic != null){

		if (cur_frm.doc.clinic.includes('Dentistry') ) {
			//console.log("entered")
			cur_frm.set_value('service_group', 'خدمات الاسنان');

		}
		else {
			//console.log(`false ${frm.doc.clinic}`)
			cur_frm.set_value('service_group', 'خدمات الجلدية')

		}
}
else
{
	console.log("should be here")
	cur_frm.set_value('service_group', 'خدمات الاسنان');
}

})

var calculate_age = function (birth) {
	var ageMS = Date.parse(Date()) - Date.parse(birth);
	var age = new Date();
	age.setTime(ageMS);
	var years = age.getFullYear() - 1970;
	return years + " Year(s) " + age.getMonth() + " Month(s) " + age.getDate() + " Day(s)";
};

function create_appforward(frm, doctor) {
	var doc = frm.doc;
	frappe.call({
		method:
			"clinic.clinic.doctype.client_appointment_ct.client_appointment_ct.create_forward",
		args: {
			from_doctor: doc.parent_doctor, to_doctor: doctor,
			appointment_id: doc.name, appointment_date: doc.appointment_date
		},
		callback: function (data) {
			if (!data.exc) {
				if (data.message) {
					//frappe.set_route("Form", "Appointment Forward", data.message);
					frappe.show_alert('تم تحويل الطلب');
				}
				//cur_frm.reload_doc();
			}
		}
	});
};

function showavailability(frm) {
	var { physician, appointment_date, duration } = frm.doc;
	if (!(physician && appointment_date)) {
		frappe.throw(__("Please select Physician and Date"));
	}

	// show booking modal
	frm.call({
		method: 'get_availability_data',
		args: {
			physician: physician,
			date: appointment_date,
			duration: duration,
			notRamadan:frm.doc.not_ramadan,
		},
		callback: (r) => {
			console.log(r);
			var data = r.message;
			frm.call({
				method:'get_time_off',
				args:{
					physician:physician,
					date:appointment_date
				},
				callback:(r)=>{
					
					data.appointments= data.appointments.concat(r.message)
					//console.log(data)
					if (data.available_slots.length > 0) {
						show_availability(data);
					} else {
						show_empty_state();
					}
				}
			});
		}
	});

	function show_empty_state() {
		frappe.msgprint({
			title: __('Not Available'),
			message: __("Physician {0} not available on {1}", [physician.bold(), appointment_date.bold()]),
			indicator: 'red'
		});
	}
	//compare if the time matches in hours and minutes
	function time_equality_comp(t1,t2){
		return t2.getMinutes()==t1.getMinutes() && t2.getHours()==t1.getHours() ;
	}
	

	function time_string_parse(time) {
		time = time.split(":");
		let date = new Date();
		date.setHours(time[0]);
		date.setMinutes(time[1]);
		date.setSeconds(time[2]);
		return date;
	}

	//local function a bit different than the origninal
	function show_availability(data) {

		console.log("here 1");
		console.log(data)

		var d = new frappe.ui.Dialog({
			title: __("Available slots"),
			fields: [{ fieldtype: 'HTML', fieldname: 'available_slots' }],
			primary_action_label: __("Book"),
			primary_action: function () {
				// book slot
				frm.set_value('appointment_time', selected_slot);
				frm.set_value('duration', data.time_per_appointment);
				//frm.set_value('status','Scheduled');
				d.hide();
				frm.enable_save();
				frm.save();
			}
		});
		var $wrapper = d.fields_dict.available_slots.$wrapper;
		var selected_slot = null;

		// disable dialog action initially
		d.get_primary_btn().attr('disabled', true);

		// make buttons for each slot
		var slot_html = data.available_slots.map(slot => {
			return `<button class="btn btn-default"
					data-name=${slot.from_time}
					style="margin: 0 10px 10px 0; width: 72px" title="Available">
					${slot.from_time.substring(0, slot.from_time.length - 3)}
				</button>`;
		}).join("");

		$wrapper
			.css('margin-bottom', 0)
			.addClass('text-center')
			.html(slot_html);
		//by Reda
		data.appointments.map(slot => {
			//if(slot.duration)
		});



		if(cur_frm.doc.appointment_date == frappe.datetime.now_date())
		{
			// console.log("is in")
				let dialog_length = $($wrapper[0].children).length
				
				// console.log($($wrapper[0].children[0]).text().trim())
				// let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
				let time_limit = ""
				// var currentDate = new Date()
				// if(dayNames[currentDate.getDay()] == "Thursday" && frappe.datetime._date("hh:mm", false) >= "08:00" && frappe.datetime._date("hh:mm", false) <= "12:00")
				// 	{time_limit = "8:00"}
				// else if (frappe.datetime._date("hh:mm", false) >= "09:00" && frappe.datetime._date("hh:mm", false) <= "12:00")
				// 	{time_limit = "9:00"}
				// else
				// 	{
				// 		time_limit = frappe.datetime._date("HH:MM",false)
				// 		if(time_limit < "10:00")
				// 		{
				// 			time_limit = time_limit.slice(1)
				// 		}
				// 	}
				if( frappe.datetime._date("HH:MM",false) >= "12:00" && frappe.datetime._date("HH:MM",false) <= "23:00")
					time_limit = frappe.datetime._date("HH:MM",false)
				else
					time_limit = "00:00"
				for(let i=0; i<dialog_length; i++)
				{
					console.log(`time limit: ${time_limit}`)
					if( $($wrapper[0].children[i]).text().trim() < time_limit && moment($($wrapper[0].children[i]).text().trim(),"HH:mm").format("HH:mm") > "12:00" )
							$($wrapper[0].children[i]).hide()
					
				}
		}

		// disable buttons for which appointments are booked

		//custom:change button color and tooltip using css attribute
		data.appointments.map(slot => {
			if ( slot.status == "waiting attend" || slot.status == "Attended" || slot.status == "Scheduled" || slot.status == "Open" || slot.status == "closed" || slot.status == "To Bill" || slot.status == "Billed" || slot.status == "Under Treatment" || slot.status == "Retouch") {
				var slots_booked = Math.ceil(slot.duration / data.time_per_appointment);
				console.log(data.available_slots)
				try {
					//var slot_name = data.available_slots.find(e => time_string_parse(e.from_time) >= time_string_parse(slot.appointment_time) && time_string_parse(e.from_time).getHours() == time_string_parse(slot.appointment_time).getHours() ).from_time;
					
					try{
						var slot_name = data.available_slots.find(e => time_string_parse(e.from_time) > time_string_parse(slot.appointment_time) ).from_time;
					}catch(error){
						let i = data.available_slots.findIndex(e=>time_string_parse(e.from_time).getHours() == time_string_parse('00:00:00').getHours());
						var slot_name = data.available_slots[i-1].from_time
						//console.log(`second error ${error}`)
						//console.log(slot_name)
					}
					

					//console.log(`first slot name ${slot_name}`)
					//console.log('meow')
						if(slot.appointment_time.split(':')[0]< 11)
					{
						let slotindex = data.available_slots.findIndex(e=>time_string_parse(e.from_time).getHours() == time_string_parse('00:00:00').getHours());
						if(slotindex!= -1){
						let new_available_slots = data.available_slots.slice(slotindex)
						slot_name =  new_available_slots.find(e => time_string_parse(e.from_time) >= time_string_parse(slot.appointment_time) ).from_time;}
					}

					let currentindex = data.available_slots.findIndex(e=> e.from_time ==  slot_name)
					if(currentindex != 0 && slot_name!= slot.appointment_time )
					{
						//console.log(`index is ${index}`)
						slot_name = data.available_slots[currentindex-1].from_time
						//console.log(`slot_name is ${slot_name}`)
					}
					//console.log(`slot name : ${slot_name}`)
				} catch (error) {
					slot_name = slot.appointment_time
					//console.log('errror')
					//console.log(`===============================================\n${error}`)
				}

				//console.log("first slot" + slot_name + "meow" + slots_booked);
				//console.log(`here is the slot name ::::::::::::`)
				//console.log(`slot name ::::::::::::::: ${slot_name}`)
				//console.log(slot.appointment_time)
				//if(time_string_parse(slot_name).setMinutes(time_string_parse(slot_name).getMinutes()+slot.duration) >time_string_parse( slot.appointment_time))
				let testtime = time_string_parse(slot_name);
				//console.log(testtime);
				//console.log(slot.duration);
				let minutes = testtime.getMinutes();
				//console.log(minutes)
				testtime.setMinutes(minutes + slot.duration);
				//console.log(testtime);
			//	console.log(time_string_parse( slot.appointment_time))
			//	console.log(testtime >time_string_parse( slot.appointment_time)|| time_equality_comp(testtime,time_string_parse(slot.appointment_time)) )
				//let dialog_length = $($wrapper[0].children).length


				//for(let i=0; i<dialog_length; i++)
				//{
				//if( $($wrapper[0].children[i]).text().trim() < frappe.datetime._date('hh:mm',false).slice(1))
				//	$($wrapper[0].children[i]).hide()
				//}
				
				if(testtime >time_string_parse( slot.appointment_time)|| time_equality_comp(testtime,time_string_parse(slot.appointment_time)))
				{
					$wrapper
					.find(`button[data-name="${slot_name + ""}"]`)
					.attr('title', 'Booked')
					.css('background-color', 'red')
					if(slot.status == "closed")
					{
						$wrapper
						.find(`button[data-name="${slot_name + ""}"]`)
						.attr('title', 'time off')
						.attr("disabled",true)
					}
				}
				

				slot_name = time_string_parse(slot_name + "");
				//console.log(slot)
				//console.log(`slots_booked = ${slots_booked} duration ${slot.duration}   time appointment ${data.time_per_appointment}`)
				let end_time =time_string_parse( slot.appointment_time)
				end_time.setMinutes(end_time.getMinutes()+slot.duration)
				//console.log(`end time ${end_time}`)
				for (let i = 0; i < slots_booked ; i++) {
					console.log(`slot name: ${slot_name}`);
					slot_name.setMinutes(slot_name.getMinutes() + parseInt(data.time_per_appointment));
					var s_slot_name = slot_name.toTimeString().split(" ")[0];
					console.log(s_slot_name)
					//console.log(`end time ${end_time}`)
					if(time_string_parse(s_slot_name)> end_time || time_equality_comp(time_string_parse(s_slot_name),end_time))
						{
							//console.log(`end time \n${end_time} slot name:\n ${time_string_parse(s_slot_name)}`)
							break;
						}
					//console.log("here")
					//console.log(s_slot_name + " " + data.time_per_appointment + "\n");
					if (s_slot_name[0] == '0') {
						var arr = s_slot_name.split("");
						arr.shift();
						s_slot_name = arr.join("");
					}
					console.log(`appointment time : ${slot.appointment_time}\n slot name:${s_slot_name}\n`)
					console.log('----------------------------------------------------------------------')
					
					//if(appointment_time.from_time)
					
					$wrapper
						.find(`button[data-name="${s_slot_name}"]`)
						.attr('title', 'Booked')
						.css('background-color', 'red')
						if(slot.status == "closed")
						{
							$wrapper
							.find(`button[data-name="${s_slot_name}"]`)
							.attr('title', 'time off')
							.attr("disabled",true)
						}
					//.attr('disabled','true')
				}

			}
		});

		// blue button when clicked
		$wrapper.on('click', 'button', function () {
			var $btn = $(this);
			$wrapper.find('button').removeClass('btn-primary');
			$btn.addClass('btn-primary');
			selected_slot = $btn.attr('data-name');
			if (cur_frm.doc.status != "Retouch") {
				if ($btn.attr('title') == 'Booked') {
					console.log($btn.attr('title'));
					frm.set_value('status', 'Waiting');
				}
				else {
					frm.set_value('status', 'Scheduled');
					console.log('else ' + $btn.attr('title'));
				}
			}
			else {
				frm.set_value('status', 'Retouch');
			}
			// enable dialog action
			d.get_primary_btn().attr('disabled', null);
		});

		d.show();
		var dialog_ = d.$wrapper.find('.modal-dialog');
		dialog_.parent().unbind('click');
		d.$wrapper.find('.modal-actions').click(() => {
			frm.reload_doc();
			d.hide()
		})
		//frm.save();
	}
}