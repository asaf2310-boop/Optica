import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const linkClass = (path) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-all ${
      location.pathname === path
        ? "bg-primary/10 text-primary shadow-sm"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50" dir="rtl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-foreground">
            אופטיקה — קביעת תורים
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full bg-muted/40 p-1">
            <Link to="/" className={linkClass("/")}>
              עמוד הבית
            </Link>
            <Link to="/book" className={linkClass("/book")}>
              קביעת תור
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin" className={`${linkClass("/admin")} inline-flex items-center gap-1.5`}>
                  <Shield className="w-3.5 h-3.5" />
                  ניהול
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 rounded-full">
                  <LogOut className="w-3.5 h-3.5" />
                  יציאה ({user?.full_name})
                </Button>
              </>
            ) : (
              <Link to="/login" className={`${linkClass("/login")} inline-flex items-center gap-1.5`}>
                <LogIn className="w-3.5 h-3.5" />
                כניסת צוות
              </Link>
            )}
          </div>
        </div>

        <button className="md:hidden rounded-full bg-muted/60 p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-2 text-right">
          <Link to="/" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">
            עמוד הבית
          </Link>
          <Link to="/book" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">
            קביעת תור
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/admin" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">
                ניהול
              </Link>
              <button onClick={handleLogout} className="block w-full text-right rounded-xl px-4 py-3 text-sm font-semibold text-destructive">
                יציאה
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">
              כניסת צוות
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
