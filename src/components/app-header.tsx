'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Users, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/community', label: 'Community', icon: Users },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
          <PawPrint className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline hidden sm:inline-block">PetPal</span>
        </Link>
        <nav className="flex items-center space-x-4 lg:space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary flex items-center gap-2',
                pathname.startsWith(link.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <link.icon className="h-5 w-5 md:hidden" />
              <span className="hidden md:inline-block">{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/">Logout</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
