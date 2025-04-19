"use client";

import React, { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentUser } from "@/lib/mockData";
import { Camera, Check, Plus, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { SportType } from "@/lib/mockData";

export default function ProfilePage() {
  // Simulando dados do usuário
  const currentUser = getCurrentUser();
  
  // Estado para gerenciar as preferências esportivas
  const [sportPreferences, setSportPreferences] = useState(currentUser.sportPreferences || []);
  const [newSport, setNewSport] = useState<SportType | ''>('');
  const [newPosition, setNewPosition] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Função para adicionar nova preferência esportiva
  const handleAddSportPreference = () => {
    if (newSport && newPosition) {
      setSportPreferences([...sportPreferences, { sport: newSport as SportType, position: newPosition }]);
      setNewSport('');
      setNewPosition('');
      setEditMode(false);
    }
  };

  // Função para remover uma preferência esportiva
  const handleRemoveSportPreference = (index: number) => {
    const updatedPreferences = [...sportPreferences];
    updatedPreferences.splice(index, 1);
    setSportPreferences(updatedPreferences);
  };

  // Função para cancelar a adição
  const handleCancelAdd = () => {
    setNewSport('');
    setNewPosition('');
    setEditMode(false);
  };

  // Obter nome de exibição do esporte
  const getSportDisplayName = (sport: SportType) => {
    const sportNames: Record<SportType, string> = {
      'futebol': 'Futebol',
      'basquete': 'Basquete',
      'vôlei': 'Vôlei',
      'tênis': 'Tênis',
      'corrida': 'Corrida',
      'ciclismo': 'Ciclismo',
      'natação': 'Natação',
      'handebol': 'Handebol',
      'futsal': 'Futsal',
      'beach_tennis': 'Beach Tennis',
      'outro': 'Outro'
    };
    return sportNames[sport] || sport;
  };

  return (
    <MobileLayout
      header={<TopNav title="Perfil" backHref="/menu" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>
                {currentUser.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute bottom-0 right-0 rounded-full h-8 w-8"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold mt-4">{currentUser.name}</h2>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          <p className="text-sm mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              currentUser.isPremium 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}>
              {currentUser.isPremium ? "Plano Premium" : "Plano Gratuito"}
            </span>
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium">Informações Pessoais</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                defaultValue={currentUser.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={currentUser.email}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                defaultValue="(11) 98765-4321"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preferências Esportivas</h3>
              {!editMode && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setEditMode(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              )}
            </div>
            
            {/* Lista de preferências esportivas existentes */}
            <div className="space-y-3">
              {sportPreferences.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-3">
                  Você ainda não adicionou preferências esportivas.
                </p>
              ) : (
                sportPreferences.map((pref, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{getSportDisplayName(pref.sport)}</p>
                      <p className="text-sm text-muted-foreground">{pref.position}</p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleRemoveSportPreference(index)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            {/* Formulário para adicionar nova preferência esportiva */}
            {editMode && (
              <div className="space-y-3 border rounded-md p-3">
                <h4 className="font-medium text-sm">Adicionar preferência esportiva</h4>
                <div className="space-y-2">
                  <Label htmlFor="sport">Esporte</Label>
                  <Select 
                    value={newSport} 
                    onValueChange={(value) => setNewSport(value as SportType)}
                  >
                    <SelectTrigger id="sport">
                      <SelectValue placeholder="Selecione um esporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="futebol">Futebol</SelectItem>
                      <SelectItem value="basquete">Basquete</SelectItem>
                      <SelectItem value="vôlei">Vôlei</SelectItem>
                      <SelectItem value="tênis">Tênis</SelectItem>
                      <SelectItem value="corrida">Corrida</SelectItem>
                      <SelectItem value="ciclismo">Ciclismo</SelectItem>
                      <SelectItem value="natação">Natação</SelectItem>
                      <SelectItem value="handebol">Handebol</SelectItem>
                      <SelectItem value="futsal">Futsal</SelectItem>
                      <SelectItem value="beach_tennis">Beach Tennis</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Posição/Função preferida</Label>
                  <Input
                    id="position"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    placeholder="Ex: Goleiro, Armador, Levantador..."
                  />
                </div>
                
                <div className="flex gap-2 justify-end mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancelAdd}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAddSportPreference}
                    disabled={!newSport || !newPosition}
                  >
                    <Check className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium">Segurança</h3>
            
            <Button variant="outline" className="w-full" asChild>
              <Link href="/profile/change-password">
                Alterar senha
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Button className="w-full">
          <Save className="h-4 w-4 mr-2" /> Salvar alterações
        </Button>
      </div>
    </MobileLayout>
  );
}
