"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Repeat, UploadCloud } from "lucide-react";

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  isPeriodic: boolean;
  frequency: string | null;
  notifyBefore: string;
}

interface GroupFormData {
  name: string;
  description: string;
  sport: string;
  image: string;
}

interface EventFormProps {
  onSubmit: (data: EventFormData) => void;
  initialData?: Partial<EventFormData>;
  isEdit?: boolean;
}

interface GroupFormProps {
  onSubmit: (data: GroupFormData) => void;
  initialData?: Partial<GroupFormData>;
  isEdit?: boolean;
}

export function EventForm({ onSubmit, initialData, isEdit = false }: EventFormProps) {
  const [isPeriodic, setIsPeriodic] = React.useState(initialData?.isPeriodic || false);
  const [frequency, setFrequency] = React.useState(initialData?.frequency || 'weekly');
  const [notifyBefore, setNotifyBefore] = React.useState(initialData?.notifyBefore || '24');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      location: formData.get('location'),
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
          />
        </div>
        
        {isPeriodic && (
          <div className="space-y-2 pl-6 border-l-2 border-muted">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
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
          <Select value={notifyBefore} onValueChange={setNotifyBefore}>
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
      
      <Button type="submit" className="w-full">
        {isEdit ? 'Salvar alterações' : 'Criar evento'}
      </Button>
    </form>
  );
}

export function GroupForm({ onSubmit, initialData, isEdit = false }: GroupFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      sport: formData.get('sport'),
      image: formData.get('image') || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=80',
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
            placeholder="Ex: Futebol dos Amigos"
            defaultValue={initialData?.name || ''}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Descreva o propósito do grupo"
            defaultValue={initialData?.description || ''}
            className="min-h-[100px]"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sport">Esporte</Label>
          <Select defaultValue={initialData?.sport || 'futebol'} name="sport">
            <SelectTrigger id="sport">
              <SelectValue />
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
          <Label htmlFor="image">Imagem do grupo</Label>
          <div className="border rounded-md p-4 text-center">
            <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Arraste uma imagem ou clique para fazer upload
            </p>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="hidden"
            />
            <Button type="button" variant="outline" size="sm">
              Selecionar imagem
            </Button>
          </div>
        </div>
      </div>
      
      <Button type="submit" className="w-full">
        {isEdit ? 'Salvar alterações' : 'Criar grupo'}
      </Button>
    </form>
  );
}
