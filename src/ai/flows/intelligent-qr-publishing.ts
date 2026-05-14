'use server';

/**
 * @fileOverview An AI agent that determines the optimal way to distribute QR codes to users.
 *
 * - intelligentQrPublishing - A function that handles the QR code distribution process.
 * - IntelligentQrPublishingInput - The input type for the intelligentQrPublishing function.
 * - IntelligentQrPublishingOutput - The return type for the intelligentQrPublishing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentQrPublishingInputSchema = z.object({
  userName: z.string().describe('The name of the user.'),
  userId: z.string().describe('The ID of the user.'),
  eventId: z.string().describe('The ID of the event.'),
  secretKey: z.string().describe('A secret key for QR code generation.'),
  email: z.string().optional().describe('The email address of the user.'),
  phoneNumber: z.string().optional().describe('The phone number of the user.'),
  whatsappNumber: z
    .string()
    .optional()
    .describe('The WhatsApp number of the user.'),
});
export type IntelligentQrPublishingInput = z.infer<
  typeof IntelligentQrPublishingInputSchema
>;

const IntelligentQrPublishingOutputSchema = z.object({
  deliveryMethod: z
    .enum(['email', 'sms', 'whatsapp'])
    .describe('The recommended delivery method for the QR code.'),
  message: z.string().describe('The message to be sent to the user.'),
});
export type IntelligentQrPublishingOutput = z.infer<
  typeof IntelligentQrPublishingOutputSchema
>;

export async function intelligentQrPublishing(
  input: IntelligentQrPublishingInput
): Promise<IntelligentQrPublishingOutput> {
  return intelligentQrPublishingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentQrPublishingPrompt',
  input: {schema: IntelligentQrPublishingInputSchema},
  output: {schema: IntelligentQrPublishingOutputSchema},
  prompt: `You are an expert in determining the best way to deliver a QR code to a user for event entry.

  Given the following user information, determine the optimal delivery method (email, SMS, or WhatsApp) and craft a message to be sent to the user.

  Consider the availability of contact information and prioritize methods that are most likely to ensure timely delivery.

  User Name: {{{userName}}}
  User ID: {{{userId}}}
  Event ID: {{{eventId}}}
  Secret Key: {{{secretKey}}}
  Email: {{{email}}}
  Phone Number: {{{phoneNumber}}}
  WhatsApp Number: {{{whatsappNumber}}}

  Instructions:
  1.  Examine the provided user data, to see which communication channels are available.
  2.  If WhatsApp number is available, recommend WhatsApp as the primary delivery method.
  3.  If WhatsApp is unavailable but phone number is available, recommend SMS as the delivery method.
  4.  If only email is available, recommend email as the delivery method.
  5.  Craft a personalized message to the user, informing them of their QR code and how to use it for event entry.
`,
});

const intelligentQrPublishingFlow = ai.defineFlow(
  {
    name: 'intelligentQrPublishingFlow',
    inputSchema: IntelligentQrPublishingInputSchema,
    outputSchema: IntelligentQrPublishingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
