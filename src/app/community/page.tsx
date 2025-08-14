'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CommunityPost, UserProfile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, PawPrint, Heart, Repeat, MessageSquare, Globe } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { ref, push, set, onValue, query, orderByChild, get, update } from "firebase/database";
import { onAuthStateChanged, User } from 'firebase/auth';
import { VerifiedBadge } from '@/components/verified-badge';
import Link from 'next/link';

const postSchema = z.object({
  content: z.string().min(1, 'A publicação não pode estar vazia.').max(500, 'A publicação não pode exceder 500 caracteres.'),
});

interface PostWithUser extends CommunityPost {
    username?: string;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
       if (currentUser) {
        const userRef = ref(db, 'users/' + currentUser.uid);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.val());
          }
        });
      } else {
        setUserProfile(null);
      }
    });

    const postsRef = query(ref(db, 'posts'), orderByChild('timestamp'));
    const unsubscribePosts = onValue(postsRef, async (snapshot) => {
      const data = snapshot.val();
      const postList: PostWithUser[] = [];
      if (data) {
        const postPromises = Object.keys(data).map(async (key) => {
          const post = { id: key, ...data[key] };
          if (post.userId) {
            const userRef = ref(db, 'users/' + post.userId);
            const userSnap = await get(userRef);
            if (userSnap.exists()) {
                post.username = userSnap.val().username;
            }
          }
          return post;
        });
        const resolvedPosts = await Promise.all(postPromises);
        resolvedPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setPosts(resolvedPosts);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed: " + error.message);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const form = useForm<{ content: string }>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: { content: string }) => {
     if (!user || !userProfile) {
      console.error("User not logged in or profile not loaded");
      return;
    }
    try {
      const newPostRef = push(ref(db, 'posts'));
      const newPost: Omit<CommunityPost, 'id'> = {
        author: userProfile.name,
        username: userProfile.username,
        timestamp: new Date().toISOString(),
        content: data.content,
        userId: user.uid,
        likes: {},
        reposts: {},
        replies: {},
        replyCount: 0,
      };
      await set(newPostRef, newPost);
      form.reset();
    } catch (error) {
        console.error("Could not save post to Firebase", error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const postRef = ref(db, `posts/${postId}/likes/${user.uid}`);
    const postLikeSnap = await get(postRef);
    const updates: { [key: string]: any } = {};

    if (postLikeSnap.exists()) {
      updates[`/posts/${postId}/likes/${user.uid}`] = null;
    } else {
      updates[`/posts/${postId}/likes/${user.uid}`] = true;
    }
    await update(ref(db), updates);
  };

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Fórum da Comunidade</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ScrollArea className="h-[calc(100vh-250px)] pr-4 -mr-4">
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <PawPrint className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id} className="p-4 bg-card/80">
                    <div className="flex items-start space-x-4">
                      <Link href={`/profile/${post.userId}`}>
                        <Avatar>
                          <AvatarFallback>{getInitials(post.author)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Link href={`/profile/${post.userId}`} className="flex items-center hover:underline">
                            <p className="font-semibold text-primary">{post.author}</p>
                            {post.username === '@Rulio' && <VerifiedBadge />}
                            <p className="text-sm text-muted-foreground ml-2">{post.username}</p>
                          </Link>
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
                        <div className="flex items-center gap-6 text-muted-foreground mt-4">
                            <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 group disabled:opacity-50" disabled={!user}>
                                <Heart className={`w-4 h-4 group-hover:text-red-500 ${post.likes && user && post.likes[user.uid] ? 'text-red-500 fill-current' : ''}`} />
                                <span className="text-xs">{post.likes ? Object.keys(post.likes).length : 0}</span>
                            </button>
                            <button className="flex items-center gap-1 group disabled:opacity-50" disabled={!user}>
                                <MessageSquare className="w-4 h-4 group-hover:text-primary" />
                                <span className="text-xs">{post.replyCount || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 group disabled:opacity-50" disabled={!user}>
                                <Repeat className="w-4 h-4 group-hover:text-green-500" />
                                <span className="text-xs">{post.reposts ? Object.keys(post.reposts).length : 0}</span>
                            </button>
                        </div>
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
                            placeholder={user ? "O que você está pensando? Compartilhe dicas, histórias ou faça perguntas..." : "Faça login para compartilhar suas ideias."}
                            className="resize-none"
                            rows={5}
                            {...field}
                            disabled={!user}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !user}>
                    {form.formState.isSubmitting ? (
                      <PawPrint className="mr-2 h-4 w-4 animate-spin" />
                    ) : user ? (
                      <Send className="mr-2 h-4 w-4" />
                    ) : null}
                    {user ? 'Publicar na Comunidade' : 'Faça login para publicar'}
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
