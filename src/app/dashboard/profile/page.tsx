'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PawPrint } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, get, update } from "firebase/database";
import type { UserProfile } from '@/lib/types';

const profileFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  username: z.string().min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.').refine(val => val.startsWith('@'), { message: 'O nome de usuário deve começar com @.'}),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      username: '',
    },
  });
  
  const loadUserData = useCallback((currentUser: User) => {
    setIsLoading(true);
    const userRef = ref(db, `users/${currentUser.uid}`);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        form.reset({
          name: data.name || currentUser.displayName || '',
          username: data.username || '',
        });
      } else {
        form.reset({
          name: currentUser.displayName || '',
          username: '',
        });
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [form]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadUserData(currentUser);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loadUserData]);


  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
        toast({ variant: "destructive", title: "Erro", description: "Nenhum usuário autenticado."});
        return;
    }
    setIsSubmitting(true);
    
    try {
      const updates: { [key: string]: any } = {};
      updates[`/users/${user.uid}/name`] = data.name;
      updates[`/users/${user.uid}/username`] = data.username;
      
      await update(ref(db), updates);
      
      toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });

    } catch (error: any) {
        console.error("Erro ao atualizar perfil:", error);
        toast({
            variant: "destructive",
            title: "Falha ao atualizar",
            description: `Ocorreu um erro ao atualizar seu perfil. Verifique as regras do banco de dados e tente novamente.`,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value && !value.startsWith('@')) {
      value = '@' + value.replace(/@/g, '');
    } else if (!value) {
      value = '@'
    }
    form.setValue('username', value, { shouldValidate: true });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
            <PawPrint className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Seu Perfil</CardTitle>
          <CardDescription>Veja e edite suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu Nome Completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="@seunome" {...field} onChange={handleUsernameChange}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seu@email.com" value={user?.email || ''} disabled />
                </FormControl>
              </FormItem>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <PawPrint className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
