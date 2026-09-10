// src/modules/challans/challans.schema.ts
import { z } from 'zod';

export const challanItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  notes: z.string().max(1000).optional().or(z.literal('')),
  items: z
    .array(challanItemSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => {
        const ids = items.map((i) => i.productId);
        return new Set(ids).size === ids.length;
      },
      { message: 'Duplicate products in challan. Please consolidate quantities.' }
    ),
});

export const cancelChallanSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type CancelChallanInput = z.infer<typeof cancelChallanSchema>;
