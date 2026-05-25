import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    navigate("/admin", { replace: true });
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate("/admin");
    } catch {
      toast({
        title: "התחברות נכשלה",
        description: "שם משתמש או סיסמה שגויים",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6" dir="rtl">
        <div className="max-w-md mx-auto">
          <Card className="p-8">
            <h1 className="text-2xl font-bold text-center mb-2">כניסה לניהול</h1>
            <p className="text-muted-foreground text-center mb-8 text-sm">
              מנהל — כל התורים. צוות — תורים של האופטומטריסט שלכם.
              {import.meta.env.VITE_DEMO_MODE === "false" && (
                <span className="block mt-2 text-xs">
                  Supabase: אותם שמות משתמש (admin, yossi, …) — התחברות כ־username@optica.app
                </span>
              )}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">שם משתמש</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                התחברות
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
