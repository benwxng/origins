"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun
    },
    {
      value: "dark" as const,
      label: "Dark", 
      icon: Moon
    },
    {
      value: "system" as const,
      label: "System",
      icon: Monitor
    }
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Theme Preference</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;
            
            return (
              <Button
                key={themeOption.value}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`flex-1 ${
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background border-border hover:bg-muted"
                }`}
                onClick={() => setTheme(themeOption.value)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {themeOption.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
