import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/layout/Navbar";
import OptometristSelector from "../components/booking/OptometristSelector";
import DateTimePicker from "../components/booking/DateTimePicker";
import PatientDetailsForm, { formatAppointmentSummary } from "../components/booking/PatientDetailsForm";
import BookingSuccess from "../components/booking/BookingSuccess";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAvailableOptometristsAtSlot } from "@/lib/bookingUtils";
import { Button } from "@/components/ui/button";

export default function Book() {
  const [mode, setMode] = useState("byOptometrist");
  const [selectedOptometrist, setSelectedOptometrist] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pickedOptometristFromSlot, setPickedOptometristFromSlot] = useState(null);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: optometrists = [], isLoading } = useQuery({
    queryKey: ["optometrists"],
    queryFn: () => base44.entities.Optometrist.list(),
  });

  const { data: availabilityRecords = [] } = useQuery({
    queryKey: ["availability"],
    queryFn: () => base44.entities.Availability.list(),
  });

  const { data: appointmentsOnDate = [] } = useQuery({
    queryKey: ["appointments-for-date", date],
    queryFn: () => base44.entities.Appointment.filter({ date }),
    enabled: mode === "byDateTime" && Boolean(date),
  });

  const activeOptometrists = optometrists.filter((o) => o.is_active !== false);
  const optometristIds = activeOptometrists.map((o) => o.id);

  const availableAtSlot =
    mode === "byDateTime" && date && time
      ? getAvailableOptometristsAtSlot({
          date,
          time,
          optometrists: activeOptometrists,
          availabilityRecords,
          appointments: appointmentsOnDate,
        })
      : [];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Appointment.create({
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_email: data.patient_email,
        notes: data.notes,
        marketing_consent: Boolean(data.marketing_consent),
        optometrist_id: data.optometrist_id,
        optometrist_name: data.optometrist_name,
        date: data.date,
        time: data.time,
        status: "pending",
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-for-date", created?.date] });
      setBookedAppointment(created);
      resetFlow();
    },
    onError: () => {
      toast({
        title: "לא ניתן לאשר את התור",
        description: "נסו שוב בעוד רגע או צרו קשר טלפוני.",
        variant: "destructive",
      });
    },
  });

  const resetFlow = () => {
    setSelectedOptometrist(null);
    setDate("");
    setTime("");
    setPickedOptometristFromSlot(null);
    setShowPatientForm(false);
  };

  const effectiveOptometrist =
    mode === "byOptometrist" ? selectedOptometrist : pickedOptometristFromSlot;

  const canProceedToForm =
    mode === "byOptometrist"
      ? selectedOptometrist && date && time
      : pickedOptometristFromSlot && date && time;

  const handlePatientSubmit = (form) => {
    if (!effectiveOptometrist || !date || !time) return;
    createMutation.mutate({
      ...form,
      optometrist_id: effectiveOptometrist.id,
      optometrist_name: effectiveOptometrist.name,
      date,
      time,
    });
  };

  const handleModeChange = (value) => {
    setMode(value);
    resetFlow();
  };

  if (bookedAppointment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-6" dir="rtl">
          <div className="max-w-2xl mx-auto">
            <BookingSuccess
              appointment={bookedAppointment}
              onReset={() => {
                setBookedAppointment(null);
                resetFlow();
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">קביעת תור</h1>
            <p className="text-muted-foreground text-lg">בחרו אופטומטריסט או תאריך ושעה</p>
          </div>

          <Tabs value={mode} onValueChange={handleModeChange} className="mb-8" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="byOptometrist" className="text-sm font-semibold">
                לפי אופטומטריסט
              </TabsTrigger>
              <TabsTrigger value="byDateTime" className="text-sm font-semibold">
                לפי תאריך ושעה
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : showPatientForm && canProceedToForm ? (
            <PatientDetailsForm
              summary={formatAppointmentSummary({
                optometristName: effectiveOptometrist?.name,
                date,
                time,
              })}
              onSubmit={handlePatientSubmit}
              isSubmitting={createMutation.isPending}
            />
          ) : mode === "byOptometrist" ? (
            <div className="space-y-8">
              <OptometristSelector
                optometrists={activeOptometrists}
                selectedId={selectedOptometrist?.id}
                onSelect={(opto) => {
                  setSelectedOptometrist(opto);
                  setDate("");
                  setTime("");
                }}
              />
              {selectedOptometrist && (
                <>
                  <div className="h-px bg-border" />
                  <DateTimePicker
                    optometristId={selectedOptometrist.id}
                    date={date}
                    time={time}
                    onDateChange={setDate}
                    onTimeChange={setTime}
                  />
                  {date && time && (
                    <Button
                      className="w-full rounded-xl"
                      size="lg"
                      onClick={() => setShowPatientForm(true)}
                    >
                      המשך לפרטים אישיים
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <DateTimePicker
                aggregateAllOptometrists
                optometristIds={optometristIds}
                date={date}
                time={time}
                onDateChange={(d) => {
                  setDate(d);
                  setTime("");
                  setPickedOptometristFromSlot(null);
                }}
                onTimeChange={(t) => {
                  setTime(t);
                  setPickedOptometristFromSlot(null);
                }}
              />

              {date && time && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">אופטומטריסטים פנויים בשעה זו</h2>
                  {availableAtSlot.length === 0 ? (
                    <p className="text-sm text-destructive">אין אופטומטריסט פנוי בשעה שנבחרה.</p>
                  ) : (
                    <OptometristSelector
                      optometrists={availableAtSlot}
                      selectedId={pickedOptometristFromSlot?.id}
                      onSelect={setPickedOptometristFromSlot}
                    />
                  )}
                  {pickedOptometristFromSlot && (
                    <Button
                      className="w-full rounded-xl"
                      size="lg"
                      onClick={() => setShowPatientForm(true)}
                    >
                      המשך לפרטים אישיים
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
