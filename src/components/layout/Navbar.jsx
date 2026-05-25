import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isStaffArea = location.pathname.startsWith("/staff");
  const isAdminArea = location.pathname.startsWith("/admin");
  const isPublicArea = !isStaffArea && !isAdminArea;

  const linkClass = (path) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-all ${
      location.pathname === path
        ? "bg-primary/10 text-primary shadow-sm"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const dashboardPath = isAdmin ? "/admin" : "/staff";

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
            {isPublicArea && (
              <>
                <Link to="/" className={linkClass("/")}>
                  עמוד הבית
                </Link>
                <Link to="/book" className={linkClass("/book")}>
                  הזמנת תור
                </Link>
              </>
            )}
            {isAuthenticated && (
              <>
                <Link to={dashboardPath} className={`${linkClass(dashboardPath)} inline-flex items-center gap-1.5`}>
                  <Shield className="w-3.5 h-3.5" />
                  {isAdmin ? "ניהול מרפאה" : "התורים שלי"}
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 rounded-full">
                  <LogOut className="w-3.5 h-3.5" />
                  יציאה ({user?.full_name})
                </Button>
              </>
            )}
            {!isAuthenticated && isStaffArea && (
              <span className="px-4 py-2 text-sm font-semibold text-muted-foreground">כניסת אופטומטריסט</span>
            )}
            {!isAuthenticated && isAdminArea && (
              <span className="px-4 py-2 text-sm font-semibold text-muted-foreground">כניסת מנהל</span>
            )}
          </div>
        </div>

        <button className="md:hidden rounded-full bg-muted/60 p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-2 text-right">
          {isPublicArea && (
            <>
              <Link to="/" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">
                עמוד הבית
              </Link>
              <Link to="/book" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">
                הזמנת תור
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath} onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">
                {isAdmin ? "ניהול מרפאה" : "התורים שלי"}
              </Link>
              <button onClick={handleLogout} className="block w-full text-right rounded-xl px-4 py-3 text-sm font-semibold text-destructive">
                יציאה
              </button>
            </>
          ) : (
            <>
              {isStaffArea && (
                <span className="block rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground">כניסת אופטומטריסט</span>
              )}
              {isAdminArea && (
                <span className="block rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground">כניסת מנהל</span>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
}
