/**
 * Centralized Doctor Data
 * This data structure is designed to be easily replaceable with API responses.
 * To migrate to backend: Replace this object with fetch() calls to your API.
 * API Contract: GET /api/doctors/:doctorId → returns object matching this structure
 */

const doctorsDatabase = {
	'doctor-001': {
		id: 'doctor-001',
		name: 'دکتر احمد علی‌پور',
		englishName: 'Dr. Ahmad Alipour',
		specialty: 'متخصص قلب و عروق',
		degree: 'بورد تخصصی قلب و عروق - بیمارستان تهران',
		medicalCouncilNumber: '۱۲۳۴۵۶', // Sample number only
		phone: '۰۲۱-۱۱۱۲۲۲۲۲',
		clinicAddress: 'تهران، خیابان ولی‌عصر، نزدیک میدان ونک، کلینیک قلب و عروق',
		city: 'تهران',
		province: 'تهران',
		photo: 'male1.png',
		bio: 'دکتر احمد علی‌پور دارای بیش از ۱۵ سال تجربه در زمینهٔ بیماری‌های قلب و عروق است. ایشان از جمله متخصصان برتر این حوزه در کشور به شمار می‌آید و تاکنون بیش از ۵۰۰۰ بیمار را مورد درمان قرار داده است.',
		education: [
			'دکتری پزشکی (M.D) - دانشگاه علوم پزشکی تهران',
			'بورد تخصصی بیماری‌های قلب و عروق - ۱۳۹۲',
			'فلوشیپ قلب‌تهوزی - بیمارستان امام خمینی تهران'
		],
		experience: [
			'متخصص قلب و عروق - بیمارستان تهران (۱۳۹۲-۱۴۰۲)',
			'سرپزشک قسم قلب و عروق - کلینیک خصوصی (۱۳۹۴-۱۴۰۲)',
			'عضو انجمن متخصصین قلب و عروق ایران',
			'استادیار دانشگاه علوم پزشکی تهران'
		],
		services: [
			'مشاوره و تشخیص بیماری‌های قلب',
			'تست تاپی و نوار قلب',
			'اکوکاردیوگرافی',
			'درمان فشار خون',
			'درمان اختلال ریتم قلب'
		],
		consultationFee: '۲۵۰۰۰۰ تومان',
		consultationFeeNumeric: 250000,
		rating: 4.9,
		reviewCount: 128,
		reviewsData: [
			{
				author: 'علی محمدی',
				rating: 5,
				date: '۱۴۰۲/۰۸/۱۵',
				text: 'بسیار راضی از مشاورهٔ دکتر علی‌پور بودم. بسیار حرفه‌ای و مودب. سفارش می‌دهم.'
			},
			{
				author: 'فاطمه احمدی',
				rating: 5,
				date: '۱۴۰۲/۰۸/۱۰',
				text: 'مشاورهٔ عالی و توضیحات جامع. خیلی خوب بود.'
			},
			{
				author: 'محمود رضائی',
				rating: 5,
				date: '۱۴۰۲/۰۷/۲۸',
				text: 'تجربهٔ بسیار خوب. دکتر بسیار دقیق و مهربان هستند.'
			}
		]
	},

	'doctor-002': {
		id: 'doctor-002',
		name: 'دکتر مریم محمدی',
		englishName: 'Dr. Maryam Mohammadi',
		specialty: 'متخصص مغز و اعصاب',
		degree: 'بورد تخصصی نورولوژی - دانشگاه شهید بهشتی',
		medicalCouncilNumber: '۲۳۴۵۶۷', // Sample number only
		phone: '۰۲۱-۲۲۲۳۳۳۳۳',
		clinicAddress: 'تهران، خیابان کشاورز، نزدیک خیابان فردوسی، کلینیک نورولوژی و مغز',
		city: 'تهران',
		province: 'تهران',
		photo: 'female1.png',
		bio: 'دکتر مریم محمدی بر مبنای تحصیلات تکمیلی خود در دانشگاه شهید بهشتی و تجربهٔ ۱۲ ساله در زمینهٔ نورولوژی، بیش از ۴۰۰۰ بیمار را درمان کرده است. ایشان همچنین در رشتهٔ تحقیقات و انتشار مقالات علمی فعال هستند.',
		education: [
			'دکتری پزشکی (M.D) - دانشگاه شهید بهشتی',
			'بورد تخصصی نورولوژی - ۱۳۹۳',
			'دوره‌های آموزشی بین‌المللی در نورولوژی'
		],
		experience: [
			'متخصص نورولوژی - بیمارستان شهید بهشتی (۱۳۹۳-۱۴۰۲)',
			'استادیار دانشگاه شهید بهشتی',
			'عضو انجمن متخصصین نورولوژی ایران',
			'محقق فعال در حوزهٔ درمان سکته مغزی'
		],
		services: [
			'تشخیص و درمان بیماری‌های مغز و اعصاب',
			'درمان سردرد و میگرن',
			'درمان بیماری‌های تحلیل‌الی',
			'مشاورهٔ تخصصی برای بیماری‌های عصبی',
			'آزمون‌های تخصصی نورولوژی'
		],
		consultationFee: '۳۰۰۰۰۰ تومان',
		consultationFeeNumeric: 300000,
		rating: 4.8,
		reviewCount: 95,
		reviewsData: [
			{
				author: 'سارا احمدی',
				rating: 5,
				date: '۱۴۰۲/۰۸/۱۲',
				text: 'دکتر محمدی بسیار دلسوز و متخصص هستند. مشاورهٔ بسیار مفید بود.'
			},
			{
				author: 'علی رضا محمودی',
				rating: 4,
				date: '۱۴۰۲/۰۸/۰۵',
				text: 'خیلی خوب بود، کمی انتظار طولانی بود اما سر آن ارزش داشت.'
			}
		]
	},

	'doctor-003': {
		id: 'doctor-003',
		name: 'دکتر علی رحیمی',
		englishName: 'Dr. Ali Rahimi',
		specialty: 'متخصص ارتوپدی',
		degree: 'بورد تخصصی ارتوپدی - دانشگاه تهران',
		medicalCouncilNumber: '۳۴۵۶۷۸', // Sample number only
		phone: '۰۲۱-۳۳۳۴۴۴۴۴',
		clinicAddress: 'تهران، خیابان اسلامی، نزدیک بیمارستان رسالت، کلینیک ارتوپدی',
		city: 'تهران',
		province: 'تهران',
		photo: 'male2.png',
		bio: 'دکتر علی رحیمی با بیش از ۱۸ سال تجربه در جراحی ارتوپدی، یکی از متخصصان برتر این حوزه در کشور است. ایشان تاکنون بیش از ۶۰۰۰ جراحی موفق انجام داده و در مجلات بین‌المللی منتشر کرده است.',
		education: [
			'دکتری پزشکی (M.D) - دانشگاه تهران',
			'بورد تخصصی جراحی ارتوپدی - ۱۳۹۱',
			'فلوشیپ جراحی استخوان و مفاصل - بیمارستان رسالت'
		],
		experience: [
			'جراح ارتوپد - بیمارستان رسالت (۱۳۹۱-۱۴۰۲)',
			'رئیس بخش ارتوپدی - کلینیک خصوصی (۱۳۹۳-۱۴۰۲)',
			'استاد تمام‌وقت دانشگاه تهران',
			'عضو هیئت مدیره انجمن جراحان ارتوپد ایران'
		],
		services: [
			'جراحی استخوان شکسته',
			'جراحی مفاصل و زانو',
			'درمان درون‌پزشکی اختلالات عضلانی اسکلتی',
			'جراحی ستون فقرات',
			'مشاورهٔ تخصصی برای آسیب‌های اسکلتی'
		],
		consultationFee: '۲۵۰۰۰۰ تومان',
		consultationFeeNumeric: 250000,
		rating: 4.9,
		reviewCount: 143,
		reviewsData: [
			{
				author: 'محسن کیانی',
				rating: 5,
				date: '۱۴۰۲/۰۸/۲۰',
				text: 'جراح بسیار ماهر و دقیق. نتیجهٔ جراحی عالی بود.'
			},
			{
				author: 'نسرین فاضلی',
				rating: 5,
				date: '۱۴۰۲/۰۸/۱۸',
				text: 'تجربهٔ خوب، آرام‌بخش و حرفه‌ای. تشکر!'
			},
			{
				author: 'بهروز احمدی',
				rating: 5,
				date: '۱۴۰۲/۰۸/۱۶',
				text: 'بهترین جراح ارتوپد در تهران. بسیار راضی هستم.'
			}
		]
	},

	'doctor-004': {
		id: 'doctor-004',
		name: 'دکتر سارا کریمی',
		englishName: 'Dr. Sara Karimi',
		specialty: 'متخصص پوست',
		degree: 'بورد تخصصی پوست و بیماری‌های جنسی - دانشگاه علوم پزشکی ایران',
		medicalCouncilNumber: '۴۵۶۷۸۹', // Sample number only
		phone: '۰۲۱-۴۴۴۵۵۵۵۵',
		clinicAddress: 'تهران، خیابان ولی‌عصر، نزدیک میدان انقلاب، کلینیک پوست و زیبایی',
		city: 'تهران',
		province: 'تهران',
		photo: 'female2.png',
		bio: 'دکتر سارا کریمی دارای بیش از ۱۰ سال تجربه در تخصص پوست است. ایشان از جمله پیشگامان درمان‌های نوین پوشش‌ای و لیزری در کشور هستند و به طور منظم در کنفرانس‌های بین‌المللی سخنگو هستند.',
		education: [
			'دکتری پزشکی (M.D) - دانشگاه علوم پزشکی ایران',
			'بورد تخصصی پوست و بیماری‌های جنسی - ۱۳۹۴',
			'دوره‌های تخصصی بین‌المللی در درمان‌های لیزری'
		],
		experience: [
			'متخصص پوست - بیمارستان رازی (۱۳۹۴-۱۴۰۲)',
			'مدیر کلینیک پوست و زیبایی (۱۳۹۶-۱۴۰۲)',
			'استادیار دانشگاه علوم پزشکی ایران',
			'عضو هیئت تحریریه مجلهٔ درماتولوژی ایران'
		],
		services: [
			'درمان بیماری‌های عفونی و التهابی پوست',
			'درمان جوش و آکنه',
			'درمان رفت و روغن‌وانی و ریزش مو',
			'درمان‌های لیزری و نور پالس',
			'مشاورهٔ تخصصی زیبایی و پوست'
		],
		consultationFee: '۲۰۰۰۰۰ تومان',
		consultationFeeNumeric: 200000,
		rating: 4.7,
		reviewCount: 87,
		reviewsData: [
			{
				author: 'سارا احمدی',
				rating: 5,
				date: '۱۴۰۲/۰۸/۱۴',
				text: 'دکتر کریمی بسیار حرفه‌ای و دقیق هستند. نتیجهٔ درمان خیلی خوب بود.'
			},
			{
				author: 'لیلا رحمانی',
				rating: 4,
				date: '۱۴۰۲/۰۷/۲۲',
				text: 'خیلی خوب بود. اثربخش و بدون عارضه.'
			}
		]
	}
};

/**
 * Helper function to get doctor by ID
 * API Equivalent: GET /api/doctors/:doctorId
 */
function getDoctorById(doctorId) {
	return doctorsDatabase[doctorId] || null;
}

/**
 * Helper function to get all doctors
 * API Equivalent: GET /api/doctors
 */
function getAllDoctors() {
	return Object.values(doctorsDatabase);
}

/**
 * Helper function to get doctors by specialty
 * API Equivalent: GET /api/doctors?specialty=:specialty
 */
function getDoctorsBySpecialty(specialty) {
	return getAllDoctors().filter(doc => doc.specialty === specialty);
}

// Export for use in HTML files
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { doctorsDatabase, getDoctorById, getAllDoctors, getDoctorsBySpecialty };
}
