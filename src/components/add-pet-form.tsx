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
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getPetHealthSuggestions } from '@/ai/flows/pet-health-suggestions';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const petFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  species: z.enum(['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Turtle', 'Other']),
  age: z.coerce.number().min(0, 'A idade deve ser um número positivo.'),
  lastFed: z.string().min(1, 'A última alimentação é obrigatória.'),
  height: z.coerce.number().min(0, 'A altura deve ser um número positivo.'),
  weight: z.coerce.number().min(0, 'O peso deve ser um número positivo.'),
  length: z.coerce.number().min(0, 'O comprimento deve ser um número positivo.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  healthStatus: z.string().min(1, 'O estado de saúde é obrigatório.'),
  image: z.any().refine((files) => files?.length == 1, "A imagem é obrigatória."),
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
        title: "Informação Faltando",
        description: "Por favor, preencha a descrição e o estado de saúde para obter sugestões da IA.",
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
        title: "Falha na Sugestão da IA",
        description: "Não foi possível obter sugestões de saúde no momento. Por favor, tente novamente mais tarde.",
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
        title: 'Pet Adicionado!',
        description: `${data.name} foi adicionado com sucesso ao seu painel.`,
      });
      router.push('/dashboard');
    } catch (error) {
        console.error("Erro ao adicionar pet:", error);
        toast({
            variant: "destructive",
            title: "Falha ao adicionar pet",
            description: "Ocorreu um erro ao adicionar o pet. Por favor, tente novamente.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Adicionar um Novo Pet</CardTitle>
        <CardDescription>Preencha os detalhes do seu novo companheiro.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto do Pet</FormLabel>
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
                    <FormLabel>Nome</FormLabel>
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
                    <FormLabel>Espécie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma espécie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Dog">Cachorro</SelectItem>
                        <SelectItem value="Cat">Gato</SelectItem>
                        <SelectItem value="Bird">Pássaro</SelectItem>
                        <SelectItem value="Fish">Peixe</SelectItem>
                        <SelectItem value="Rabbit">Coelho</SelectItem>
                        <SelectItem value="Turtle">Tartaruga</SelectItem>
                        <SelectItem value="Other">Outro</SelectItem>
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
                    <FormLabel>Idade (anos)</FormLabel>
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
                    <FormLabel>Última Alimentação</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: 08:00" {...field} />
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
                    <FormLabel>Altura (cm)</FormLabel>
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
                    <FormLabel>Peso (kg)</FormLabel>
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
                    <FormLabel>Comprimento (cm)</FormLabel>
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
                    <FormLabel>Estado de Saúde</FormLabel>
                    <FormControl>
                      <Input placeholder="Saudável, brincalhão, etc." {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o comportamento, dieta e ambiente do seu pet..."
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
                Obter Sugestões de Saúde com IA
              </Button>

              {isAiLoading && <p className="text-sm text-muted-foreground text-center">A IA está pensando...</p>}

              {aiSuggestion && (
                <Alert className="bg-secondary">
                  <Wand2 className="h-4 w-4" />
                  <AlertTitle>Sugestões de Saúde da IA</AlertTitle>
                  <AlertDescription>
                    {aiSuggestion}
                    <br/><br/>
                    <em className="text-xs text-muted-foreground">Aviso: Esta é uma sugestão da IA. Sempre consulte um veterinário profissional para aconselhamento médico.</em>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-6">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Pet
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
