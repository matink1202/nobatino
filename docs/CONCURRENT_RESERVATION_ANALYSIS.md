# تحلیل سیستم رزرو‌های همزمان

## 🔴 وضعیت فعلی: **رزرو‌های همزمان پشتیبانی نمی‌شود**

### مشکل اصلی
کد فعلی **شبیه‌سازی فرانت‌اند خالص است** و برای تست رابط کاربری طراحی شده:

```javascript
/**
 * FRONTEND PROTOTYPE RESERVATION SYSTEM
 * ⚠️ IMPORTANT: This is a frontend-only simulation for UI/UX demonstration.
 *
 * LIMITATIONS:
 * - Uses browser localStorage (single device only)
 * - No real multi-user locking or concurrency control ❌
 * - Other browsers/devices cannot see this user's reservations ❌
 * - Relies on client-side timers (not reliable for 10-min holds) ❌
 * - Does NOT prevent double-booking in reality ❌
 */
```

---

## 📊 چه اتفاقی می‌افتد اگر دو نفر همزمان رزرو کنند؟

### سناریو مشکلی:
```
زمان: 10:00 صبح
پزشک: دکتر احمد
زمان‌شکاف: 09:30-10:00

👤 کاربر A (مرورگر 1) ➜ نوبت را انتخاب می‌کند
👤 کاربر B (مرورگر 2) ➜ نوبت را انتخاب می‌کند

🚨 نتیجه:
  ✅ هر دو می‌توانند نوبت را ببینند ("موجود")
  ✅ هر دو می‌توانند آن را رزرو کنند
  ✅ localStorage A فقط A را ذخیره می‌کند
  ✅ localStorage B فقط B را ذخیره می‌کند
  ❌ هر دو فکر می‌کنند نوبت‌شان تایید شده است!
  ❌ دو نفر برای یک نوبت پرداخت می‌کنند
  ❌ تعارض اصلی!
```

---

## ✅ راه‌حل: سیستم رزرو‌های سمت سرور

### 1️⃣ **معماری پیشنهادی**

```
frontend (P02-doctor-details.html)
         ↓
    API Endpoints
         ↓
Backend Server
         ↓
   Database
  (with locking)
```

### 2️⃣ **API Endpoints مورد نیاز**

#### **الف) رزرو موقتی**
```http
POST /api/reservations/hold
Content-Type: application/json

{
  "doctorId": "doctor-001",
  "appointmentDate": "1403-10-15",
  "startTime": "09:30",
  "endTime": "10:00",
  "patientId": "user-123",
  "consultationFee": 250000
}

Response:
{
  "success": true,
  "reservation": {
    "id": "RES-001",
    "status": "HELD",
    "expiresAt": "2024-01-22T10:10:00Z",
    "createdAt": "2024-01-22T10:00:00Z"
  }
}
```

#### **ب) بررسی تعارض**
```http
GET /api/doctors/doctor-001/slots/available
?date=1403-10-15
&time=09:30

Response:
{
  "isAvailable": true,
  "lastCheckedAt": "2024-01-22T10:00:00Z",
  "heldBy": null
}
```

#### **ج) تایید پرداخت**
```http
POST /api/reservations/RES-001/confirm-payment
Content-Type: application/json

{
  "transactionId": "TXN-123456",
  "paymentProvider": "zarinpal",
  "amount": 250000
}

Response:
{
  "success": true,
  "status": "CONFIRMED",
  "confirmationNumber": "CNF-001"
}
```

---

## 🔐 استراتژی قفل‌گذاری (Locking Strategies)

### **گزینه 1: Pessimistic Locking** (محافظه‌کارانه)
```sql
BEGIN TRANSACTION;

-- قفل اختصاصی روی سطر
SELECT * FROM appointment_slots 
WHERE doctor_id = 'doctor-001' 
  AND appointment_date = '1403-10-15'
  AND start_time = '09:30'
FOR UPDATE;  -- ← اینجا قفل می‌شود

-- اگر موجود نیست:
IF slot.is_available = true THEN
  UPDATE appointment_slots SET
    is_available = false,
    held_by_user = 'user-123',
    held_until = NOW() + INTERVAL 10 MINUTE
  WHERE slot_id = 123;
ELSE
  ROLLBACK; -- ❌ شکست، زمان‌شکاف اشغال است
END IF;

COMMIT;
```

