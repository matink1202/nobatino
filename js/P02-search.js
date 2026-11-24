(() => {
	'use strict';

	const form = document.getElementById('doctor-filters');
	const fields = {
		q: document.getElementById('doctor-name'),
		specialty: document.getElementById('doctor-specialty'),
		city: document.getElementById('doctor-city'),
		minRating: document.getElementById('doctor-rating'),
		availability: document.getElementById('doctor-availability'),
		maxFee: document.getElementById('doctor-fee'),
		service: document.getElementById('doctor-service'),
		sort: document.getElementById('doctor-sort')
	};
	const clearButton = document.getElementById('clear-filters');
	const advancedPanel = document.getElementById('advanced-filters');
	const advancedCount = document.getElementById('advanced-count');
	const advancedKeys = ['availability', 'maxFee', 'service'];
	const count = document.getElementById('results-count');
	const message = document.getElementById('results-message');
	const list = document.getElementById('doctor-list');
	const cardTemplate = document.getElementById('doctor-card');
	const numberFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
	const dateFormat = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });

	form.addEventListener('submit', event => event.preventDefault());

	if (typeof getAllDoctors !== 'function') {
		message.textContent = 'فهرست پزشکان بارگیری نشد. صفحه را دوباره باز کنید.';
		message.setAttribute('role', 'alert');
		message.hidden = false;
		for (const field of Object.values(fields)) field.disabled = true;
		return;
	}
	const doctors = getAllDoctors();

	function normalize(text) {
		return text.normalize('NFKC')
			.replace(/[يى]/g, 'ی')
			.replace(/ك/g, 'ک')
			.replace(/[\p{M}ـ]/gu, '')
			.replace(/[\s\u200c]+/g, ' ')
			.trim()
			.toLowerCase();
	}

	const nameKey = text => normalize(text).replaceAll(' ', '');
	const specialtyKey = text => normalize(text).replace(/^متخصص /, '');

	function fillOptions(key, keyFor) {
		const options = new Map();
		for (const doctor of doctors) {
			const value = keyFor(doctor[key]);
			if (value && !options.has(value)) options.set(value, doctor[key]);
		}
		const sorted = [...options].sort((a, b) => a[1].localeCompare(b[1], 'fa'));
		for (const [value, label] of sorted) fields[key].add(new Option(label, value));
	}

	function applyInitialOption(key, rawValue, keyFor) {
		const displayValue = rawValue.trim().slice(0, 100);
		const value = keyFor(displayValue);
		if (value && ![...fields[key].options].some(option => option.value === value)) {
			const option = new Option(displayValue, value);
			option.dataset.fromSearch = '';
			fields[key].add(option);
		}
		fields[key].value = value;
	}

	function getSearchDays(now, range) {
		const first = range === 'tomorrow' ? 1 : 0;
		const length = range === 'today' || range === 'tomorrow' ? 1 : 7;
		return Array.from({ length }, (_, index) => {
			const offset = first + index;
			const date = new Date(now);
			date.setDate(date.getDate() + offset);
			return { date, offset };
		});
	}

	function nearestAppointment(doctor, days, now) {
		for (const day of days) {
			const slot = getPublicAppointmentSlots(doctor.id, day.date, now).find(candidate => candidate.canBook);
			if (slot) return { day, slot };
		}
		return null;
	}

	function formatAppointment(appointment, scheduleReadable) {
		if (!scheduleReadable) return 'زمان نوبت در دسترس نیست';
		if (!appointment) return fields.availability.value
			? 'در بازهٔ انتخابی نوبتی نیست'
			: 'تا ۷ روز آینده نوبتی نیست';

		const { day, slot } = appointment;
		const label = day.offset === 0 ? 'امروز' : day.offset === 1 ? 'فردا' : dateFormat.format(day.date);
		return `${label}، ساعت ${slot.displayTime}`;
	}

	const sortResults = {
		soonest: ({ appointment }) => appointment?.slot.startsAt ?? Infinity,
		fee: ({ doctor }) => Number.isFinite(doctor.consultationFeeNumeric) ? doctor.consultationFeeNumeric : Infinity,
		rating: ({ doctor }) => Number.isFinite(doctor.rating) ? -doctor.rating : Infinity
	};

	function renderCard({ doctor, appointment }, scheduleReadable) {
		const card = cardTemplate.content.cloneNode(true);
		const name = card.querySelector('.doctor-name');
		const specialty = card.querySelector('.doctor-specialty');
		const city = card.querySelector('.doctor-city');
		const rating = card.querySelector('.doctor-rating-text');
		const image = card.querySelector('img');
		const link = card.querySelector('.doctor-link');

		name.textContent = doctor.name;
		specialty.textContent = doctor.specialty;
		city.textContent = doctor.city;
		rating.textContent = Number.isFinite(doctor.rating) ? `${numberFormat.format(doctor.rating)} از ۵` : 'بدون امتیاز';
		const fee = doctor.consultationFeeNumeric;
		card.querySelector('.doctor-fee').textContent = Number.isFinite(fee)
			? `${numberFormat.format(fee)} تومان`
			: 'اعلام نشده';
		card.querySelector('.doctor-next-slot').textContent = formatAppointment(appointment, scheduleReadable);
		card.querySelector('.doctor-initial').textContent = doctor.name.replace(/^دکتر\s+/, '').charAt(0);
		if (doctor.photo) {
			image.addEventListener('error', () => { image.hidden = true; }, { once: true });
			image.src = '../images/' + encodeURIComponent(doctor.photo);
			image.hidden = false;
		}
		link.href = 'P02-doctor-details.html?' + new URLSearchParams({ id: doctor.id });
		link.setAttribute('aria-label', `مشاهدهٔ پزشک، ${doctor.name}`);
		return card;
	}

	function render() {
		const query = nameKey(fields.q.value);
		const specialty = fields.specialty.value;
		const city = fields.city.value;
		const minRating = Number(fields.minRating.value);
		const maxFee = Number(fields.maxFee.value);
		const service = nameKey(fields.service.value);
		const range = fields.availability.value;
		const candidates = doctors.filter(doctor =>
			(!query || nameKey(doctor.name).includes(query)) &&
			(!specialty || specialtyKey(doctor.specialty) === specialty) &&
			(!city || normalize(doctor.city) === city) &&
			(!minRating || (Number.isFinite(doctor.rating) && doctor.rating >= minRating)) &&
			(!maxFee || (Number.isFinite(doctor.consultationFeeNumeric) && doctor.consultationFeeNumeric <= maxFee)) &&
			(!service || (doctor.services || []).some(item => nameKey(item).includes(service)))
		);

		let scheduleReadable = typeof getPublicAppointmentSlots === 'function' && typeof ReservationSystem !== 'undefined';
		let rows = candidates.map(doctor => ({ doctor, appointment: null }));
		if (scheduleReadable && candidates.length) {
			try {
				const now = new Date();
				const days = getSearchDays(now, range);
				rows = candidates.map(doctor => ({ doctor, appointment: nearestAppointment(doctor, days, now) }));
			} catch {
				scheduleReadable = false;
			}
		}

		const matches = range ? rows.filter(row => row.appointment) : rows;
		const sortValue = sortResults[fields.sort.value];
		if (sortValue) matches.sort((a, b) => sortValue(a) - sortValue(b));
		list.replaceChildren(...matches.map(row => renderCard(row, scheduleReadable)));

		const resultCount = `${numberFormat.format(matches.length)} پزشک پیدا شد`;
		if (count.textContent !== resultCount) count.textContent = resultCount;

		message.hidden = matches.length > 0;
		if (!doctors.length) message.textContent = 'پزشکی برای نمایش وجود ندارد.';
		else if (range && !scheduleReadable) message.textContent = 'زمان نوبت‌ها در دسترس نیست. فیلتر زمان را پاک کنید و دوباره امتحان کنید.';
		else message.textContent = 'پزشکی با این فیلترها پیدا نشد.';

		clearButton.hidden = !Object.entries(fields).some(([key, field]) => key !== 'sort' && field.value.trim());
		const moreActive = advancedKeys.filter(key => fields[key].value.trim()).length;
		advancedCount.textContent = numberFormat.format(moreActive);
		advancedCount.hidden = moreActive === 0;
	}

	function updateSearch() {
		render();
		// Local file previews support incoming filters without rewriting the file URL.
		if (location.protocol === 'file:') return;
		const url = new URL(location.href);
		for (const [key, field] of Object.entries(fields)) {
			const value = (key === 'specialty' || key === 'city') && field.value
				? field.selectedOptions[0].textContent.trim()
				: field.value.trim();
			if (value) url.searchParams.set(key, value);
			else url.searchParams.delete(key);
		}
		if (url.href !== location.href) history.replaceState(history.state, '', url);
	}

	function readSearch() {
		const params = new URLSearchParams(location.search);
		for (const key of ['q', 'service']) fields[key].value = (params.get(key) || '').slice(0, 100);

		for (const option of form.querySelectorAll('[data-from-search]')) option.remove();
		applyInitialOption('specialty', params.get('specialty') || '', specialtyKey);
		applyInitialOption('city', params.get('city') || '', normalize);

		for (const key of ['minRating', 'availability', 'maxFee', 'sort']) {
			fields[key].value = params.get(key) || '';
			if (fields[key].selectedIndex === -1) fields[key].value = '';
		}
		if (advancedKeys.some(key => fields[key].value.trim())) advancedPanel.open = true;
		render();
	}

	fillOptions('specialty', specialtyKey);
	fillOptions('city', normalize);
	readSearch();
	window.addEventListener('popstate', readSearch);
	window.addEventListener('pageshow', event => { if (event.persisted) render(); });
	window.addEventListener('storage', event => {
		if (typeof ReservationSystem !== 'undefined' && (event.key === ReservationSystem.STORAGE_KEY || event.key === null)) render();
	});
	for (const field of Object.values(fields)) {
		field.addEventListener(field.tagName === 'INPUT' ? 'input' : 'change', updateSearch);
	}
	clearButton.addEventListener('click', () => {
		form.reset();
		for (const option of form.querySelectorAll('[data-from-search]')) option.remove();
		updateSearch();
		fields.q.focus();
	});
})();
