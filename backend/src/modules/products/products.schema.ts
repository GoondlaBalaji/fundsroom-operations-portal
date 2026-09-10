// src/modules/products/products.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(150),
  sku: z.string().min(1, 'SKU is required').max(50),
  category: z.string().min(1, 'Category is required').max(100),
  unitPrice: z.number({ invalid_type_error: 'Unit price must be a number' }).min(0, 'Unit price cannot be negative'),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minStockAlert: z.number().int().min(0, 'Min stock alert cannot be negative').default(0),
  warehouseLocation: z.string().max(100).optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.omit({ stock: true }).partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
