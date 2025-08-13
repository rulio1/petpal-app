export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Rabbit' | 'Turtle' | 'Other';
  age: number;
  lastFed: string;
  imageUrl: string;
  healthStatus: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatarUrl: string;
  timestamp: string;
  content: string;
}
