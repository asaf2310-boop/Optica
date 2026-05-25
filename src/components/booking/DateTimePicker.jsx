import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  startOfDay,
  isSameDay,
} from "date-fns";
import { he } from "date-fns/locale";
import { getAvailableSlotsForOptometrist } from "@/lib/bookingUtils";

const DAY_NAMES = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export default function DateTimePicker({
  optometristId,
  date,
  time,
  onDateChange,
  onTimeChange,
  aggregateAllOptometrists = false,
  optometristIds = [],
}) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const { data: availabilityRecords = [] } = useQuery({
    queryKey: ["availability"],
    queryFn: () => base44.entities.Availability.list(),
  });

  const { data: appointments = [], isFetching } = useQuery({
    queryKey: ["appointments-for-date", date],
    queryFn: () => base44.entities.Appointment.filter({ date }),
    enabled: Boolean(date),
  });

  const activeDates = useMemo(() => {
    const dates = new Set();
    for (const rec of availabilityRecords) {
      if (!rec.is_active || !rec.slots?.length) continue;
      if (aggregateAllOptometrists) {
        if (optometristIds.includes(rec.optometrist_id)) dates.add(rec.date);
      } else if (rec.optometrist_id === optometristId) {
        dates.add(rec.date);
      }
    }
    return dates;
  }, [availabilityRecords, optometristId, aggregateAllOptometrists, optometristIds]);

  const availableSlots = useMemo(() => {
    if (!date) return [];

    if (aggregateAllOptometrists) {
      const slotSet = new Set();
      for (const id of optometristIds) {
        getAvailableSlotsForOptometrist({
          date,
          optometristId: id,
          availabilityRecords,
          appointments,
        }).forEach((s) => slotSet.add(s));
      }
      return [...slotSet].sort();
    }

    return getAvailableSlotsForOptometrist({
      date,
      optometristId,
      availabilityRecords,
      appointments,
    });
  }, [
    date,
    optometristId,
    availabilityRecords,
    appointments,
    aggregateAllOptometrists,
    optometristIds,
  ]);

  useEffect(() => {
    if (time && !isFetching && !availableSlots.includes(time)) {
      onTimeChange("");
    }
  }, [time, isFetching, availableSlots, onTimeChange]);

  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) }),
    [viewMonth]
  );

  const firstDayOffset = startOfMonth(viewMonth).getDay();
  const selectedDate = date ? new Date(date + "T00:00:00") : null;

  const isDateAvailable = (day) => {
    if (isBefore(day, today)) return false;
    return activeDates.has(format(day, "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>תאריך *</Label>
        <div className="border border-border rounded-xl p-4 bg-background">
          <div className="flex items-center justify-between mb-4" dir="rtl">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="p-1 rounded-lg hover:bg-muted"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="font-medium text-sm">
              {format(viewMonth, "MMMM yyyy", { locale: he })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="p-1 rounded-lg hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {daysInMonth.map((day) => {
              const available = isDateAvailable(day);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const isPast = isBefore(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    if (!available) return;
                    onDateChange(format(day, "yyyy-MM-dd"));
                    onTimeChange("");
                  }}
                  disabled={!available}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm m-0.5 font-medium
                    ${selected ? "bg-primary text-primary-foreground" : ""}
                    ${!selected && available ? "hover:bg-accent text-foreground" : ""}
                    ${isPast || !available ? "text-muted-foreground/40 cursor-not-allowed" : ""}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {date && (
        <div className="space-y-2">
          <Label>שעה *</Label>
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              בודק שעות זמינות...
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onTimeChange(slot)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    time === slot
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-destructive">אין שעות פנויות בתאריך זה.</p>
          )}
        </div>
      )}
    </div>
  );
}