**مزایا:**
- ✅ تضمین می‌کند فقط یک نفر نوبت را رزرو کند
- ✅ کاملاً محفوظ

**معایب:**
- ❌ اگر کاربر A از مرحله‌ای خارج شود، قفل باقی می‌ماند

---

### **گزینه 2: Optimistic Locking** (خوش‌بینانه)
```sql
-- جدول appointment_slots:
CREATE TABLE appointment_slots (
  id INT PRIMARY KEY,
  doctor_id VARCHAR(50),
  appointment_date DATE,
  start_time TIME,
  reserved_by_user_id VARCHAR(100),
  version INT DEFAULT 0,
  reserved_at TIMESTAMP,
  UNIQUE(doctor_id, appointment_date, start_time)
);

-- هنگام رزرو:
INSERT INTO appointment_slots (doctor_id, appointment_date, start_time, reserved_by_user_id, version)
VALUES ('doctor-001', '1403-10-15', '09:30', 'user-123', 1)
ON DUPLICATE KEY UPDATE
  error = 'SLOT_ALREADY_RESERVED';

-- اگر DUPLICATE KEY حادث شود = ❌ تعارض!
-- اگر موفق = ✅ رزرو تایید شد!
```

**مزایا:**
- ✅ نیاز به lock ندارد
- ✅ بیشتر throughput

**معایب:**
- ❌ اگر هم‌زمان دو درخواست برسند، یکی شکست می‌خورد

---

## 📂 جایی که باید اضافه کنید

### **1. سرورها برای Express/Node:**

```javascript
// routes/reservations.js
const express = require('express');
const router = express.Router();

/**
 * POST /api/reservations/hold
 * Step 1: موقتی رزرو کن
 */
router.post('/hold', async (req, res) => {
  const { doctorId, appointmentDate, startTime, patientId, consultationFee } = req.body;
  
  try {
    // بررسی تعارض
    const existing = await db.query(
      `SELECT id FROM reservations 
       WHERE doctor_id = ? AND appointment_date = ? AND start_time = ? 
       AND status IN ('HELD', 'CONFIRMED')`
      [doctorId, appointmentDate, startTime]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'CONFLICT',
        message: 'این نوبت توسط کاربر دیگری انتخاب شده است'
      });
    }
    
    // ایجاد رزرو موقتی
    const reservation = {
      id: generateId(),
      doctorId,
      appointmentDate,
      startTime,
      patientId,
      consultationFee,
      status: 'HELD',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 دقیقه
      createdAt: new Date()
    };
    
    await db.reservations.insert(reservation);
    
    res.json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reservations/:id/confirm-payment
 * Step 2: پرداخت تایید شد
 */
router.post('/:id/confirm-payment', async (req, res) => {
  const { id } = req.params;
  const { transactionId } = req.body;
  
  const reservation = await db.query(
    'SELECT * FROM reservations WHERE id = ?',
    [id]
  );
  
  if (!reservation) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  }
  
  if (new Date() > new Date(reservation.expiresAt)) {
    return res.status(410).json({ 
      success: false, 
      error: 'EXPIRED',
      message: 'مهلت نگهداری اتمام یافت'
    });
  }
  
  // بروزرسانی وضعیت
  await db.query(
    'UPDATE reservations SET status = ?, transaction_id = ?, confirmed_at = NOW() WHERE id = ?',
    ['CONFIRMED', transactionId, id]
  );
  
  res.json({ success: true, status: 'CONFIRMED' });
});

module.exports = router;
```

---

### **2. فرانت‌اند (جدید در P02)**

