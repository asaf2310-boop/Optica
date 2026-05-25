import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarPlus, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function PatientDetailsForm({
  summary,
  onSubmit,
  isSubmitting,
  submitLabel = "אישור הזמנה",
}) {
  const [form, setForm] = React.useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    notes: "",
    marketing_consent: false,
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.patient_name || !form.patient_phone || !form.patient_email?.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {summary && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
          {summary.map((line) => (
            <p key={line} className="font-medium">{line}</p>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם מלא *</Label>
          <Input
            id="name"
            placeholder="הכניסו את שמכם"
            value={form.patient_name}
            onChange={(e) => handleChange("patient_name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">טלפון *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="050-0000000"
            value={form.patient_phone}
            onChange={(e) => handleChange("patient_phone", e.target.value)}
            required
            dir="ltr"
            className="text-left"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">אימייל *</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={form.patient_email}
          onChange={(e) => handleChange("patient_email", e.target.value)}
          required
          dir="ltr"
          className="text-left"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">הערות</Label>
        <Textarea
          id="notes"
          placeholder="האם יש משהו שחשוב שנדע?"
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={3}
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm leading-6">
        <Checkbox
          checked={form.marketing_consent}
          onCheckedChange={(checked) => handleChange("marketing_consent", Boolean(checked))}
          className="mt-1"
        />
        <span className="text-muted-foreground">
          אני מאשר/ת קבלת עדכונים ותזכורות ממרפאת האופטיקה.
        </span>
      </label>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl text-lg py-6 gap-2"
        disabled={
          !form.patient_name || !form.patient_phone || !form.patient_email?.trim() || isSubmitting
        }
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CalendarPlus className="w-5 h-5" />
        )}
        {isSubmitting ? "שולח..." : submitLabel}
      </Button>
    </form>
  );
}

// Export helper for summary formatting
export function formatAppointmentSummary({ optometristName, date, time }) {
  const dateLabel = date
    ? format(new Date(date + "T00:00:00"), "dd/MM/yyyy")
    : "";
  return [
    optometristName ? `אופטומטריסט: ${optometristName}` : null,
    dateLabel && time ? `תאריך: ${dateLabel} בשעה ${time}` : null,
  ].filter(Boolean);
}
