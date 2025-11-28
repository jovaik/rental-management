
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
  event?: any;
  selectedDate?: Date;
}

export function CalendarEventModal({ isOpen, onClose, onSave, event, selectedDate }: CalendarEventModalProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('booking');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Resetear o cargar datos
      setTitle(event?.title || '');
      setEventType(event?.event_type || 'booking');
      setDescription(event?.description || '');
      
      const now = new Date();
      const start = selectedDate ? new Date(selectedDate) : now;
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      
      setStartDate(start.toISOString().slice(0, 16));
      setEndDate(end.toISOString().slice(0, 16));
    }
  }, [isOpen, event, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Por favor ingresa un título para el evento');
      return;
    }
    
    const eventData = {
      id: event?.id || Date.now(),
      title: title.trim(),
      event_type: eventType,
      start_datetime: new Date(startDate),
      end_datetime: new Date(endDate),
      description,
      status: 'scheduled',
      color: eventType === 'booking' ? '#3B82F6' : '#F59E0B'
    };
    
    onSave(eventData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Editar Evento' : 'Nuevo Evento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título del evento *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Reserva Juan Pérez"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="event_type">Tipo</Label>
              <select 
                id="event_type" 
                value={eventType} 
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="booking">Reserva</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="inspection">Inspección</option>
                <option value="other">Otro</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="start_datetime">Fecha y hora inicio</Label>
              <Input
                id="start_datetime"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="end_datetime">Fecha y hora fin</Label>
              <Input
                id="end_datetime"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles del evento..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {event ? 'Actualizar' : 'Crear'} Evento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
