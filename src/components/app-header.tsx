'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Users, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { UserProfile } from '@/lib/types';


const navLinks = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/community', label: 'Comunidade', icon: Users },
];

export function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = ref(db, 'users/' + currentUser.uid);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserProfile(data);
          }
        });
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };
  
  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  }


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
           {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(userProfile?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-2 text-center leading-none">
                  <p className="text-sm font-medium">{userProfile?.name}</p>
                   <p className="text-xs text-muted-foreground">{userProfile?.username}</p>
                </div>
                <Separator className="my-2" />
                <div className="flex flex-col space-y-1">
                  <Button variant="ghost" size="sm" className="justify-start" asChild>
                     <Link href="/dashboard/profile">Meu Perfil</Link>
                  </Button>
                   <Button variant="ghost" size="sm" className="justify-start" onClick={handleSignOut} asChild>
                    <Link href="/">Sair</Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
}
