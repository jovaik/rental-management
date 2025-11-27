'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useRouter } from 'next/navigation';

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type Booking = {
  id: string;
  itemId: string;
  customerId: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  item: {
    name: string;
    type: string;
  };
  customer: {
    name: string;
  };
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
};

export default function BookingCalendar() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        // Filter out cancelled bookings
        const activeBookings = data.bookings.filter(
          (b: Booking) => b.status !== 'CANCELLED'
        );
        setBookings(activeBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const events: CalendarEvent[] = useMemo(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.item.name} - ${booking.customer.name}`,
      start: new Date(booking.startDate),
      end: new Date(booking.endDate),
      resource: booking,
    }));
  }, [bookings]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#3174ad';

    switch (status) {
      case 'PENDING':
        backgroundColor = '#f59e0b'; // yellow
        break;
      case 'CONFIRMED':
        backgroundColor = '#3b82f6'; // blue
        break;
      case 'IN_PROGRESS':
        backgroundColor = '#10b981'; // green
        break;
      case 'COMPLETED':
        backgroundColor = '#6b7280'; // gray
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    router.push(`/bookings/${event.id}`);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    router.push(`/bookings/new?start=${start.toISOString()}&end=${end.toISOString()}`);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        Cargando calendario...
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Calendario de Reservas</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span>En Progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }}></div>
            <span>Completada</span>
          </div>
        </div>
      </div>

      <div style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay eventos en este rango',
            showMore: (total) => `+ Ver más (${total})`,
          }}
          culture="es"
        />
      </div>
    </div>
  );
}
