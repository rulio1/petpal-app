'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PetCard } from '@/components/pet-card';
import { PlusCircle, Loader2 } from 'lucide-react';
import type { Pet } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";

export default function DashboardPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const petsRef = ref(db, 'pets');
    const unsubscribe = onValue(petsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const petList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setPets(petList);
      } else {
        setPets([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pets.length > 0 ? (
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
