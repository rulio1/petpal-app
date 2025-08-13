import type { Pet } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dog, Cat, Bird, Fish, Rabbit, Turtle, PawPrint } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const speciesIcons: { [key: string]: React.ComponentType<LucideProps> } = {
  Dog: Dog,
  Cat: Cat,
  Bird: Bird,
  Fish: Fish,
  Rabbit: Rabbit,
  Turtle: Turtle,
  Other: PawPrint,
};

const speciesLabels: { [key: string]: string } = {
  Dog: 'Cachorro',
  Cat: 'Gato',
  Bird: 'Pássaro',
  Fish: 'Peixe',
  Rabbit: 'Coelho',
  Turtle: 'Tartaruga',
  Other: 'Outro',
};

export function PetCard({ pet }: { pet: Pet }) {
  const Icon = speciesIcons[pet.species] || PawPrint;
  const speciesLabel = speciesLabels[pet.species] || 'Pet';
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium font-headline">{pet.name}</CardTitle>
        <Icon className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md mb-4">
          <Image
            src={pet.imageUrl}
            alt={`Foto de ${pet.name}`}
            fill
            className="object-cover"
            data-ai-hint={`${speciesLabel.toLowerCase()}`}
          />
        </div>
        <CardDescription>{pet.age} anos de idade</CardDescription>
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <span>Última vez alimentado: {pet.lastFed}</span>
          <Badge variant={pet.healthStatus.toLowerCase() === 'healthy' || pet.healthStatus.toLowerCase() === 'saudável' ? 'secondary' : 'destructive'}>{pet.healthStatus}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
