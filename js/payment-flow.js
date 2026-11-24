const PaymentFlow = (() => {
	'use strict';

	const GATEWAY = 'P07-payment-gateway.html';
	const SUCCESS = 'P07-payment-success.html';
	const FAILURE = 'P07-payment-failure.html';
	const numbers = new Intl.NumberFormat('fa-IR');
	const dates = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

	function formatDigits(value) {
		return String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]);
	}

	function url(page, reservation, reason) {
		const params = reservation ? new URLSearchParams({ reservationId: reservation.id }) : new URLSearchParams({ demo: '1' });
		if (reason) params.set('reason', reason);
		return page + '?' + params;
	}

	function doctorUrl(reservation, restore = false) {
		if (!reservation) return 'P02-search.html';
		const params = new URLSearchParams({ id: reservation.doctorId });
		if (restore) params.set('reservationId', reservation.id);
		return 'P02-doctor-details.html?' + params;
	}

	function getReservation(allowDirectDemo = false) {
		const params = new URLSearchParams(location.search);
		const id = params.get('reservationId');
		if (!params.has('reservationId')) {
			return { reservation: null, demo: allowDirectDemo || params.get('demo') === '1' };
		}
		try {
			const record = ReservationSystem.getReservation(id);
			return { reservation: record?.id === id ? record : null, demo: false };
		} catch {
			return { reservation: null, demo: false };
		}
	}

	function canPay(reservation) {
		return Boolean(reservation && ReservationSystem.isPaymentPending(reservation) && Date.parse(reservation.expiresAt) > Date.now());
	}

	function fill(id, value) {
		document.getElementById(id).textContent = value;
	}

	function fillReceipt(prefix, reservation) {
		const doctor = reservation ? getDoctorById(reservation.doctorId) : getAllDoctors()[0];
		const visit = reservation?.visitDate ? new Date(reservation.visitDate + 'T00:00:00') : null;
		const dateText = visit && Number.isFinite(visit.getTime())
			? dates.format(visit)
			: reservation ? formatDigits(reservation.appointmentDate) : 'نمونه';
		const fee = reservation?.consultationFee ?? doctor?.consultationFeeNumeric;
		fill(prefix + 'Doctor', doctor?.name || '—');
		fill(prefix + 'Time', `${dateText}، ساعت ${formatDigits(reservation?.startTime || '10:30')}`);
		fill(prefix + 'Reservation', reservation?.id || 'آزمایشی');
		if (document.getElementById(prefix + 'Amount')) {
			fill(prefix + 'Amount', Number.isFinite(fee) ? `${numbers.format(fee)} تومان` : '—');
		}
	}

	function autoReturn(target, seconds) {
		const note = document.getElementById('autoReturn');
		let remaining = seconds;
		const timer = setInterval(() => {
			if (--remaining <= 0) {
				clearInterval(timer);
				location.href = target;
				return;
			}
			note.textContent = `بازگشت خودکار به نوبتینو تا ${formatDigits(remaining)} ثانیهٔ دیگر…`;
		}, 1000);
		document.addEventListener('click', event => {
			if (event.target.closest('a')) clearInterval(timer);
		});
	}

	return { GATEWAY, SUCCESS, FAILURE, url, doctorUrl, getReservation, canPay, fill, fillReceipt, autoReturn };
})();
