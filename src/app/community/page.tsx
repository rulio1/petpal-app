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
import { Send } from 'lucide-react';

const postSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty.').max(500, 'Post cannot exceed 500 characters.'),
});

// Mock user
const currentUser = {
  name: 'You',
  avatarUrl: 'https://placehold.co/40x40.png',
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem('community-posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
    } catch (error) {
      console.error("Could not load posts from localStorage", error);
    }
  }, []);

  const form = useForm<{ content: string }>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = (data: { content: string }) => {
    const newPost: CommunityPost = {
      id: new Date().toISOString(),
      author: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      timestamp: new Date().toISOString(),
      content: data.content,
    };
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    try {
        localStorage.setItem('community-posts', JSON.stringify(updatedPosts));
    } catch (error) {
        console.error("Could not save posts to localStorage", error);
    }
    form.reset();
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Community Forum</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ScrollArea className="h-[65vh] pr-4 -mr-4">
            <div className="space-y-6">
              {posts.length > 0 ? (
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
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex flex-col justify-center items-center">
                  <h2 className="text-xl font-semibold">The forum is quiet...</h2>
                  <p className="text-muted-foreground mt-2">Be the first to share something!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Share your thoughts</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="What's on your mind? Share tips, stories, or ask questions..."
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
                    <Send className="mr-2 h-4 w-4" />
                    Post to Community
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
