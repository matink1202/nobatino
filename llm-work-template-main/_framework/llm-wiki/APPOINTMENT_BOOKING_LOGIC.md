# Appointment Booking Logic

## Overview

The Appointment Booking System defines how patients discover doctor
availability, select appointment dates and times, temporarily reserve
slots, and proceed to payment.

The system must ensure that each appointment slot can only be assigned
to one patient at a time.

**Core Rules:** - Each doctor has an independent appointment schedule. -
Patients can only select available dates and time slots. - Selecting a
slot does not automatically reserve it. - Temporary reservations last
exactly 10 minutes. - Only one patient can hold a specific appointment
slot at a time. - Successful payment converts a temporary reservation
into a confirmed appointment. - Expired or cancelled reservations
release their slots.

## Core Concepts

1.  **Doctor Availability** --- predefined working days, hours,
    appointment durations, breaks, holidays, and unavailable periods.
2.  **Appointment Slot** --- a specific date and time interval belonging
    to a doctor.
3.  **Selected Slot** --- a slot selected by a patient but not yet
    exclusively reserved.
4.  **Temporary Hold** --- an exclusive reservation that prevents other
    patients from selecting the same slot.
5.  **Confirmed Appointment** --- a successfully paid and finalized
    appointment.
6.  **Reservation Expiration** --- automatic release of a temporary hold
    after 10 minutes.
7.  **Reservation Conflict** --- an attempt to reserve a slot that is no
    longer available.

## User Journey

1.  Patient opens a doctor's detail page.
2.  System displays the doctor's profile and appointment calendar.
3.  Today's date is selected by default.
4.  Patient selects an available date.
5.  System displays available time slots for that date.
6.  Patient selects a preferred time slot.
7.  Selected slot changes to Yellow.
8.  Patient clicks the payment button.
9.  System attempts to acquire an exclusive temporary hold.
10. If successful, the slot changes to Green and the 10-minute countdown
    starts.
11. Patient proceeds to the external payment process.
12. Successful payment confirms the appointment.
13. Failed, cancelled, or expired reservations release the slot
    according to the reservation rules.

## Doctor Availability

Each doctor must have an independent availability configuration.

**Availability Properties:** - Doctor ID - Working weekdays - Daily
start and end times - Appointment duration - Break periods - Holidays -
Exceptional working days - Manually blocked dates - Manually blocked
time slots - Consultation fee

**Rules:** - Different doctors can have appointments at the same time. -
A doctor's availability must not affect another doctor's schedule. -
Appointment slots must be generated from the doctor's actual working
schedule. - Break periods must never generate bookable slots. - Past
dates and past time slots must not be selectable. - Holidays and
manually blocked periods must be excluded. - All appointment times must
use the 24-hour format.

## Calendar Logic

The appointment calendar uses the Jalali (Persian) calendar.

**Default Behavior:** - Automatically select the current Jalali date
when the page loads. - Display the current Jalali month and year. -
Display available appointment dates. - Highlight the selected date. -
Disable past dates. - Disable unavailable dates. - Allow navigation
between months.

**Date Selection Rules:** 1. Patient selects a date. 2. The selected
date is highlighted. 3. Available time slots for that date are
displayed. 4. Previous time selections are cleared when switching dates.
5. The appointment summary is updated accordingly.

If today is a Friday, holiday, or a day when the doctor has no
availability: - Keep today's date identifiable. - Display an appropriate
no-availability message. - Do not automatically select another date. -
Allow the patient to manually select another available date.

## Time Slot Logic

Time slots are generated based on the doctor's working schedule and
appointment duration.

**Rules:** - Use a 24-hour clock (00:00--23:59). - Display Persian
numerals consistently in the Persian interface. - Sort slots
chronologically. - Exclude unavailable periods and breaks. - Prevent
selection of past time slots. - Prevent selection of already booked
slots. - Prevent selection of slots held by another patient.

**Example:**

  Time    Status
  ------- ------------------
  09:00   Available
  09:30   Available
  10:00   Booked
  10:30   Available
  11:00   Temporarily Held

## Slot Status System

The interface uses four distinct visual states.

### 1. Gray --- Unavailable / Booked

Color: `#E2E8F0`

Represents: - Confirmed appointments. - Slots temporarily held by
another patient. - Other unavailable slots.

**Behavior:** - Cannot be selected. - Must not allow further reservation
attempts.

### 2. Yellow --- Selected

Color: `#FEF3C7`

Represents: - A time slot selected by the current patient. - No
exclusive reservation has been created yet.

**Behavior:** - Indicates the patient's current selection. - Allows the
patient to continue to the reservation step. - Does not prevent other
patients from selecting the same slot.

