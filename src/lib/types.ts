export type Species = 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Rabbit' | 'Turtle' | 'Other';

export interface Pet {
  id: string;
  name: string;
  species: Species;
  age: number;
  lastFed: string;
  imageUrl: string;
  healthStatus: string;
  description: string;
  height: number;
  weight: number;
  length: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  userId: string;
  username: string; 
  likes?: { [key: string]: boolean };
  reposts?: { [key: string]: boolean };
  replies?: { [key: string]: boolean };
  replyCount?: number;
  parentId?: string | null;
  originalPost?: CommunityPost; 
}

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  followers?: { [key: string]: boolean };
  following?: { [key: string]: boolean };
  followerCount?: number;
  followingCount?: number;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'reply';
  fromUserId: string;
  fromUserName: string;
  fromUserUsername?: string;
  timestamp: string;
  read: boolean;
  postId?: string; 
}
