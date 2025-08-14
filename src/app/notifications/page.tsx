'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';
import type { Notification } from '@/lib/types';
import { Bell, UserPlus, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const notificationsRef = ref(db, `notifications/${user.uid}`);
        const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
          const data = snapshot.val();
          const notificationList: Notification[] = [];
          if (data) {
            Object.keys(data).forEach(key => {
              notificationList.push({ id: key, ...data[key] });
            });
            // Sort by most recent
            notificationList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          }
          setNotifications(notificationList);
          setLoading(false);
        });
        return () => unsubscribeNotifications();
      } else {
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const markAsRead = async (notificationId: string) => {
    if (!currentUser) return;
    const updates: { [key: string]: any } = {};
    updates[`/notifications/${currentUser.uid}/${notificationId}/read`] = true;
    await update(ref(db), updates);
  };
  
  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
        case 'follow':
            return `/profile/${notification.fromUserId}`;
        case 'like':
        case 'reply':
            // This would ideally link to the specific post, which requires more complex state management
            // For now, we can link to the community page or the user's profile.
            return `/community`; 
        default:
            return '#';
    }
  }


  const renderNotification = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return (
          <>
            <UserPlus className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <p>
                <Link href={`/profile/${notification.fromUserId}`} className="font-bold hover:underline" onClick={(e) => e.stopPropagation()}>{notification.fromUserName}</Link>
                {' '} começou a seguir você.
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </>
        );
      case 'like':
        return (
           <>
            <Heart className="h-6 w-6 text-red-500" />
            <div className="flex-1">
              <p>
                <Link href={`/profile/${notification.fromUserId}`} className="font-bold hover:underline" onClick={(e) => e.stopPropagation()}>{notification.fromUserName}</Link>
                {' '} curtiu sua publicação.
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Notificações</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
           <Bell className="h-12 w-12 text-muted-foreground animate-pulse" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Link href={getNotificationLink(notification)} key={notification.id} passHref>
                <Card 
                    className={`p-4 transition-colors cursor-pointer hover:bg-muted/80 ${notification.read ? 'bg-card' : 'bg-secondary'}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                >
                    <CardContent className="flex items-center gap-4 p-0">
                        {renderNotification(notification)}
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <div className="flex justify-center mb-4">
            <Bell className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Nenhuma notificação nova</h2>
          <p className="text-muted-foreground mt-2">Você será notificado aqui sobre atividades importantes.</p>
        </div>
      )}
    </div>
  );
}
