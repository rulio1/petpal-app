'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing pet health suggestions based on a pet's description and health status.
 *
 * - `getPetHealthSuggestions` -  A function that takes pet information and returns AI-powered health suggestions.
 * - `PetHealthSuggestionsInput` - The input type for the `getPetHealthSuggestions` function.
 * - `PetHealthSuggestionsOutput` - The return type for the `getPetHealthSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PetHealthSuggestionsInputSchema = z.object({
  description: z.string().describe('A detailed description of the pet, including its behavior, diet, and environment.'),
  healthStatus: z.string().describe('The current health status of the pet, including any symptoms or known conditions.'),
});

export type PetHealthSuggestionsInput = z.infer<typeof PetHealthSuggestionsInputSchema>;

const PetHealthSuggestionsOutputSchema = z.object({
  suggestions: z.string().describe('AI-powered suggestions of potential health concerns to discuss with a veterinarian.'),
});

export type PetHealthSuggestionsOutput = z.infer<typeof PetHealthSuggestionsOutputSchema>;

export async function getPetHealthSuggestions(input: PetHealthSuggestionsInput): Promise<PetHealthSuggestionsOutput> {
  return petHealthSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'petHealthSuggestionsPrompt',
  input: {schema: PetHealthSuggestionsInputSchema},
  output: {schema: PetHealthSuggestionsOutputSchema},
  prompt: `You are an AI assistant that provides potential health concerns for pets based on their description and health status.

  Description: {{{description}}}
  Health Status: {{{healthStatus}}}

  Based on the provided information, suggest potential health concerns that the user should discuss with their veterinarian.`,
});

const petHealthSuggestionsFlow = ai.defineFlow(
  {
    name: 'petHealthSuggestionsFlow',
    inputSchema: PetHealthSuggestionsInputSchema,
    outputSchema: PetHealthSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
