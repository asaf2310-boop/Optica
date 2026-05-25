import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "../layout/Navbar";
import AppointmentTable from "../admin/AppointmentTable";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AvailabilityManager from "../admin/AvailabilityManager";
import CustomerManagement from "../admin/CustomerManagement";
import { Card } from "@/components/ui/card";
import { CalendarCheck, CalendarDays, CheckCircle2, Clock, Settings2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { demoModeEnabled } from "@/api/demoClient";
import { buildOptometristReassignmentUpdate } from "@/lib/adminReassignment";
import { sendReassignmentEmail } from "@/lib/emailService";

export default function DashboardContent({ isAdminView }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("appointments");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isReassigning, setIsReassigning] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const scopeOptometristId = isAdminView ? null : user?.optometrist_id;

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", scopeOptometristId],
    queryFn: async () => {
      const all = await base44.entities.Appointment.list("date");
      if (!scopeOptometristId) return all;
      return all.filter((a) => a.optometrist_id === scopeOptometristId);
    },
  });

  const { data: optometrists = [] } = useQuery({
    queryKey: ["optometrists"],
    queryFn: () => base44.entities.Optometrist.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: (updatedAppointment) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (updatedAppointment?.date) {
        queryClient.invalidateQueries({ queryKey: ["appointments-for-date", updatedAppointment.date] });
      }
    },
  });

  const handleReassignOptometrist = async (appointment, optometrist) => {
    setIsReassigning(true);
    try {
      const updatePayload = buildOptometristReassignmentUpdate(appointment, optometrist);
      if (!updatePayload) return;

      const updated = await base44.entities.Appointment.update(appointment.id, updatePayload);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (updated?.date) {
        queryClient.invalidateQueries({ queryKey: ["appointments-for-date", updated.date] });
      }

      const emailResult = await sendReassignmentEmail({ ...appointment, ...updated });
      const links = emailResult?.links || emailResult?.preview?.links;
      const toastTitle = demoModeEnabled ? "מייל נשלח (דמו)" : "מייל נשלח ללקוח";

      toast({
        title: toastTitle,
        description: links ? (
          <span className="block text-xs mt-1 break-all" dir="ltr">
            {links.confirm}
          </span>
        ) : (
          "נשלח מייל ללקוח עם קישורי אישור/ביטול/תור חדש"
        ),
      });
    } catch (err) {
      if (err?.message === "missing_patient_email") {
        toast({
          title: "חסר אימייל ללקוח",
          description: "הוסיפו אימייל לתור לפני שינוי אופטומטריסט.",
          variant: "destructive",
        });
        return;
      }
      if (err?.message === "status_not_reassignable") {
        toast({
          title: "לא ניתן לשנות",
          description: "תור שבוטל או הושלם אינו ניתן לשיוך מחדש.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "שגיאה בשיוך מחדש",
        description: "נסו שוב בעוד רגע.",
        variant: "destructive",
      });
    } finally {
      setIsReassigning(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-for-date"] });
    },
  });

  const filteredAppointments = (statusFilter === "all"
    ? appointments
    : appointments.filter((a) => a.status === statusFilter)
  ).sort((a, b) => {
    const dateCompare = (a.date || "").localeCompare(b.date || "");
    if (dateCompare !== 0) return dateCompare;
    return (a.time || "").localeCompare(b.time || "");
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
  };

  const statCards = [
    { label: "סה״כ תורים", value: stats.total, icon: CalendarDays, color: "text-foreground" },
    { label: "ממתינים", value: stats.pending, icon: Clock, color: "text-yellow-600" },
    { label: "מאושרים", value: stats.confirmed, icon: Users, color: "text-primary" },
    { label: "הושלמו", value: stats.completed, icon: CheckCircle2, color: "text-green-600" },
  ];

  const dashboardTabs = [
    { value: "appointments", label: "תורים", icon: CalendarCheck },
    { value: "availability", label: "זמינות", icon: Settings2 },
    ...(isAdminView ? [{ value: "customers", label: "לקוחות", icon: Users }] : []),
  ];

  const statusTabs = [
    { value: "all", label: "הכל" },
    { value: "pending", label: "ממתינים" },
    { value: "pending_reassignment", label: "ממתין לאישור" },
    { value: "confirmed", label: "מאושרים" },
    { value: "completed", label: "הושלמו" },
    { value: "cancelled", label: "בוטלו" },
  ];

  const scopeLabel = isAdminView
    ? "כל האופטומטריסטים"
    : optometrists.find((o) => o.id === scopeOptometristId)?.name || user?.full_name;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {isAdminView ? "ניהול מרפאה" : "התורים שלי"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isAdminView ? "מנהל — " : "אופטומטריסט — "}
              {scopeLabel}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <div
              className={`mb-8 grid w-full gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm ${
                dashboardTabs.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
              }`}
              role="tablist"
            >
              {dashboardTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex h-16 w-full items-center justify-center gap-2 rounded-xl border px-4 text-base font-semibold transition-all ${
                    activeTab === tab.value
                      ? "border-primary/30 bg-primary text-primary-foreground shadow-md"
                      : "border-transparent bg-muted/40 text-foreground hover:border-primary/20 hover:bg-muted"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <TabsContent value="appointments">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statCards.map((s) => (
                  <Card key={s.label} className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <s.icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mb-6">
                <div className="flex w-full flex-wrap justify-end gap-2 rounded-xl bg-muted/50 p-2 sm:w-fit">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatusFilter(tab.value)}
                      className={`min-w-24 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        statusFilter === tab.value
                          ? "bg-background text-foreground shadow"
                          : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="h-64 rounded-xl" />
              ) : (
                <AppointmentTable
                  appointments={filteredAppointments}
                  optometrists={optometrists}
                  allowOptometristReassign={isAdminView}
                  onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
                  onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                  onReassignOptometrist={isAdminView ? handleReassignOptometrist : undefined}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isMutating={
                    updateMutation.isPending || deleteMutation.isPending || isReassigning
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="availability">
              <div className="max-w-2xl">
                <p className="text-muted-foreground mb-6">
                  הגדרת ימים ושעות פנויות{isAdminView ? " לכל אופטומטריסט" : " שלך"}.
                </p>
                <AvailabilityManager
                  optometristId={scopeOptometristId}
                  optometrists={optometrists}
                  isAdmin={isAdminView}
                />
              </div>
            </TabsContent>

            {isAdminView && (
              <TabsContent value="customers">
                {isLoading ? (
                  <Skeleton className="h-64 rounded-xl" />
                ) : (
                  <CustomerManagement appointments={appointments} />
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
