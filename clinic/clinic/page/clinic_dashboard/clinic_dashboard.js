frappe.pages['clinic-dashboard'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Manager Analytics Dashboard',
		single_column: true
	});

	// Attach the dashboard instance to the page so it persists
	page.dashboard = new ClinicDashboard(page);
};

class ClinicDashboard {
	constructor(page) {
		this.page = page;
		this.$parent = $(page.body);
		this.charts = {};
		this.init();
	}

	init() {
		this.render_skeleton();
		this.bind_events();
		this.fetch_data();
	}

	// ── Skeleton / layout ────────────────────────────────────────────────

	render_skeleton() {
		this.$parent.html(`
            <div class="clinic-dashboard-wrapper">
                <!-- Filters -->
                <div class="dashboard-filters" id="dash-filters">
                    <div class="filter-group">
                        <label>${__('From Date')}</label>
                        <input type="date" id="filter-from-date"
                            value="${frappe.datetime.month_start()}" />
                    </div>
                    <div class="filter-group">
                        <label>${__('To Date')}</label>
                        <input type="date" id="filter-to-date"
                            value="${frappe.datetime.month_end()}" />
                    </div>
                    <div class="filter-group">
                        <label>${__('Clinic')}</label>
                        <input type="text" id="filter-clinic"
                               placeholder="${__('All Clinics')}" />
                    </div>
                    <div class="filter-group">
                        <label>${__('Doctor')}</label>
                        <input type="text" id="filter-doctor"
                               placeholder="${__('All Doctors')}" />
                    </div>
                    <div class="filter-group">
                        <label>${__('Lead Source')}</label>
                        <input type="text" id="filter-lead-source"
                               placeholder="${__('All Sources')}" />
                    </div>
                    <button class="btn-refresh" id="btn-refresh">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5"
                            stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                        ${__('Refresh')}
                    </button>
                </div>

                <!-- KPI row -->
                <div class="kpi-grid" id="kpi-grid"></div>

                <!-- Referral summary -->
                <div class="referral-grid" id="referral-grid"></div>

                <!-- Charts 2×2 -->
                <div class="charts-grid" id="charts-grid">
                    <div class="chart-card">
                        <div class="chart-title">
                            <span class="dot" style="background:var(--accent-blue)"></span>
                            ${__('Appointments by Status')}
                        </div>
                        <div id="chart-status"></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">
                            <span class="dot" style="background:var(--accent-green)"></span>
                            ${__('Revenue by Clinic')}
                        </div>
                        <div id="chart-clinic-revenue"></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">
                            <span class="dot" style="background:var(--accent-purple)"></span>
                            ${__('Lead Source Performance')}
                        </div>
                        <div id="chart-lead-source"></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">
                            <span class="dot" style="background:var(--accent-amber)"></span>
                            ${__('Top Doctors by Revenue')}
                        </div>
                        <div id="chart-top-doctors"></div>
                    </div>
                </div>

                <!-- Doctor financial table -->
                <div class="doctor-table-card" id="doctor-table-card">
                    <div class="table-title">${__('Doctor Financial Summary')}</div>
                    <table class="doctor-table" id="doctor-table">
                        <thead>
                            <tr>
                                <th>${__('Doctor')}</th>
                                <th>${__('Appointments')}</th>
                                <th>${__('Total Invoiced')}</th>
                                <th>${__('Total Paid')}</th>
                                <th>${__('Outstanding')}</th>
                                <th>${__('Avg / Appointment')}</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `);

		// Make Link-style auto-completes for filter inputs
		this.setup_link_fields();
	}