```javascript
// هنگام انتخاب نوبت:
async function selectTime(time) {
  selectedTime = time;
  
  // ✅ نیاز به تماس سرور
  const response = await fetch('/api/reservations/check-availability', {
    method: 'POST',
    body: JSON.stringify({
      doctorId: currentDoctorId,
      appointmentDate: selectedDate,
      startTime: time
    })
  });
  
  const { available } = await response.json();
  
  if (!available) {
    showError('متأسفانه این نوبت اشغال شده است');
    return;
  }
  
  updateUI();
}

// هنگام رزرو:
async function createReservation() {
  // ✅ تماس سرور برای رزرو موقتی
  const holdResponse = await fetch('/api/reservations/hold', {
    method: 'POST',
    body: JSON.stringify({
      doctorId: currentDoctorId,
      appointmentDate: selectedDate,
      startTime: selectedTime,
      patientId: getCurrentUserId(), // ✅ نیاز به احراز هویت
      consultationFee: currentDoctor.consultationFeeNumeric
    })
  });
  
  const { success, reservation, error } = await holdResponse.json();
  
  if (!success) {
    if (error === 'CONFLICT') {
      showError('یک کاربر دیگر این نوبت را انتخاب کرده است!');
      // بازخوانی دوباره موجودیت
      await showTimeSlots(selectedDate);
    }
    return;
  }
  
  currentReservation = reservation;
  showPaymentUI();
  startCountdown();
}

// هنگام پرداخت:
async function confirmPayment(transactionId) {
  const response = await fetch(`/api/reservations/${currentReservation.id}/confirm-payment`, {
    method: 'POST',
    body: JSON.stringify({ transactionId })
  });
  
  const { success } = await response.json();
  
  if (success) {
    showSuccess('رزرو‌تان تایید شد!');
    // بازگرداندن به صفحه تأیید
    window.location.href = '/confirmation?id=' + currentReservation.id;
  }
}
```

---

## 🗄️ جدول Database

```sql
CREATE TABLE reservations (
  id VARCHAR(50) PRIMARY KEY,
  doctor_id VARCHAR(50) NOT NULL,
  patient_id VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  status ENUM('HELD', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'PAYMENT_FAILED') DEFAULT 'HELD',
  consultation_fee INT NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  transaction_id VARCHAR(100),
  payment_provider VARCHAR(50),
  
  UNIQUE KEY unique_slot (doctor_id, appointment_date, start_time),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (patient_id) REFERENCES users(id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_doctor_date (doctor_id, appointment_date),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
);

-- Clean up منقضی‌شده‌ها (هر 5 دقیقه):
CREATE EVENT cleanup_expired_reservations
ON SCHEDULE EVERY 5 MINUTE
DO
  UPDATE reservations 
  SET status = 'EXPIRED' 
  WHERE status = 'HELD' AND expires_at < NOW();
```

---

## 🔄 جریان کامل

```
START
  ↓
[1] کاربر نوبت را انتخاب می‌کند
  ↓
[2] صبر کنید... ✋ بررسی سرور: "آیا نوبت موجود است؟"
  ↓
  ├─ YES → [3] نوبت موقتی رزرو کنید (10 دقیقه صبر)
  │         ↓
  │       [4] نمایش رابط پرداخت
  │         ↓
  │       [5] کاربر پرداخت می‌کند
  │         ↓
  │       [6] بررسی سرور: تایید پرداخت
  │         ↓
  │         ├─ CONFIRMED → ✅ DONE
  │         └─ FAILED → تکرار [4]
  │
  └─ NO  → ❌ نوبت اشغال است (کاربر دیگر رزرو کرد)
           → لیست به‌روز شود
           → سفارش دوباره
```

---

## 📋 خلاصه تغییرات مورد نیاز

| بخش | فعلی | نیازمند تغییر | اولویت |
|-----|------|---------------|-------|
| **Frontend** | شبیه‌سازی localStorage | API calls | 🔴 بالا |
| **Backend** | ❌ وجود ندارد | Node/Express + DB | 🔴 بالا |
| **Database** | ❌ وجود ندارد | MySQL/PostgreSQL | 🔴 بالا |
| **Authentication** | ❌ وجود ندارد | JWT/Sessions | 🔴 بالا |
| **Payment Gateway** | ❌ شبیه‌سازی | Webhook integration | 🟡 متوسط |

---

## 🎯 نتیجه‌گیری

**سوال:** "اگر دو نفر همزمان رزرو کنند چه می‌شود؟"

**پاسخ:** 
- ❌ با کد فعلی: **هر دو می‌توانند رزرو کنند** (تعارض!)
- ✅ با سیستم سرور: **فقط یکی موفق است** (محفوظ)

**برای اجرا:**
1. Backend API ایجاد کنید
2. Database schema تعریف کنید
3. P02-doctor-details.html را برای API calls آپدیت کنید
4. تست همزمان (concurrent testing) انجام دهید

