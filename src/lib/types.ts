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
  avatarUrl: string;
  timestamp: string;
  content: string;
}
