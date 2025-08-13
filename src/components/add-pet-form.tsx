'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getPetHealthSuggestions } from '@/ai/flows/pet-health-suggestions';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const petFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  species: z.enum(['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Turtle', 'Other']),
  age: z.coerce.number().min(0, 'Age must be a positive number.'),
  lastFed: z.string().min(1, 'Last feeding time is required.'),
  height: z.coerce.number().min(0, 'Height must be a positive number.'),
  weight: z.coerce.number().min(0, 'Weight must be a positive number.'),
  length: z.coerce.number().min(0, 'Length must be a positive number.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  healthStatus: z.string().min(1, 'Health status is required.'),
  image: z.any().refine((files) => files?.length == 1, "Image is required."),
});

type PetFormValues = z.infer<typeof petFormSchema>;

export function AddPetForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: '',
      age: 0,
      lastFed: '',
      height: 0,
      weight: 0,
      length: 0,
      description: '',
      healthStatus: '',
    },
  });
  
  const imageRef = form.register("image");

  const handleGetHealthSuggestion = async () => {
    const description = form.getValues('description');
    const healthStatus = form.getValues('healthStatus');

    if (!description || !healthStatus) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out the description and health status to get AI suggestions.",
      });
      return;
    }
    
    setIsAiLoading(true);
    setAiSuggestion(null);

    try {
      const result = await getPetHealthSuggestions({ description, healthStatus });
      setAiSuggestion(result.suggestions);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get health suggestions at this time. Please try again later.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  async function onSubmit(data: PetFormValues) {
    setIsSubmitting(true);
    try {
      const imageFile = data.image[0];
      const imageStorageRef = storageRef(storage, `pets/${new Date().getTime()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageStorageRef, imageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);

      const newPetRef = push(dbRef(db, 'pets'));
      await set(newPetRef, {
        name: data.name,
        species: data.species,
        age: data.age,
        lastFed: data.lastFed,
        height: data.height,
        weight: data.weight,
        length: data.length,
        description: data.description,
        healthStatus: data.healthStatus,
        imageUrl: imageUrl,
      });

      toast({
        title: 'Pet Added!',
        description: `${data.name} has been successfully added to your dashboard.`,
      });
      router.push('/dashboard');
    } catch (error) {
        console.error("Error adding pet:", error);
        toast({
            variant: "destructive",
            title: "Failed to add pet",
            description: "An error occurred while adding the pet. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add a New Pet</CardTitle>
        <CardDescription>Fill in the details for your new companion.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet Photo</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Input id="image" type="file" accept="image/*" {...imageRef} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Buddy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a species" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Turtle', 'Other'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (years)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastFed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Feeding</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 8:00 AM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="55" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="90" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="healthStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Health Status</FormLabel>
                    <FormControl>
                      <Input placeholder="Healthy, playful, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your pet's behavior, diet, and environment..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-4">
              <Button type="button" variant="outline" onClick={handleGetHealthSuggestion} disabled={isAiLoading} className="w-full md:w-auto">
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Get AI Health Suggestions
              </Button>

              {isAiLoading && <p className="text-sm text-muted-foreground text-center">AI is thinking...</p>}

              {aiSuggestion && (
                <Alert className="bg-secondary">
                  <Wand2 className="h-4 w-4" />
                  <AlertTitle>AI Health Suggestions</AlertTitle>
                  <AlertDescription>
                    {aiSuggestion}
                    <br/><br/>
                    <em className="text-xs text-muted-foreground">Disclaimer: This is an AI suggestion. Always consult a professional veterinarian for medical advice.</em>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-6">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Pet
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
