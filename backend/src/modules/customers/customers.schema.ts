// src/modules/customers/customers.schema.ts
import { z } from 'zod';
import { CustomerStatus, CustomerType } from '../../types/enums';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100),
  mobile: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Invalid mobile number format'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  businessName: z.string().min(1, 'Business name is required').max(150),
  gstNumber: z.string().max(20).optional().or(z.literal('')),
  customerType: z.nativeEnum(CustomerType, { errorMap: () => ({ message: 'Invalid customer type' }) }),
  address: z.string().min(1, 'Address is required'),
  status: z.nativeEnum(CustomerStatus, { errorMap: () => ({ message: 'Invalid status' }) }),
  followUpDate: z.string().datetime({ offset: true }).optional().nullable().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  note: z.string().min(1, 'Note is required').max(1000),
  followUpDate: z.string().datetime({ offset: true }).optional().nullable().or(z.literal('')),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
