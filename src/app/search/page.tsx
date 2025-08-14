'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PawPrint, Search as SearchIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { UserProfile } from '@/lib/types';
import { VerifiedBadge } from '@/components/verified-badge';


export default function SearchPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const userList: UserProfile[] = [];
      if (data) {
        for (const key in data) {
          userList.push({ uid: key, ...data[key] });
        }
      }
      setUsers(userList);
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed: " + error.message);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [users, searchTerm]);
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  }


  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold font-headline mb-4">Encontrar Membros da Comunidade</h1>
        <div className="w-full max-w-lg relative">
           <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome ou nome de usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <PawPrint className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredUsers.map(user => (
            <Link href={`/profile/${user.uid}`} key={user.uid}>
              <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-center">
                      <h3 className="text-lg font-semibold text-primary">{user.name}</h3>
                      {user.username === '@rulio' && <VerifiedBadge />}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.username}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
       { !loading && filteredUsers.length === 0 && (
         <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">Nenhum usuário encontrado</h2>
            <p className="text-muted-foreground mt-2">Tente um termo de busca diferente.</p>
         </div>
       )}
    </div>
  );
}
