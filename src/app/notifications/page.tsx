import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Notificações</h1>
      </div>
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <div className="flex justify-center mb-4">
          <Bell className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Nenhuma notificação nova</h2>
        <p className="text-muted-foreground mt-2">Você será notificado aqui sobre atividades importantes.</p>
      </div>
    </div>
  );
}
