export const MIN_APPOINTMENT_GAP_MINUTES = 60;

export const timeToMinutes = (time) => {
  const [hours, minutes] = String(time || "").split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

export const isTooCloseToBookedAppointment = (slot, appointments) => {
  const slotMinutes = timeToMinutes(slot);
  if (slotMinutes === null) return true;

  return appointments
    .filter((appointment) => appointment.status !== "cancelled")
    .some((appointment) => {
      const appointmentMinutes = timeToMinutes(appointment.time);
      return (
        appointmentMinutes !== null &&
        Math.abs(slotMinutes - appointmentMinutes) < MIN_APPOINTMENT_GAP_MINUTES
      );
    });
};

export const getAvailableSlotsForOptometrist = ({
  date,
  optometristId,
  availabilityRecords,
  appointments,
}) => {
  if (!date || !optometristId) return [];

  const rec = availabilityRecords.find(
    (r) => r.date === date && r.optometrist_id === optometristId && r.is_active
  );
  if (!rec?.slots?.length) return [];

  const booked = appointments.filter(
    (a) => a.date === date && a.optometrist_id === optometristId
  );

  return rec.slots.filter((slot) => !isTooCloseToBookedAppointment(slot, booked));
};

export const getAvailableOptometristsAtSlot = ({
  date,
  time,
  optometrists,
  availabilityRecords,
  appointments,
}) => {
  if (!date || !time) return [];

  return optometrists.filter((opto) => {
    const slots = getAvailableSlotsForOptometrist({
      date,
      optometristId: opto.id,
      availabilityRecords,
      appointments,
    });
    return slots.includes(time);
  });
};
