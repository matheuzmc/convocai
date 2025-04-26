"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Repeat, UploadCloud } from "lucide-react";

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  isPeriodic: boolean;
  frequency: string | null;
  notifyBefore: string;
}

export interface GroupFormData {
  name: string;
  description: string;
  sport: string;
  image: string;
}

interface EventFormProps {
  onSubmit: (data: EventFormData) => void;
  initialData?: Partial<EventFormData>;
  isEdit?: boolean;
  isLoading?: boolean;
}

interface GroupFormProps {
  onSubmit: (data: GroupFormData) => void;
  initialData?: Partial<GroupFormData>;
  isEdit?: boolean;
  isLoading?: boolean;
}

export function EventForm({ onSubmit, initialData, isEdit = false, isLoading = false }: EventFormProps) {
  const [isPeriodic, setIsPeriodic] = React.useState(initialData?.isPeriodic || false);
  const [frequency, setFrequency] = React.useState(initialData?.frequency || 'weekly');
  const [notifyBefore, setNotifyBefore] = React.useState(initialData?.notifyBefore || '24');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: EventFormData = {
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      date: String(formData.get('date') || ''),
      time: String(formData.get('time') || ''),
      location: String(formData.get('location') || ''),
      isPeriodic,
      frequency: isPeriodic ? frequency : null,
      notifyBefore,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título do evento</Label>
          <Input
            id="title"
            name="title"
            placeholder="Ex: Partida de futebol"
            defaultValue={initialData?.title || ''}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Detalhes sobre o evento"
            defaultValue={initialData?.description || ''}
            className="min-h-[100px]"
            disabled={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                name="date"
                type="date"
                className="pl-9"
                defaultValue={initialData?.date || ''}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Horário</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                name="time"
                type="time"
                className="pl-9"
                defaultValue={initialData?.time || ''}
                disabled={isLoading}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Local</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              name="location"
              placeholder="Endereço do evento"
              className="pl-9"
              defaultValue={initialData?.location || ''}
              disabled={isLoading}
              required
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="is-periodic">Evento recorrente</Label>
              <p className="text-xs text-muted-foreground">
                Repetir este evento periodicamente
              </p>
            </div>
          </div>
          <Switch 
            id="is-periodic" 
            checked={isPeriodic}
            onCheckedChange={setIsPeriodic}
            disabled={isLoading}
          />
        </div>
        
        {isPeriodic && (
          <div className="space-y-2 pl-6 border-l-2 border-muted">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency} disabled={isLoading}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="notify-before">Notificar membros</Label>
          <Select value={notifyBefore} onValueChange={setNotifyBefore} disabled={isLoading}>
            <SelectTrigger id="notify-before">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hora antes</SelectItem>
              <SelectItem value="3">3 horas antes</SelectItem>
              <SelectItem value="6">6 horas antes</SelectItem>
              <SelectItem value="12">12 horas antes</SelectItem>
              <SelectItem value="24">24 horas antes</SelectItem>
              <SelectItem value="48">2 dias antes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Criando...' : (isEdit ? 'Salvar Alterações' : 'Criar Evento')}
      </Button>
    </form>
  );
}

export function GroupForm({ onSubmit, initialData, isEdit = false, isLoading = false }: GroupFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: GroupFormData = {
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || ''),
      sport: String(formData.get('sport') || ''),
      image: String(formData.get('image') || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=80'),
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do grupo</Label>
          <Input
            id="name"
            name="name"
            placeholder="Ex: Futebol das Terças"
            defaultValue={initialData?.name || ''}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Objetivo, regras, etc."
            defaultValue={initialData?.description || ''}
            className="min-h-[100px]"
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sport">Esporte Principal</Label>
          <Select name="sport" defaultValue={initialData?.sport || 'futebol'} disabled={isLoading}>
            <SelectTrigger id="sport">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="futebol">Futebol</SelectItem>
              <SelectItem value="basquete">Basquete</SelectItem>
              <SelectItem value="vôlei">Vôlei</SelectItem>
              <SelectItem value="futsal">Futsal</SelectItem>
              <SelectItem value="beach_tennis">Beach Tennis</SelectItem>
              <SelectItem value="tênis">Tênis</SelectItem>
              <SelectItem value="corrida">Corrida</SelectItem>
              <SelectItem value="ciclismo">Ciclismo</SelectItem>
              <SelectItem value="natação">Natação</SelectItem>
              <SelectItem value="handebol">Handebol</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="image">Imagem do Grupo (URL)</Label>
          <div className="relative">
            <UploadCloud className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="image"
              name="image"
              placeholder="https://exemplo.com/imagem.jpg"
              className="pl-9"
              defaultValue={initialData?.image || ''}
              type="url"
              disabled={isLoading}
            />
          </div>
           <p className="text-xs text-muted-foreground">
             Opcional. Cole a URL de uma imagem para o grupo.
           </p>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Criando...' : (isEdit ? 'Salvar Alterações' : 'Criar Grupo')}
      </Button>
    </form>
  );
}
