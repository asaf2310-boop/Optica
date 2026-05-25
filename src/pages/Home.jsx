import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, CheckCircle2, Eye, Users } from "lucide-react";

const features = [
  {
    title: "קביעה לפי אופטומטריסט",
    description: "בוחרים אופטומטריסט, רואים את השעות הפנויות שלו וקובעים תור.",
    icon: Eye,
  },
  {
    title: "קביעה לפי תאריך ושעה",
    description: "בוחרים מועד, רואים מי פנוי באותה שעה ובוחרים אופטומטריסט.",
    icon: CalendarCheck,
  },
  {
    title: "ללא תשלום מקוון",
    description: "קביעת תור מהירה — בחירת אופטומטריסט, תאריך ושעה בלבד.",
    icon: Users,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16" dir="rtl">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-muted/40 px-6 py-20">
          <div className="relative mx-auto max-w-4xl text-center space-y-7">
            <Badge className="rounded-full px-4 py-1.5">מרפאת אופטיקה</Badge>
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-foreground">
              קביעת תור לבדיקת ראייה
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-8">
              הזמינו תור אונליין — בלי תשלום מקוון, רק בחירת אופטומטריסט, תאריך ושעה.
            </p>
            <div className="flex justify-center">
              <Link to="/book">
                <Button size="lg" className="h-14 rounded-xl px-10 text-lg font-bold shadow-md">
                  הזמנת תור
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-5xl grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-7">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/30 px-6 py-12">
          <Card className="max-w-3xl mx-auto p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-600" />
              שלושה אופטומטריסטים במערכת
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>{'ד"ר יוסי כהן'}</li>
              <li>{'ד"ר מיכל לוי'}</li>
              <li>{'ד"ר דנה אברהם'}</li>
            </ul>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 px-6 text-center text-sm text-muted-foreground" dir="rtl">
        © {new Date().getFullYear()} מרפאת אופטיקה
      </footer>
    </div>
  );
}
