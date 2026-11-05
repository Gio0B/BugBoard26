import { z } from 'zod';
import { normalizedEmailSchema } from './authValidators.js';

const newPasswordSchema = z
  .string()
  .min(12, 'La password deve contenere almeno 12 caratteri.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'La password supera il limite supportato.',
  });

export const createUserBodySchema = z
  .object({
    email: normalizedEmailSchema,
    password: newPasswordSchema,
    role: z.enum(['ADMIN', 'USER'], {
      error: 'Il ruolo deve essere ADMIN oppure USER.',
    }),
  })
  .strict();
