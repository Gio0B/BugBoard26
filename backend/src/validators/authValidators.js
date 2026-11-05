import { z } from 'zod';

export const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(320)
  .pipe(z.email('Inserisci un indirizzo email valido.'));

export const bcryptCompatiblePasswordSchema = z
  .string()
  .min(1, 'La password è obbligatoria.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'La password supera il limite supportato.',
  });

export const loginBodySchema = z
  .object({
    email: normalizedEmailSchema,
    password: bcryptCompatiblePasswordSchema,
  })
  .strict();