	setup_link_fields() {
		const me = this;
		// Clinic → Link to Department
		this.clinic_control = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Link',
				options: 'Department',
				fieldname: 'clinic',
				placeholder: __('All Clinics'),
				only_input: true,
			},
			parent: this.$parent.find('#filter-clinic').parent(),
			render_input: true,
		});
		this.clinic_control.$input.attr('id', 'filter-clinic-link');
		this.$parent.find('#filter-clinic').hide();

		// Doctor → Link to Doctor
		this.doctor_control = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Link',
				options: 'Doctor',
				fieldname: 'doctor',
				placeholder: __('All Doctors'),
				only_input: true,
			},
			parent: this.$parent.find('#filter-doctor').parent(),
			render_input: true,
		});
		this.doctor_control.$input.attr('id', 'filter-doctor-link');
		this.$parent.find('#filter-doctor').hide();

		// Lead Source → Link to Lead Source
		this.lead_source_control = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Link',
				options: 'Lead Source',
				fieldname: 'lead_source',
				placeholder: __('All Sources'),
				only_input: true,
			},
			parent: this.$parent.find('#filter-lead-source').parent(),
			render_input: true,
		});
		this.lead_source_control.$input.attr('id', 'filter-lead-source-link');
		this.$parent.find('#filter-lead-source').hide();
	}

	// ── Events ───────────────────────────────────────────────────────────

	bind_events() {
		this.$parent.find('#btn-refresh').on('click', () => this.fetch_data());
	}

	get_filters() {
		return {
			from_date: this.$parent.find('#filter-from-date').val(),
			to_date: this.$parent.find('#filter-to-date').val(),
			clinic: this.clinic_control ? this.clinic_control.get_value() : '',
			doctor: this.doctor_control ? this.doctor_control.get_value() : '',
			lead_source: this.lead_source_control ? this.lead_source_control.get_value() : '',
		};
	}

	// ── Data fetch ───────────────────────────────────────────────────────

	fetch_data() {
		const filters = this.get_filters();
		frappe.call({
			method: 'clinic.clinic.page.clinic_dashboard.clinic_dashboard.get_dashboard_data',
			args: filters,
			freeze: true,
			freeze_message: __('Loading dashboard…'),
			callback: (r) => {
				if (r && r.message) {
					this.render_all(r.message);
				}
			}
		});
	}

	// ── Render orchestrator ──────────────────────────────────────────────

	render_all(data) {
		this.render_kpis(data);
		this.render_referral_cards(data.referral_stats || {});
		this.render_status_chart(data.appointments_by_status || []);
		this.render_clinic_revenue_chart(data.revenue_by_clinic || []);
		this.render_lead_source_chart(data.lead_source_performance || []);
		this.render_top_doctors_chart(data.doctor_financial || []);
		this.render_doctor_table(data.doctor_financial || []);
	}

	// ── KPI cards ────────────────────────────────────────────────────────

	render_kpis(data) {
		const summary = data.appointment_summary || {};
		const rev = data.revenue_summary || {};
		const ref = data.referral_stats || {};
		const doctors = data.doctor_financial || [];

		// compute average per appointment
		let totalPaid = doctors.reduce((s, d) => s + (d.total_paid || 0), 0);
		let totalAppt = doctors.reduce((s, d) => s + (d.appointment_count || 0), 0);
		let avg = totalAppt > 0 ? (totalPaid / totalAppt) : 0;

		const kpis = [
			{ label: __('Total Appointments'), value: this.fmt_number(summary.total_appointments || 0), cls: 'blue' },
			{
				label: __('Total Revenue'), value: this.fmt_currency(rev.total_paid || 0), cls: 'green',
				sub: __('Invoiced: ') + this.fmt_currency(rev.total_invoiced || 0)
			},
			{ label: __('Outstanding'), value: this.fmt_currency(rev.total_outstanding || 0), cls: 'red' },
			{
				label: __('Referrals'), value: this.fmt_number(ref.total_referrals || 0), cls: 'purple',
				sub: __('Billed: ') + this.fmt_number(ref.billed_referrals || 0)
			},
			{ label: __('Avg / Appointment'), value: this.fmt_currency(avg), cls: 'amber' },
		];

		let html = kpis.map(k => `
            <div class="kpi-card ${k.cls}">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value">${k.value}</div>
                ${k.sub ? `<div class="kpi-sub">${k.sub}</div>` : ''}
            </div>
        `).join('');

		this.$parent.find('#kpi-grid').html(html);
	}

	// ── Referral cards ───────────────────────────────────────────────────

	render_referral_cards(ref) {
		const cards = [
			{ label: __('Total Referrals'), value: ref.total_referrals || 0 },
			{ label: __('Billed Referrals'), value: ref.billed_referrals || 0 },
			{ label: __('Non-Billed'), value: ref.non_billed_referrals || 0 },
		];
		let html = cards.map(c => `
            <div class="ref-card">
                <div class="ref-value">${this.fmt_number(c.value)}</div>
                <div class="ref-label">${c.label}</div>
            </div>
        `).join('');
		this.$parent.find('#referral-grid').html(html);
	}

	// ── Charts ───────────────────────────────────────────────────────────

	_make_chart(key, el, opts) {
		// Destroy previous chart instance to free memory
		if (this.charts[key] && this.charts[key].destroy) {
			this.charts[key].destroy();
		}
		el.innerHTML = '';
		this.charts[key] = new frappe.Chart(el, opts);
	}

	render_status_chart(rows) {
		const el = this.$parent.find('#chart-status').get(0);
		if (!el) return;
		if (!rows.length) { el.innerHTML = this.empty_state(); return; }

		const colors = {
			'Scheduled': '#3b82f6', 'Waiting': '#f59e0b',
			'waiting attend': '#06b6d4', 'Attended': '#10b981',
			'Under Treatment': '#8b5cf6', 'To Bill': '#f97316',
			'Billed': '#22c55e', 'Partial Billed': '#eab308',
			'Retouch': '#6366f1',
		};

		this._make_chart('status', el, {
			type: 'donut',
			data: {
				labels: rows.map(r => r.status),
				datasets: [{ values: rows.map(r => r.count) }]
			},
			colors: rows.map(r => colors[r.status] || '#94a3b8'),
			height: 280,
			maxSlices: 10,
		});
	}

	render_clinic_revenue_chart(rows) {
		const el = this.$parent.find('#chart-clinic-revenue').get(0);
		if (!el) return;
		if (!rows.length) { el.innerHTML = this.empty_state(); return; }

		this._make_chart('clinic_rev', el, {
			type: 'bar',
			data: {
				labels: rows.map(r => r.clinic || __('Unknown')),
				datasets: [
					{ name: __('Invoiced'), values: rows.map(r => r.total_invoiced) },
					{ name: __('Paid'), values: rows.map(r => r.total_paid) },
				]
			},
			colors: ['#3b82f6', '#10b981'],
			height: 280,
			barOptions: { spaceRatio: 0.4 },
		});
	}

	render_lead_source_chart(rows) {
		const el = this.$parent.find('#chart-lead-source').get(0);
		if (!el) return;
		if (!rows.length) { el.innerHTML = this.empty_state(); return; }

		this._make_chart('lead_src', el, {
			type: 'bar',
			data: {
				labels: rows.map(r => r.lead_source || __('Unknown')),
				datasets: [
					{ name: __('New Billing'), values: rows.map(r => r.new_billing) },
					{ name: __('Repeat Billing'), values: rows.map(r => r.repeat_billing) },
				]
			},
			colors: ['#8b5cf6', '#14b8a6'],
			height: 280,
			barOptions: { spaceRatio: 0.4 },
		});
	}

	render_top_doctors_chart(rows) {
		const el = this.$parent.find('#chart-top-doctors').get(0);
		if (!el) return;
		const top = rows.slice(0, 10);
		if (!top.length) { el.innerHTML = this.empty_state(); return; }

		this._make_chart('top_docs', el, {
			type: 'bar',
			data: {
				labels: top.map(r => r.doctor_name || r.doctor),
				datasets: [
					{ name: __('Paid'), values: top.map(r => r.total_paid) },
					{ name: __('Outstanding'), values: top.map(r => r.total_outstanding) },
				]
			},
			colors: ['#10b981', '#ef4444'],
			height: 280,
			barOptions: { spaceRatio: 0.4 },
		});
	}

	// ── Doctor table ─────────────────────────────────────────────────────

	render_doctor_table(rows) {
		const tbody = this.$parent.find('#doctor-table tbody');
		if (!rows.length) {
			tbody.html(`<tr><td colspan="6" style="text-align:center;padding:30px;color:#9ca3af">${__('No data')}</td></tr>`);
			return;
		}
		let html = rows.map(r => `
            <tr>
                <td>${r.doctor_name || r.doctor}</td>
                <td>${r.appointment_count}</td>
                <td class="currency">${this.fmt_currency(r.total_invoiced)}</td>
                <td class="currency positive">${this.fmt_currency(r.total_paid)}</td>
                <td class="currency negative">${this.fmt_currency(r.total_outstanding)}</td>
                <td class="currency">${this.fmt_currency(r.average_per_appointment)}</td>
            </tr>
        `).join('');
		tbody.html(html);
	}

	// ── Helpers ──────────────────────────────────────────────────────────

	fmt_currency(v) {
		return format_currency(v, frappe.defaults.get_default('currency') || 'SAR');
	}

	fmt_number(v) {
		return (v || 0).toLocaleString();
	}

	empty_state() {
		return `<div style="text-align:center;padding:40px 0;color:#9ca3af;font-size:13px">${__('No data for selected filters')}</div>`;
	}
}