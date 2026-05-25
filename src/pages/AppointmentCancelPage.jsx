import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, XCircle } from "lucide-react";
import { getAppointmentByReassignmentToken, respondToReassignment } from "@/api/reassignmentApi";
import { formatAppointmentDateTime } from "@/lib/reassignmentUtils";

export default function AppointmentCancelPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loadState, setLoadState] = useState("loading");
  const [appointment, setAppointment] = useState(null);
  const [cancelState, setCancelState] = useState("idle");
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoadState("error");
      setErrorCode("invalid_link");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const apt = await getAppointmentByReassignmentToken(token);
        if (cancelled) return;

        if (!apt) {
          setLoadState("error");
          setErrorCode("invalid_token");
          return;
        }

        if (apt.status === "cancelled" && !apt.reassignment_token) {
          setAppointment(apt);
          setLoadState("already_cancelled");
          return;
        }

        if (apt.status !== "pending_reassignment") {
          setLoadState("error");
          setErrorCode("invalid_state");
          return;
        }

        setAppointment(apt);
        setLoadState("ready");
      } catch {
        if (cancelled) return;
        setLoadState("error");
        setErrorCode("unknown");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCancel = async () => {
    setCancelState("submitting");
    try {
      const updated = await respondToReassignment(token, "cancel");
      setAppointment(updated);
      setCancelState("done");
    } catch (err) {
      setCancelState("error");
      setErrorCode(err?.message || "unknown");
    }
  };

  const when = appointment
    ? formatAppointmentDateTime(appointment.date, appointment.time)
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6" dir="rtl">
        <div className="max-w-lg mx-auto">
          {loadState === "loading" && (
            <Card className="p-8 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
            </Card>
          )}

          {loadState === "ready" && cancelState !== "done" && (
            <Card className="p-8 space-y-6">
              <h1 className="text-2xl font-bold">ביטול תור</h1>
              <p className="text-muted-foreground leading-relaxed">
                לאחר שינוי האופטומטריסט, ניתן לבטל את התור המקורי
                {when ? <> ל־<strong>{when}</strong></> : null}.
                לאישור סופי לחצו על הכפתור למטה.
              </p>
              {appointment?.optometrist_name && (
                <p className="text-sm">
                  אופטומטריסט מוצע: <strong>{appointment.optometrist_name}</strong>
                </p>
              )}
              <Button
                variant="destructive"
                size="lg"
                className="w-full rounded-xl"
                onClick={handleCancel}
                disabled={cancelState === "submitting"}
              >
                {cancelState === "submitting" ? "מבטל..." : "בטל תור"}
              </Button>
              {cancelState === "error" && (
                <p className="text-sm text-destructive">לא ניתן לבטל. נסו שוב או צרו קשר עם המרפאה.</p>
              )}
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link to={`/appointment/respond?token=${encodeURIComponent(token)}&action=confirm`}>
                  במקום זאת — אשרו את השינוי
                </Link>
              </Button>
            </Card>
          )}

          {cancelState === "done" && (
            <Card className="p-8 text-center space-y-4">
              <XCircle className="w-14 h-14 text-muted-foreground mx-auto" />
              <h1 className="text-2xl font-bold">התור בוטל</h1>
              <p className="text-muted-foreground">
                התור בוטל בהצלחה. ניתן לקבוע תור חדש בכל עת.
              </p>
              <Button asChild className="rounded-xl">
                <Link to="/book">קביעת תור חדש</Link>
              </Button>
            </Card>
          )}

          {loadState === "already_cancelled" && (
            <Card className="p-8 text-center space-y-4">
              <XCircle className="w-14 h-14 text-muted-foreground mx-auto" />
              <h1 className="text-2xl font-bold">התור כבר בוטל</h1>
              <Button asChild className="rounded-xl">
                <Link to="/book">קביעת תור חדש</Link>
              </Button>
            </Card>
          )}

          {loadState === "error" && (
            <Card className="p-8 text-center space-y-4">
              <AlertCircle className="w-14 h-14 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold">לא ניתן לטעון את התור</h1>
              <p className="text-muted-foreground">
                {errorCode === "invalid_token" || errorCode === "invalid_link"
                  ? "הקישור אינו תקף. פנו למרפאה."
                  : "התור כבר טופל או שהקישור אינו פעיל."}
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/">דף הבית</Link>
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
