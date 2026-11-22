/**
 * Appointment Availability System
 *
 * Defines working schedules, breaks, holidays, and appointment durations.
 * Designed to be replaceable with backend API responses.
 *
 * API Contract:
 * GET /api/doctors/:doctorId/availability
 * GET /api/doctors/:doctorId/availability?date=YYYY-MM-DD
 * Returns: { schedule, breaks, holidays, appointmentDuration, timezone }
 */

const appointmentAvailability = {
	'doctor-001': {
		// Dr. Ahmad Alipour - Cardiologist
		appointmentDuration: 30, // minutes
		timezone: 'Asia/Tehran',

		// Weekly schedule: day -> { startTime, endTime, available }
		weeklySchedule: {
			'saturday': { startTime: '09:00', endTime: '17:00', available: true },
			'sunday': { startTime: '09:00', endTime: '17:00', available: true },
			'monday': { startTime: '09:00', endTime: '17:00', available: true },
			'tuesday': { startTime: '10:00', endTime: '18:00', available: true },
			'wednesday': { startTime: '10:00', endTime: '18:00', available: true },
			'thursday': { startTime: '09:00', endTime: '17:00', available: true },
			'friday': { startTime: null, endTime: null, available: false } // Closed on Friday
		},

		// Daily breaks (recurs every day)
		dailyBreaks: [
			{ startTime: '12:00', endTime: '13:00' }, // Lunch break
			{ startTime: '15:00', endTime: '15:30' }   // Afternoon break
		],

		// Holiday exceptions (dates when clinic is closed)
		holidays: [
			'1403-01-01', // Persian New Year (sample)
			'1403-02-11', // Sample holiday
		],

		// Manually blocked slots (unavailable due to vacation, meetings, etc.)
		blockedSlots: [
			'1403-10-01T14:00:00', // Sample blocked time
		],

		// Special working hours (overrides weekly schedule for specific dates)
		specialDates: {
			'1403-10-05': { startTime: '10:00', endTime: '14:00', available: true }, // Shorter day
		}
	},

	'doctor-002': {
		// Dr. Maryam Mohammadi - Neurologist
		appointmentDuration: 45, // minutes (longer for neuro exams)
		timezone: 'Asia/Tehran',

		weeklySchedule: {
			'saturday': { startTime: '08:00', endTime: '16:00', available: true },
			'sunday': { startTime: '08:00', endTime: '16:00', available: true },
			'monday': { startTime: '08:00', endTime: '16:00', available: true },
			'tuesday': { startTime: '09:00', endTime: '17:00', available: true },
			'wednesday': { startTime: '09:00', endTime: '17:00', available: true },
			'thursday': { startTime: '08:00', endTime: '16:00', available: true },
			'friday': { startTime: null, endTime: null, available: false }
		},

		dailyBreaks: [
			{ startTime: '12:30', endTime: '13:30' },
			{ startTime: '14:00', endTime: '14:15' }
		],

		holidays: [
			'1403-01-01',
			'1403-02-11'
		],

		blockedSlots: [],

		specialDates: {}
	},

	'doctor-003': {
		// Dr. Ali Rahimi - Orthopedist
		appointmentDuration: 20, // minutes (quick consultations)
		timezone: 'Asia/Tehran',

		weeklySchedule: {
			'saturday': { startTime: '09:00', endTime: '17:00', available: true },
			'sunday': { startTime: '10:00', endTime: '18:00', available: true },
			'monday': { startTime: '09:00', endTime: '17:00', available: true },
			'tuesday': { startTime: '09:00', endTime: '17:00', available: true },
			'wednesday': { startTime: '10:00', endTime: '18:00', available: true },
			'thursday': { startTime: '09:00', endTime: '17:00', available: true },
			'friday': { startTime: null, endTime: null, available: false }
		},

		dailyBreaks: [
			{ startTime: '13:00', endTime: '14:00' },
			{ startTime: '15:30', endTime: '15:45' }
		],

		holidays: [
			'1403-01-01',
		],

		blockedSlots: [
			'1403-10-05T10:00:00', // In surgery
		],

		specialDates: {}
	},

	'doctor-004': {
		// Dr. Sara Karimi - Dermatologist
		appointmentDuration: 25, // minutes
		timezone: 'Asia/Tehran',

		weeklySchedule: {
			'saturday': { startTime: '10:00', endTime: '18:00', available: true },
			'sunday': { startTime: '10:00', endTime: '18:00', available: true },
			'monday': { startTime: '10:00', endTime: '18:00', available: true },
			'tuesday': { startTime: '10:00', endTime: '18:00', available: true },
			'wednesday': { startTime: '10:00', endTime: '18:00', available: true },
			'thursday': { startTime: '10:00', endTime: '18:00', available: true },
			'friday': { startTime: null, endTime: null, available: false }
		},

		dailyBreaks: [
			{ startTime: '13:00', endTime: '14:00' },
			{ startTime: '16:00', endTime: '16:15' }
		],

		holidays: [
			'1403-01-01',
			'1403-02-11'
		],

		blockedSlots: [],

		specialDates: {}
	}
};

