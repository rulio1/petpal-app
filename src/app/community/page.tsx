
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CommunityPost, UserProfile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, PawPrint, Heart, Repeat, MessageSquare, Globe, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { ref, push, set, onValue, query, orderByChild, update, remove, get } from "firebase/database";
import { onAuthStateChanged, User } from 'firebase/auth';
import { VerifiedBadge } from '@/components/verified-badge';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const postSchema = z.object({
  content: z.string().min(1, 'A publicação não pode estar vazia.').max(500, 'A publicação não pode exceder 500 caracteres.'),
});

interface PostWithUser extends CommunityPost {
    authorProfile?: UserProfile;
}

export default function CommunityPage() {
  const [rawPosts, setRawPosts] = useState<CommunityPost[]>([]);
  const [users, setUsers] = useState<{ [key: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const { toast } = useToast();

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

    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      setUsers(snapshot.val() || {});
    });

    const postsRef = query(ref(db, 'posts'), orderByChild('timestamp'));
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const postList: CommunityPost[] = [];
      if (data) {
         Object.keys(data).forEach(key => {
            postList.push({ id: key, ...data[key] });
        });
        postList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRawPosts(postList);
      } else {
        setRawPosts([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed: " + error.message);
      toast({
          variant: "destructive",
          title: "Erro ao Carregar Posts",
          description: "Não foi possível carregar as publicações. Verifique as regras de segurança do seu banco de dados para permitir leitura pública em 'posts'.",
      });
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, [toast]);
  
  const posts: PostWithUser[] = useMemo(() => {
    return rawPosts.map(post => ({
        ...post,
        authorProfile: users[post.userId]
    }));
  }, [rawPosts, users]);

  const form = useForm<{ content: string }>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: { content: string }) => {
     if (!user || !userProfile) {
      toast({
          variant: 'destructive',
          title: 'Não autenticado',
          description: 'Você precisa fazer login para publicar.',
      });
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
        toast({
            variant: 'destructive',
            title: 'Erro ao Publicar',
            description: 'Não foi possível salvar a publicação. Tente novamente.',
        });
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
  
  const handleDeletePost = async (postId: string) => {
    try {
        await remove(ref(db, `posts/${postId}`));
        toast({ title: "Publicação excluída com sucesso!" });
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível excluir a publicação." });
    }
  };

  const handleOpenEditDialog = (post: CommunityPost) => {
    setEditingPost(post);
    setEditedContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
        const postRef = ref(db, `posts/${editingPost.id}/content`);
        await set(postRef, editedContent);
        setEditingPost(null);
        setEditedContent('');
        toast({ title: "Publicação atualizada com sucesso!" });
    } catch (error) {
        console.error("Error updating post:", error);
        toast({ variant: "destructive", title: "Erro ao editar", description: "Não foi possível salvar as alterações." });
    }
  };


  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  }

  return (
    <>
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
                          <AvatarFallback>{getInitials(post.authorProfile?.name)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {post.authorProfile ? (
                            <Link href={`/profile/${post.userId}`} className="flex items-center hover:underline">
                                <p className="font-semibold text-primary">{post.authorProfile.name}</p>
                                {post.authorProfile.username === '@Rulio' && <VerifiedBadge />}
                                <p className="text-sm text-muted-foreground ml-2">{post.authorProfile.username}</p>
                            </Link>
                            ) : (
                                 <p className="font-semibold text-primary">{post.author || 'Usuário anônimo'}</p>
                            )}
                            <div className="flex items-center gap-2 ml-4">
                                <Globe className="w-3 h-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: ptBR })}
                                </p>
                            </div>
                          </div>
                          {user && user.uid === post.userId && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(post)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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

    {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Publicação</DialogTitle>
                    <DialogDescription>
                        Faça alterações na sua publicação e salve.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={5}
                        className="w-full"
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveEdit}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    </>
  );
}

    