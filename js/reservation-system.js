/**
 * FRONTEND PROTOTYPE RESERVATION SYSTEM
 * ⚠️ IMPORTANT: This is a frontend-only simulation for UI/UX demonstration.
 *
 * LIMITATIONS:
 * - Uses browser localStorage (single device only)
 * - No real multi-user locking or concurrency control
 * - Other browsers/devices cannot see this user's reservations
 * - Relies on client-side timers (not reliable for 10-min holds)
 * - Does NOT prevent double-booking in reality
 *
 * PRODUCTION REQUIREMENTS:
 * - Server-side database transactions with row-level locking
 * - Unique constraints on (doctor_id, appointment_date, start_time)
 * - Server-managed expiration (not browser timers)
 * - Webhook-based payment confirmation
 * - API endpoints defined below (marked as TODO)
 */

const ReservationSystem = {

	/**
	 * STORAGE KEY for simulated reservations
	 * In production, this data lives on the backend only
	 */
	STORAGE_KEY: 'nobatino_reservations_prototype',

	/**
	 * Reservation states for the prototype
	 * Production: Use database enum instead
	 */
	STATES: {
		TEMPORARY_HOLD: 'HELD',       // Client selected, hold granted (green, 10-min countdown)
		EXPIRED: 'EXPIRED',            // 10 minutes passed, hold released
		CANCELLED: 'CANCELLED',        // User cancelled
		AWAITING_PAYMENT: 'AWAITING_PAYMENT',  // Waiting for payment confirmation
		CONFIRMED: 'CONFIRMED',        // Payment verified, appointment booked
		PAYMENT_FAILED: 'PAYMENT_FAILED'       // Payment unsuccessful
	},

	/**
	 * Initialize reservations storage
	 */
	init() {
		const existing = localStorage.getItem(this.STORAGE_KEY);
		if (!existing) {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify({}));
		}
	},

	/**
	 * PROTOTYPE: Create a temporary hold reservation
	 *
	 * Client-side simulation only. In production, POST to:
	 * POST /api/reservations
	 * {
	 *   doctorId: string,
	 *   patientId: string,
	 *   appointmentDate: "YYYY-MM-DD",
	 *   startTime: "HH:MM",
	 *   endTime: "HH:MM",
	 *   consultationFee: number
	 * }
	 * Returns: { reservationId, expiresAt, status }
	 *
	 * @param {string} doctorId
	 * @param {string} appointmentDate - YYYY-MM-DD
	 * @param {string} startTime - HH:MM
	 * @param {string} endTime - HH:MM
	 * @param {number} consultationFee
	 * @returns {Object} Reservation object
	 */
	createTemporaryHold(doctorId, appointmentDate, startTime, endTime, consultationFee) {
		// Check for conflicts first
		const conflict = this.checkConflict(doctorId, appointmentDate, startTime);
		if (conflict) {
			return {
				success: false,
				error: 'CONFLICT',
				message: 'این زمان توسط کاربر دیگری انتخاب شده است. لطفاً زمان دیگری را انتخاب کنید.',
				conflictingReservation: conflict
			};
		}

		const now = new Date();
		const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

		const reservation = {
			id: this.generateReservationId(),
			doctorId: doctorId,
			appointmentDate: appointmentDate,
			startTime: startTime,
			endTime: endTime,
			consultationFee: consultationFee,
			status: this.STATES.TEMPORARY_HOLD,
			createdAt: now.toISOString(),
			expiresAt: expiresAt.toISOString(),
			remainingSeconds: 600, // 10 minutes = 600 seconds
			paymentStatus: null
		};

		// Store in localStorage (prototype only)
		this.saveReservation(reservation);

		// Start countdown timer
		this.startCountdownTimer(reservation.id);

		return {
			success: true,
			reservation: reservation
		};
	},

	/**
	 * Check if a slot is already held or booked
	 * @param {string} doctorId
	 * @param {string} appointmentDate - YYYY-MM-DD
	 * @param {string} startTime - HH:MM
	 * @returns {Object|null} Conflicting reservation or null
	 */
	checkConflict(doctorId, appointmentDate, startTime) {
		const reservations = this.getAllReservations();

		for (const resId in reservations) {
			const res = reservations[resId];

			// Check if same doctor, date, time
			if (res.doctorId === doctorId &&
				res.appointmentDate === appointmentDate &&
				res.startTime === startTime) {

				if (this.blocksSlot(res)) return res;
			}
		}

		return null;
	},

	blocksSlot(reservation, now = Date.now()) {
		if (reservation.status === this.STATES.CONFIRMED) return true;
		if (reservation.status !== this.STATES.TEMPORARY_HOLD &&
			reservation.status !== this.STATES.AWAITING_PAYMENT) return false;

		const expiresAt = Date.parse(reservation.expiresAt);
		return !Number.isFinite(expiresAt) || expiresAt > now;
	},

	/**
	 * PROTOTYPE: Check expiration and clean up
	 * In production: Server handles this via scheduled jobs + lazy checks
	 *
	 * PUT /api/reservations/:reservationId/check-expiration
	 * Returns: { status, remainingSeconds }
	 */
	checkExpiration(reservationId) {
		const reservation = this.getReservation(reservationId);
		if (!reservation) return null;

		const now = new Date();
		const expiresAt = new Date(reservation.expiresAt);
		const remainingMs = expiresAt.getTime() - now.getTime();

		if (remainingMs <= 0) {
			// Expired - release the hold
			reservation.status = this.STATES.EXPIRED;
			this.saveReservation(reservation);
			return {
				expired: true,
				status: this.STATES.EXPIRED
			};
		}

		// Still valid
		const remainingSeconds = Math.ceil(remainingMs / 1000);
		return {
			expired: false,
			status: reservation.status,
			remainingSeconds: remainingSeconds
		};
	},

	/**
	 * PROTOTYPE: Initiate payment
	 * In production: POST /api/reservations/:reservationId/payment/init
	 *
	 * This transitions from TEMPORARY_HOLD to AWAITING_PAYMENT
	 * Actual payment processing happens in a separate payment module
	 */
	initiatePayment(reservationId) {
		const reservation = this.getReservation(reservationId);
		if (!reservation) {
			return { success: false, error: 'Reservation not found' };
		}

		// Verify still in hold period
		const expireCheck = this.checkExpiration(reservationId);
		if (expireCheck.expired) {
			return {
				success: false,
				error: 'EXPIRED',
				message: 'مهلت نگهداری اتمام یافت. لطفاً دوباره سعی کنید.'
			};
		}

		// Update status
		reservation.status = this.STATES.AWAITING_PAYMENT;
		this.saveReservation(reservation);

		return {
			success: true,
			reservation: reservation
		};
	},

	/**
	 * PROTOTYPE: Mark payment as confirmed (would come from webhook in production)
	 * In production: This comes via webhook from payment provider
	 *
	 * POST /api/reservations/:reservationId/payment/confirm
	 * Headers: X-Payment-Verification: webhook-signature
	 * Body: { transactionId, provider, amount, timestamp }
	 *
	 * This transitions AWAITING_PAYMENT to CONFIRMED
	 */
	confirmPayment(reservationId, transactionId) {
		const reservation = this.getReservation(reservationId);
		if (!reservation) {
			return { success: false, error: 'Reservation not found' };
		}

		// Verify still in hold period
		const expireCheck = this.checkExpiration(reservationId);
		if (expireCheck.expired) {
			return {
				success: false,
				error: 'EXPIRED',
				message: 'مهلت پرداخت اتمام یافت. رزرو لغو شده است.'
			};
		}

		// Update status and payment
		reservation.status = this.STATES.CONFIRMED;
		reservation.paymentStatus = 'PAID';
		reservation.transactionId = transactionId;
		reservation.paidAt = new Date().toISOString();
		this.saveReservation(reservation);

		return {
			success: true,
			reservation: reservation
		};
	},

	/**
	 * PROTOTYPE: Handle payment failure
	 * In production: Triggered by payment webhook
	 *
	 * POST /api/reservations/:reservationId/payment/fail
	 * Body: { failureReason, errorCode }
	 *
	 * This expires the hold and releases the slot
	 */
	failPayment(reservationId, failureReason) {
		const reservation = this.getReservation(reservationId);
		if (!reservation) {
			return { success: false, error: 'Reservation not found' };
		}

		// Mark as payment failed
		reservation.status = this.STATES.PAYMENT_FAILED;
		reservation.paymentStatus = 'FAILED';
		reservation.failureReason = failureReason;
		this.saveReservation(reservation);

		return {
			success: true,
			reservation: reservation
		};
	},

	/**
	 * PROTOTYPE: Cancel a reservation
	 * In production: DELETE /api/reservations/:reservationId
	 */
	cancel(reservationId) {
		const reservation = this.getReservation(reservationId);
		if (!reservation) {
			return { success: false, error: 'Reservation not found' };
		}

		reservation.status = this.STATES.CANCELLED;
		reservation.cancelledAt = new Date().toISOString();
		this.saveReservation(reservation);

		return {
			success: true,
			reservation: reservation
		};
	},

	/**
	 * Get a single reservation
	 */
	getReservation(reservationId) {
		const reservations = this.getAllReservations();
		return reservations[reservationId] || null;
	},

	/**
	 * Get all reservations (prototype only)
	 * In production: GET /api/reservations (with pagination)
	 */
	getAllReservations() {
		const data = localStorage.getItem(this.STORAGE_KEY);
		return data ? JSON.parse(data) : {};
	},

	/**
	 * Get user's active reservations
	 * In production: GET /api/users/:userId/reservations?status=active
	 */
	getActiveReservations() {
		const all = this.getAllReservations();
		const active = {};

		for (const id in all) {
			const res = all[id];
			if (res.status === this.STATES.TEMPORARY_HOLD ||
				res.status === this.STATES.AWAITING_PAYMENT ||
				res.status === this.STATES.CONFIRMED) {
				active[id] = res;
			}
		}

		return active;
	},

	/**
	 * Get reservations for a specific doctor on a specific date
	 * In production: GET /api/doctors/:doctorId/reservations?date=YYYY-MM-DD
	 */
	getReservationsForSlot(doctorId, appointmentDate) {
		const all = this.getAllReservations();
		const matching = [];

		for (const id in all) {
			const res = all[id];
			if (res.doctorId === doctorId && res.appointmentDate === appointmentDate) {
				matching.push(res);
			}
		}

		return matching;
	},

	/**
	 * Save a reservation to localStorage
	 */
	saveReservation(reservation) {
		const all = this.getAllReservations();
		all[reservation.id] = reservation;
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
	},

	/**
	 * Generate unique reservation ID
	 */
	generateReservationId() {
		return 'RES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
	},

	/**
	 * Start countdown timer for a reservation
	 * Updates the UI and expires the reservation when time is up
	 */
	startCountdownTimer(reservationId) {
		const reservation = this.getReservation(reservationId);
		if (!reservation) return;

		const countdownInterval = setInterval(() => {
			const expireCheck = this.checkExpiration(reservationId);

			if (!expireCheck) {
				clearInterval(countdownInterval);
				return;
			}

			if (expireCheck.expired) {
				clearInterval(countdownInterval);
				// Dispatch custom event for UI update
				window.dispatchEvent(new CustomEvent('reservation-expired', {
					detail: { reservationId }
				}));
				return;
			}

			// Update remaining seconds and dispatch event for UI
			const updated = this.getReservation(reservationId);
			if (updated) {
				updated.remainingSeconds = expireCheck.remainingSeconds;
				window.dispatchEvent(new CustomEvent('reservation-countdown', {
					detail: { reservationId, remainingSeconds: expireCheck.remainingSeconds }
				}));
			}
		}, 1000); // Update every second
	},

	/**
	 * Format remaining time as MM:SS
	 */
	formatRemainingTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
};

// Initialize on script load
ReservationSystem.init();

// Export for use in HTML files
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { ReservationSystem };
}
