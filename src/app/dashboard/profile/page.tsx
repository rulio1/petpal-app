'use client';

import { useState, useEffect } from 'react';
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
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { ref, set, get, update } from "firebase/database";
import type { UserProfile } from '@/lib/types';

const profileFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  username: z.string().min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.').refine(val => val.startsWith('@'), { message: 'O nome de usuário deve começar com @.'}),
  email: z.string().email('Por favor, insira um email válido.'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() as UserProfile;
            setUserProfile(data);
            form.reset({
              name: data.name || currentUser.displayName || '',
              username: data.username || '',
              email: currentUser.email || '',
            });
          } else {
            form.reset({
              name: currentUser.displayName || '',
              username: '',
              email: currentUser.email || '',
            });
          }
        });
      }
    });
    return () => unsubscribe();
  }, [form]);


  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
        toast({ variant: "destructive", title: "Erro", description: "Nenhum usuário autenticado."});
        return;
    }
    setIsSubmitting(true);
    
    try {
      // Update Firebase Auth display name
      if (user.displayName !== data.name) {
        await updateProfile(user, { 
          displayName: data.name,
        });
      }

      // Prepare data for Realtime Database update
      const updatedProfileData = {
        name: data.name,
        username: data.username,
      };

      // Update Realtime Database
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, updatedProfileData);
      
      // Update local state to reflect changes immediately
      setUserProfile(prevProfile => ({...prevProfile!, ...updatedProfileData}));
      
      toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        toast({
            variant: "destructive",
            title: "Falha ao atualizar",
            description: "Ocorreu um erro ao atualizar seu perfil. Verifique as regras do banco de dados e tente novamente.",
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
