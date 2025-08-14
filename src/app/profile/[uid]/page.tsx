'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';
import type { UserProfile, CommunityPost, Pet } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PawPrint, Edit, Heart, MessageSquare, Repeat } from 'lucide-react';
import { VerifiedBadge } from '@/components/verified-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PetCard } from '@/components/pet-card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { uid } = params;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [replies, setReplies] = useState<CommunityPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<CommunityPost[]>([]);
  const [userPets, setUserPets] = useState<Pet[]>([]);


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
          console.error('User not found');
        }
        setLoading(false);
      });

      const postsQuery = query(ref(db, 'posts'), orderByChild('userId'), equalTo(uid as string));
        onValue(postsQuery, (snapshot) => {
            const userPosts: CommunityPost[] = [];
            const userReplies: CommunityPost[] = [];
            snapshot.forEach(childSnapshot => {
                const post = { id: childSnapshot.key, ...childSnapshot.val() };
                if (post.parentId) {
                    userReplies.push(post);
                } else {
                    userPosts.push(post);
                }
            });
            setPosts(userPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setReplies(userReplies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        });

      const allPostsRef = ref(db, 'posts');
        onValue(allPostsRef, (snapshot) => {
            const allPosts: CommunityPost[] = [];
             snapshot.forEach(childSnapshot => {
                allPosts.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            const userLikedPosts = allPosts.filter(post => post.likes && post.likes[uid as string]);
            setLikedPosts(userLikedPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
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
  
  const PostList = ({ postsToShow }: { postsToShow: CommunityPost[] }) => (
    <div className="space-y-4 mt-4">
        {postsToShow.length > 0 ? postsToShow.map(post => (
            <Card key={post.id} className="p-4">
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
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
                        <div className="flex items-center gap-6 text-muted-foreground mt-4">
                            <div className="flex items-center gap-1 group">
                                <Heart className={`w-4 h-4 ${post.likes && currentUser && post.likes[currentUser.uid] ? 'text-red-500 fill-current' : ''}`} />
                                <span className="text-xs">{post.likes ? Object.keys(post.likes).length : 0}</span>
                            </div>
                            <div className="flex items-center gap-1 group">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-xs">{post.replyCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 group">
                                <Repeat className="w-4 h-4" />
                                <span className="text-xs">{post.reposts ? Object.keys(post.reposts).length : 0}</span>
                            </div>
                        </div>
                      </div>
                    </div>
            </Card>
        )) : <p className="text-center text-muted-foreground py-8">Nenhuma atividade para mostrar.</p>}
    </div>
);


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
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="posts">Postagens</TabsTrigger>
                <TabsTrigger value="replies">Respostas</TabsTrigger>
                <TabsTrigger value="media">Mídia</TabsTrigger>
                <TabsTrigger value="likes">Curtidas</TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                <PostList postsToShow={posts} />
              </TabsContent>
              <TabsContent value="replies">
                <PostList postsToShow={replies} />
              </TabsContent>
              <TabsContent value="media">
                <div className="text-center text-muted-foreground py-8">
                  <p>Quando você postar fotos ou vídeos, eles aparecerão aqui.</p>
                </div>
              </TabsContent>
              <TabsContent value="likes">
                <PostList postsToShow={likedPosts} />
              </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
