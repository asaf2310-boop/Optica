import React from "react";
import { Card } from "@/components/ui/card";
import { UserCircle2 } from "lucide-react";

export default function OptometristSelector({ optometrists, selectedId, onSelect }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">בחרו אופטומטריסט</h2>
      <div className="grid gap-3">
        {optometrists.map((opto) => {
          const selected = selectedId === opto.id;
          return (
            <button
              key={opto.id}
              type="button"
              onClick={() => onSelect(opto)}
              className={`text-right w-full transition-all ${selected ? "" : ""}`}
            >
              <Card
                className={`p-4 flex items-center gap-4 border-2 transition-all ${
                  selected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{opto.name}</p>
                  {opto.title && (
                    <p className="text-sm text-muted-foreground">{opto.title}</p>
                  )}
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
