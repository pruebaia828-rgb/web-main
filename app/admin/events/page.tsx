import { EventsManagement } from '@/components/admin/events-management';

export default function EventManagerPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Gestión de Eventos</h1>
        <p className="mt-1 text-muted-foreground">Puedes crear, editar y publicar eventos sin acceder a tickets ni configuración.</p>
      </div>
      <EventsManagement />
    </div>
  );
}
