// src/modules/inventory/inventory.schema.ts
import { z } from 'zod';

export const createMovementSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().min(1, 'Reason is required').max(255),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