/**
 * Generate available time slots for a doctor on a specific date
 *
 * @param {string} doctorId - Doctor ID
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Array} Array of available time slots
 *
 * API Equivalent: GET /api/doctors/:doctorId/slots?date=YYYY-MM-DD
 */
function getAvailableSlots(doctorId, dateStr) {
	const availability = appointmentAvailability[doctorId];
	if (!availability) return [];

	const date = new Date(dateStr + 'T00:00:00');
	const dayOfWeek = getDayOfWeek(date);

	// Check if holiday
	if (availability.holidays.includes(dateStr)) {
		return [];
	}

	// Get schedule for this day
	const daySchedule = availability.specialDates[dateStr] || availability.weeklySchedule[dayOfWeek];

	if (!daySchedule || !daySchedule.available || !daySchedule.startTime || !daySchedule.endTime) {
		return [];
	}

	// Generate time slots
	const slots = [];
	const startTime = parseTime(daySchedule.startTime);
	const endTime = parseTime(daySchedule.endTime);
	const duration = availability.appointmentDuration;

	let currentTime = new Date(startTime);

	while (currentTime.getTime() + (duration * 60 * 1000) <= endTime.getTime()) {
		const slotStart = timeToString(currentTime);
		const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
		const slotEndStr = timeToString(slotEnd);
		const slotDateTime = `${dateStr}T${slotStart}:00`;

		// Check if slot is in a break
		const isInBreak = availability.dailyBreaks.some(breakPeriod => {
			const breakStart = parseTime(breakPeriod.startTime);
			const breakEnd = parseTime(breakPeriod.endTime);
			return currentTime.getTime() < breakEnd.getTime() &&
				   slotEnd.getTime() > breakStart.getTime();
		});

		// Check if slot is blocked
		const isBlocked = availability.blockedSlots.includes(slotDateTime);

		if (!isInBreak && !isBlocked) {
			slots.push({
				time: slotStart,
				displayTime: convertTo12Hour(slotStart),
				startDateTime: slotDateTime,
				endDateTime: `${dateStr}T${slotEndStr}:00`,
				status: 'available' // Will be updated based on reservations
			});
		}

		currentTime = new Date(currentTime.getTime() + duration * 60 * 1000);
	}

	return slots;
}

/**
 * Get available dates for the next N days
 * @param {string} doctorId - Doctor ID
 * @param {number} days - Number of days to check (default: 30)
 * @returns {Array} Array of available dates
 */
function getAvailableDates(doctorId, days = 30) {
	const dates = [];
	const today = new Date();

	for (let i = 1; i <= days; i++) {
		const checkDate = new Date(today);
		checkDate.setDate(checkDate.getDate() + i);

		const dateStr = dateToString(checkDate);
		const slots = getAvailableSlots(doctorId, dateStr);

		if (slots.length > 0) {
			dates.push({
				date: dateStr,
				displayDate: formatPersianDate(checkDate),
				dayOfWeek: getDayOfWeek(checkDate),
				slotCount: slots.length
			});
		}
	}

	return dates;
}

/**
 * Helper: Convert date object to YYYY-MM-DD string
 */
function dateToString(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Helper: Convert time string HH:MM to Date object (today's date)
 */
function parseTime(timeStr) {
	const [hours, minutes] = timeStr.split(':').map(Number);
	const date = new Date();
	date.setHours(hours, minutes, 0, 0);
	return date;
}

/**
 * Helper: Convert Date object to HH:MM string
 */
function timeToString(date) {
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

/**
 * Helper: Get day of week (English names)
 */
function getDayOfWeek(date) {
	const days = ['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
	return days[date.getDay()];
}

/**
 * Helper: Format date in Persian
 */
function formatPersianDate(date) {
	const options = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		weekday: 'long'
	};
	return new Intl.DateTimeFormat('fa-IR', options).format(date);
}

/**
 * Helper: Convert to 24-hour format (Persian numerals)
 */
function convertTo12Hour(timeStr) {
	const [hours, minutes] = timeStr.split(':').map(Number);

	// Convert to Persian numerals (keep 24-hour format)
	const persianHours = toPersianNumbers(String(hours).padStart(2, '0'));
	const persianMinutes = toPersianNumbers(String(minutes).padStart(2, '0'));

	return `${persianHours}:${persianMinutes}`;
}

/**
 * Helper: Convert English numbers to Persian numerals
 */
function toPersianNumbers(str) {
	const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	return str.replace(/\d/g, d => persian[d]);
}

// Export for use in HTML files
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		appointmentAvailability,
		getAvailableSlots,
		getAvailableDates
	};
}