### 3. Red --- Reservation Conflict

Color: `#FEE2E2`

Represents: - A reservation attempt rejected because the slot is no
longer available. - A concurrent reservation conflict. - An invalid
reservation selection.

**Behavior:** - Display a clear conflict message. - Prevent continuation
with the conflicting slot. - Allow selection of another available time.

### 4. Green --- Successfully Held

Color: `#DCFCE7`

Represents: - A successfully created temporary reservation. - An
exclusive hold belonging to the current patient.

**Behavior:** - The slot becomes unavailable to other patients. - A
10-minute countdown becomes visible. - The selected appointment details
remain visible. - The patient can proceed to payment.

**Important:** Green must only represent a successfully established
reservation hold. A simple client-side selection must never be displayed
as a successful hold.

## Reservation Lifecycle

The reservation lifecycle consists of the following states:

  State            Description
  ---------------- --------------------------------------------
  AVAILABLE        Slot is available
  SELECTED         Patient has selected the slot
  HELD             Temporary reservation successfully created
  CONFIRMED        Payment successfully verified
  EXPIRED          Temporary reservation expired
  CANCELLED        Patient cancelled the reservation
  PAYMENT_FAILED   Payment failed

**Valid State Transitions:**

1.  AVAILABLE → SELECTED
2.  SELECTED → HELD
3.  HELD → CONFIRMED
4.  HELD → EXPIRED
5.  HELD → CANCELLED
6.  HELD → PAYMENT_FAILED

Expired, cancelled, and failed reservations release their slots.

Confirmed appointments remain unavailable and must never become
available merely because the original temporary hold expiration time has
passed.

## Temporary Reservation --- 10-Minute Hold

A temporary reservation must remain active for exactly 10 minutes.

**Start Condition:**

The countdown starts only after the reservation has been successfully
created.

It must not start: - When the calendar opens. - When a date is
selected. - When a time slot is selected. - When the patient first
clicks an unavailable slot.

**During the Hold:** - The selected slot becomes Green. - Other patients
see the slot as Gray. - The reservation countdown is displayed. - The
selected doctor's information remains visible. - Appointment date and
time remain visible. - Consultation fee remains visible. - Payment
continuation becomes available.

**Expiration Rules:** - The hold expires after 10 minutes. - Expired
holds release their slots. - Released slots become available again. -
The countdown must not remain active after expiration. - An expired
reservation cannot be used to confirm an appointment.

The expiration timestamp is the source of truth. A browser countdown is
only a visual representation of the remaining time.

## Concurrent Reservations

A specific doctor/date/time slot must never have more than one active
reservation hold or confirmed appointment.

**Scenario:** Two patients attempt to reserve the same slot
simultaneously.

  Patient     Action                      Expected Result
  ----------- --------------------------- ------------------------------
  Patient A   Requests reservation        First successful reservation
  Patient B   Requests same reservation   Conflict / Rejected

**Rules:** - The first successfully committed reservation wins. - The
second reservation attempt must be rejected. - A rejected patient must
receive a clear message. - The conflicting slot must appear Gray. - The
rejected selection may briefly display Red as conflict feedback. - No
two patients may successfully acquire the same slot.

The final implementation must enforce this rule independently of browser
state.

LocalStorage, sessionStorage, frontend timers, and disabled buttons are
not sufficient concurrency-control mechanisms.

## Reservation Expiration and Cancellation

### Automatic Expiration

When a temporary reservation reaches its expiration timestamp:

1.  Reservation changes to EXPIRED.
2.  Exclusive hold is released.
3.  Slot becomes available.
4.  Other patients can select the slot.
5.  The previous patient must select an available slot again.

### Manual Cancellation

When a patient cancels a temporary reservation:

1.  Reservation changes to CANCELLED.
2.  Temporary hold is released.
3.  Countdown stops.
4.  Green status is removed.
5.  Slot becomes available again.

### Confirmed Appointment

A confirmed appointment must remain unavailable even after the original
10-minute expiration timestamp.

## Payment Flow

The payment process is handled separately from the appointment selection
interface.

**Booking Page Responsibilities:** - Display doctor information. -
Display consultation fee. - Display appointment date and time. - Allow
date and time selection. - Initiate the reservation process. - Display
reservation status. - Display the temporary reservation countdown. -
Provide the payment handoff point.

**External Payment Responsibilities:** - Receive reservation context. -
Initiate payment. - Communicate with the payment provider. - Verify
payment results. - Return the final payment status.

The booking page must not independently assume that payment has
succeeded.

**Payment Success:** - Verify the payment result. - Change reservation
state from HELD to CONFIRMED. - Keep the appointment unavailable.

**Payment Failure:** - Do not confirm the appointment. - Apply the
expiration and release rules.

