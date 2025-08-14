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
  username: string; // Adicionado para consistência
  likes?: { [key: string]: boolean };
  reposts?: { [key: string]: boolean };
  replies?: { [key: string]: boolean };
  replyCount?: number;
  parentId?: string | null;
  originalPost?: CommunityPost; // Para reposts
}

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
}
