import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, CalendarCheck } from "lucide-react";
import { getAppointmentByReassignmentToken, respondToReassignment } from "@/api/reassignmentApi";
import { formatAppointmentDateTime } from "@/lib/reassignmentUtils";

export default function AppointmentConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const action = searchParams.get("action") || "confirm";

  const [state, setState] = useState("loading");
  const [appointment, setAppointment] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    if (!token || action !== "confirm") {
      setState("error");
      setErrorCode("invalid_link");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const apt = await getAppointmentByReassignmentToken(token);
        if (cancelled) return;

        if (!apt) {
          setState("error");
          setErrorCode("invalid_token");
          return;
        }

        if (apt.status === "confirmed" && !apt.reassignment_token) {
          setAppointment(apt);
          setState("already");
          return;
        }

        if (apt.status !== "pending_reassignment") {
          setState("error");
          setErrorCode("invalid_state");
          return;
        }

        const updated = await respondToReassignment(token, "confirm");
        if (cancelled) return;
        setAppointment(updated);
        setState("success");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setErrorCode(err?.message?.includes("invalid") ? err.message : "unknown");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, action]);

  const when = appointment
    ? formatAppointmentDateTime(appointment.date, appointment.time)
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6" dir="rtl">
        <div className="max-w-lg mx-auto">
          {state === "loading" && (
            <Card className="p-8 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          )}

          {state === "success" && (
            <Card className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
              <h1 className="text-2xl font-bold">השינוי אושר</h1>
              <p className="text-muted-foreground">
                התור שלכם עם <strong>{appointment?.optometrist_name}</strong> אושר
                {when ? <> ל־<strong>{when}</strong></> : null}.
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/">חזרה לדף הבית</Link>
              </Button>
            </Card>
          )}

          {state === "already" && (
            <Card className="p-8 text-center space-y-4">
              <CalendarCheck className="w-14 h-14 text-primary mx-auto" />
              <h1 className="text-2xl font-bold">התור כבר מאושר</h1>
              <p className="text-muted-foreground">
                אישרתם כבר את השינוי. התור עם {appointment?.optometrist_name}
                {when ? ` ב־${when}` : ""} פעיל במערכת.
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/">חזרה לדף הבית</Link>
              </Button>
            </Card>
          )}

          {state === "error" && (
            <Card className="p-8 text-center space-y-4">
              <AlertCircle className="w-14 h-14 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold">לא ניתן לאשר את התור</h1>
              <p className="text-muted-foreground">
                {errorCode === "invalid_token" || errorCode === "invalid_link"
                  ? "הקישור אינו תקף או שפג תוקפו. פנו למרפאה לקבלת קישור חדש."
                  : errorCode === "invalid_state"
                    ? "התור כבר טופל (בוטל או אושר בעבר)."
                    : "אירעה שגיאה. נסו שוב או צרו קשר עם המרפאה."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild className="rounded-xl">
                  <Link to="/book">קביעת תור חדש</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/">דף הבית</Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
