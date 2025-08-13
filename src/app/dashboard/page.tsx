'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PetCard } from '@/components/pet-card';
import { PlusCircle } from 'lucide-react';
import type { Pet } from '@/lib/types';

const initialPets: Pet[] = [
  { id: '1', name: 'Buddy', species: 'Dog', age: 5, lastFed: '8:00 AM', imageUrl: 'https://placehold.co/400x300.png', healthStatus: 'Healthy' },
  { id: '2', name: 'Lucy', species: 'Cat', age: 3, lastFed: '8:30 AM', imageUrl: 'https://placehold.co/400x300.png', healthStatus: 'Monitor' },
  { id: '3', name: 'Rocky', species: 'Turtle', age: 15, lastFed: 'Yesterday', imageUrl: 'https://placehold.co/400x300.png', healthStatus: 'Healthy' },
];

export default function DashboardPage() {
  const [pets, setPets] = useState<Pet[]>(initialPets);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Your Pets</h1>
        <Button asChild>
          <Link href="/dashboard/add-pet">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Pet
          </Link>
        </Button>
      </div>

      {pets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No pets yet!</h2>
          <p className="text-muted-foreground mt-2">Get started by adding your first pet.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/add-pet">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Pet
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
