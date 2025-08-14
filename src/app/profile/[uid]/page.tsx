'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PawPrint, Edit } from 'lucide-react';
import { VerifiedBadge } from '@/components/verified-badge';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { uid } = params;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    if (uid) {
      const userRef = ref(db, `users/${uid}`);
      const unsubscribeProfile = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile({ uid: snapshot.key, ...snapshot.val() });
        } else {
          // Handle user not found
          console.error('User not found');
        }
        setLoading(false);
      });
       return () => {
         unsubscribeAuth();
         unsubscribeProfile();
       }
    }
  }, [uid]);

  const getInitials = (name: string | undefined) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <PawPrint className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Usuário não encontrado</h1>
          <p className="text-muted-foreground">O perfil que você está procurando não existe.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === uid;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="bg-muted h-48" />
          <div className="p-6 pb-0">
             <div className="flex justify-between items-start">
                <Avatar className="-mt-16 h-28 w-28 border-4 border-background bg-card">
                  <AvatarFallback className="text-4xl">
                    {getInitials(userProfile.name)}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button onClick={() => router.push('/dashboard/profile')}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Button>
                )}
             </div>
             <div className="mt-4">
                <div className="flex items-center gap-1">
                    <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                    {userProfile.username === '@Rulio' && <VerifiedBadge />}
                </div>
                <p className="text-md text-muted-foreground">{userProfile.username}</p>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">Em breve</h2>
                <p className="text-muted-foreground mt-2">Mais informações e atividades do usuário aparecerão aqui.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
