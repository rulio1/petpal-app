'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PawPrint } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from "firebase/database";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('@');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: name });
      
      // Save user info to Realtime Database
      await set(ref(db, 'users/' + user.uid), {
        username: username,
        email: user.email,
        name: name,
        uid: user.uid,
        avatarUrl: '',
      });

      toast({
        title: "Conta Criada",
        description: "Sua conta foi criada com sucesso.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Falha no cadastro:", error);
      let description = "Ocorreu um erro inesperado. Por favor, tente novamente.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Este e-mail já está em uso por outra conta.";
      } else if (error.code === 'auth/weak-password') {
        description = "A senha é muito fraca. Por favor, escolha uma senha mais forte.";
      }
      toast({
        variant: "destructive",
        title: "Falha no Cadastro",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.startsWith('@')) {
      setUsername('@' + value.replace(/@/g, ''));
    } else {
      setUsername(value);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <main className="w-full max-w-md mx-auto">
        <Card className="w-full animate-fade-in">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <PawPrint className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Crie sua Conta PetPal</CardTitle>
            <CardDescription>Junte-se à nossa comunidade de amantes de pets.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" type="text" placeholder="Seu Nome" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input id="username" type="text" placeholder="@seunome" required value={username} onChange={handleUsernameChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="voce@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <PawPrint className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Já tem uma conta?{' '}
              <Link href="/" className="underline text-primary">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
