"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BellRing, Moon, Smartphone, Sun } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true);
    setDarkMode(theme === "dark");
  }, [theme]);

  // Atualizar tema quando o switch do modo escuro muda
  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  if (!mounted) {
    return null;
  }

  return (
    <MobileLayout
      header={<TopNav title="Configurações" backHref="/menu" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium">Aparência</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <Label htmlFor="dark-mode">Modo escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Alterar para tema escuro
                  </p>
                </div>
              </div>
              <Switch 
                id="dark-mode" 
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium">Notificações</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                <div>
                  <Label htmlFor="notifications">Notificações push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações de eventos
                  </p>
                </div>
              </div>
              <Switch 
                id="notifications" 
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <div>
                  <Label htmlFor="vibration">Vibração</Label>
                  <p className="text-sm text-muted-foreground">
                    Vibrar ao receber notificações
                  </p>
                </div>
              </div>
              <Switch id="vibration" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full">
          Salvar configurações
        </Button>
      </div>
    </MobileLayout>
  );
}
