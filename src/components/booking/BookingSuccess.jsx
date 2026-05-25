import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, CalendarPlus } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const STATUS_MAP = {
  pending: { label: "ממתין לאישור", color: "text-yellow-600 bg-yellow-50" },
  confirmed: { label: "מאושר", color: "text-green-600 bg-green-50" },
  cancelled: { label: "בוטל", color: "text-red-600 bg-red-50" },
  completed: { label: "הושלם", color: "text-blue-600 bg-blue-50" },
};

export default function BookingSuccess({ appointment, onReset }) {
  const status = STATUS_MAP[appointment?.status] || STATUS_MAP.pending;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-6"
      dir="rtl"
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-3xl font-bold text-foreground mb-3">התור נקבע בהצלחה!</h2>
      <p className="text-muted-foreground text-lg mb-8">נשלח אליכם אישור בקרוב</p>

      <div className="bg-muted/50 rounded-xl p-6 max-w-sm mx-auto mb-6 text-right">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">אופטומטריסט:</span>
            <span className="font-medium text-foreground">{appointment.optometrist_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">תאריך:</span>
            <span className="font-medium text-foreground">
              {format(new Date(appointment.date + "T00:00:00"), "dd/MM/yyyy")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">שעה:</span>
            <span className="font-medium text-foreground">{appointment.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">סטטוס:</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/">
          <Button variant="outline" className="gap-2 rounded-xl">
            <Home className="w-4 h-4" />
            חזרה לעמוד הבית
          </Button>
        </Link>
        <Button onClick={onReset} className="gap-2 rounded-xl">
          <CalendarPlus className="w-4 h-4" />
          קביעת תור נוסף
        </Button>
      </div>
    </motion.div>
  );
}