**Payment Callback Idempotency:**

Repeated payment callbacks must never create duplicate confirmed
appointments.

**Expiration Boundary:**

If payment begins near the end of the 10-minute hold, the system must
follow an explicitly defined expiration and payment-verification policy.
An expired hold must not be confirmed without a valid reservation
decision.

## Booking Summary

Before continuing to payment, display: - Doctor's full name. - Medical
specialty. - Appointment date. - Appointment time. - Appointment
duration. - Consultation fee. - Reservation status, when applicable.

All information must correspond to the current selection or active
reservation.

The displayed total must match the doctor's configured consultation fee.

## Edge Cases

The following scenarios must be handled explicitly:

1.  Two patients select the same slot simultaneously.
2.  Two patients submit reservation requests simultaneously.
3.  Patient refreshes the page during an active hold.
4.  Patient closes the browser during an active hold.
5.  Patient cancels an active hold.
6.  Reservation expires while payment is pending.
7.  Payment fails.
8.  Payment callback arrives after expiration.
9.  Duplicate payment callbacks are received.
10. Doctor changes availability after a patient selects a slot.
11. Doctor blocks an existing available time slot.
12. Patient selects a past date.
13. Patient selects a past time slot.
14. Doctor has no availability on the selected date.
15. Two different doctors have appointments at the same time.
16. Patient attempts to use an expired reservation.
17. Patient attempts to reserve an already confirmed appointment.

Each case must produce a predictable state transition and appropriate
user feedback.

## UI/UX Requirements

The booking experience must follow Nobatino's existing design system.

**Visual States:**

  State               Background
  ------------------- ------------
  Unavailable         `#E2E8F0`
  Selected            `#FEF3C7`
  Conflict            `#FEE2E2`
  Successfully Held   `#DCFCE7`

**Interface Requirements:** - Jalali calendar. - Automatic selection of
today's date. - 24-hour time display. - Clear available/unavailable slot
distinction. - Visible reservation countdown. - Clear booking summary. -
Responsive desktop and mobile layouts. - RTL layout. - Vazirmatn
typography. - Subtle status colors. - Accessible controls and feedback
messages.

The interface must never misrepresent a selected slot as an exclusively
reserved appointment.

## Frontend Prototype vs Production Behavior

The current Nobatino frontend uses browser-based simulation for
demonstration.

**Current Prototype Limitations:** - LocalStorage is limited to the
current browser/device. - Reservations are not shared between different
browsers. - No real multi-user locking exists. - Client-side timers are
not authoritative. - Double-booking cannot be prevented reliably.

**Production Requirements:** - Centralized reservation state. -
Server-side reservation validation. - Atomic reservation creation. -
Database-level concurrency protection. - Server-side expiration
enforcement. - Verified payment confirmation. - Reliable reservation
release.

The frontend prototype must not be represented as a production-grade
multi-user reservation system.

## Acceptance Criteria

The booking system is considered complete when:

1.  Each doctor has an independent availability schedule.
2.  Patients can select valid Jalali dates.
3.  Available time slots are generated correctly.
4.  Past and unavailable slots cannot be selected.
5.  Slot status colors represent the correct states.
6.  Selected slots are distinguishable from held slots.
7.  Temporary reservations last exactly 10 minutes.
8.  Expired holds release their slots.
9.  Cancelled holds release their slots.
10. Confirmed appointments remain unavailable.
11. Concurrent reservation attempts cannot produce duplicate active
    holds.
12. Payment success confirms the correct reservation.
13. Failed payment never creates a confirmed appointment.
14. Duplicate payment callbacks do not create duplicate appointments.
15. The interface accurately reflects reservation states.
16. All four doctor profiles use their own availability and consultation
    fees.

## Key Principles

1.  A selected slot is not a reservation.
2.  A temporary hold is not a confirmed appointment.
3.  A confirmed appointment requires verified payment.
4.  Every doctor has an independent schedule.
5.  Every slot has only one active reservation owner.
6.  The 10-minute expiration is enforced by the authoritative
    reservation system.
7.  Frontend state must never override reservation truth.
8.  Payment confirmation must be verified and idempotent.
9.  The user interface must accurately communicate every reservation
    state.

## Related Documentation

-   `CONCURRENT_RESERVATION_ANALYSIS.md`
-   `P02-doctor-details.html`
-   `appointment-availability.js`
-   `reservation-system.js`
-   `doctors-data.js`

## Document Scope

This document defines the functional and business logic of the Nobatino
appointment booking system.

It is a technology-independent specification.

It does not implement backend services, database schemas, API endpoints,
or payment gateways.

Those implementation details must be defined separately while preserving
the rules and requirements documented here.
