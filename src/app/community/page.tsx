'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CommunityPost } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, PawPrint } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, push, set, onValue, query, orderByChild } from "firebase/database";

const postSchema = z.object({
  content: z.string().min(1, 'A publicação não pode estar vazia.').max(500, 'A publicação não pode exceder 500 caracteres.'),
});

// Mock user
const currentUser = {
  name: 'Você',
  avatarUrl: 'https://placehold.co/40x40.png',
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = query(ref(db, 'posts'), orderByChild('timestamp'));
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postList: CommunityPost[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setPosts(postList);
      } else {
        setPosts([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const form = useForm<{ content: string }>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: { content: string }) => {
    try {
      const newPostRef = push(ref(db, 'posts'));
      const newPost: Omit<CommunityPost, 'id'> = {
        author: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        timestamp: new Date().toISOString(),
        content: data.content,
      };
      await set(newPostRef, newPost);
      form.reset();
    } catch (error) {
        console.error("Could not save post to Firebase", error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Fórum da Comunidade</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ScrollArea className="h-[65vh] pr-4 -mr-4">
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <PawPrint className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id} className="p-4 bg-card/80">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={post.avatarUrl} alt={post.author} data-ai-hint="person avatar"/>
                        <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-primary">{post.author}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex flex-col justify-center items-center">
                  <h2 className="text-xl font-semibold">O fórum está silencioso...</h2>
                  <p className="text-muted-foreground mt-2">Seja o primeiro a compartilhar algo!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Compartilhe suas ideias</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="O que você está pensando? Compartilhe dicas, histórias ou faça perguntas..."
                            className="resize-none"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <PawPrint className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Publicar na Comunidade
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
