import { AppHeader } from '@/components/app-header';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
