'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PawPrint, UserCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { ref, set, onValue, get } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import type { UserProfile } from '@/lib/types';

const profileFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  username: z.string().min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.').refine(val => val.startsWith('@'), { message: 'O nome de usuário deve começar com @.'}),
  email: z.string().email('Por favor, insira um email válido.'),
  image: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const initialLoadDone = useRef(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      image: null,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !initialLoadDone.current) {
        form.setValue('email', currentUser.email || '');
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists() && !initialLoadDone.current) {
            const data = snapshot.val() as UserProfile;
            form.reset({
              name: data.name || currentUser.displayName || '',
              username: data.username || '',
              email: currentUser.email || '',
            });
            if (data.avatarUrl) {
              setImagePreview(data.avatarUrl);
            }
            initialLoadDone.current = true;
          } else if (!snapshot.exists()) {
             form.setValue('name', currentUser.displayName || '');
             initialLoadDone.current = true;
          }
        }, { onlyOnce: true });
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
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const currentUserProfile = snapshot.val() as UserProfile;

      let newAvatarUrl = currentUserProfile?.avatarUrl ?? '';

      if (data.image && data.image[0]) {
        const imageFile = data.image[0];
        const imageStorageRef = storageRef(storage, `avatars/${user.uid}/${imageFile.name}`);
        const uploadResult = await uploadBytes(imageStorageRef, imageFile);
        newAvatarUrl = await getDownloadURL(uploadResult.ref);
      }

      await updateProfile(user, { 
        displayName: data.name,
        photoURL: newAvatarUrl
      });

      const updatedProfileData: UserProfile = {
        uid: user.uid,
        name: data.name,
        username: data.username,
        email: user.email!,
        avatarUrl: newAvatarUrl,
      };

      await set(ref(db, `users/${user.uid}`), updatedProfileData);
      
      setImagePreview(newAvatarUrl);
      
      toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        toast({
            variant: "destructive",
            title: "Falha ao atualizar",
            description: "Ocorreu um erro ao atualizar seu perfil. Tente novamente.",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('image', e.target.files);
    }
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
                name="image"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center gap-4 text-center">
                     <FormLabel>Foto de Perfil</FormLabel>
                    <Avatar className="h-24 w-24">
                       <AvatarImage src={imagePreview ?? undefined} alt="Foto de perfil do usuário" data-ai-hint="person avatar" />
                       <AvatarFallback><UserCircle className="h-full w-full text-muted-foreground"/></AvatarFallback>
                    </Avatar>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="max-w-xs"
                        onChange={handleImageChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
