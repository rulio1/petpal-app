'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PawPrint } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Falha no login:", error);
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: "Ocorreu um erro. Verifique seu e-mail e senha e tente novamente.",
      });
    } finally {
      setIsLoading(false);
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
            <CardTitle className="text-3xl font-headline">Bem-vindo ao PetPal</CardTitle>
            <CardDescription>Faça login para gerenciar seus amigos peludos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                Entrar
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{' '}
              <Link href="/signup" className="underline text-primary">
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
