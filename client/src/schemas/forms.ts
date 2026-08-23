/**
 * Form Validation Schemas
 * Zod schemas for form validation
 */

import { z } from "zod";
import {
  ReceiptStatus,
  PaymentStatus,
  PaymentRecurrence,
  CounterpartyRelation,
} from "@shared/types";

// ============================================================================
// COUNTERPARTIES
// ============================================================================

export const createCounterpartySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  id_type: z.enum(["CC", "NIT", "CE", "PP"]),
  id_number: z.string().min(5, "El número de identificación es requerido"),
  type: z.enum(["Persona natural", "Persona jurídica"]),
  relation: z.enum(["Cliente", "Proveedor"]),
  phone: z.string().regex(/^\+?[0-9]{7,}$/, "Teléfono inválido"),
  email: z.string().email("Email inválido"),
});

export type CreateCounterpartyInput = z.infer<typeof createCounterpartySchema>;

// ============================================================================
// RECEIPTS
// ============================================================================

export const createReceiptSchema = z.object({
  payerId: z.string().uuid("Debe seleccionar un pagador"),
  concept: z.string().min(3, "El concepto es requerido (mínimo 3 caracteres)"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  currency: z.string().default("COP"),
  date: z
    .string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      "La fecha debe ser válida"
    ),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;

export const updateReceiptSchema = z.object({
  concept: z.string().min(3).optional(),
  amount: z.number().positive().optional(),
  status: z.enum([
    ReceiptStatus.PENDING,
    ReceiptStatus.RECEIVED,
    ReceiptStatus.CANCELED,
  ]).optional(),
  notes: z.string().optional(),
});

export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;

// ============================================================================
// PAYMENTS
// ============================================================================

export const createPaymentSchema = z
  .object({
    sourceAccountId: z.string().uuid("Debe seleccionar una cuenta origen"),
    beneficiaryId: z.string().uuid("Debe seleccionar un beneficiario"),
    concept: z.string().min(3, "El concepto es requerido"),
    amount: z.number().positive("El monto debe ser mayor a 0"),
    currency: z.string().default("COP"),
    scheduledDate: z
      .string()
      .refine(
        (date) => !isNaN(Date.parse(date)),
        "La fecha debe ser válida"
      ),
    isRecurring: z.boolean().default(false),
    recurrence: z
      .enum(["once", "monthly", "quarterly", "annual"])
      .default("once"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring && data.recurrence === "once") {
        return false;
      }
      return true;
    },
    {
      message: "Si es recurrente, debe seleccionar una frecuencia",
      path: ["recurrence"],
    }
  );

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const updatePaymentSchema = z.object({
  status: z
    .enum([
      PaymentStatus.SCHEDULED,
      PaymentStatus.PROCESSED,
      PaymentStatus.CANCELED,
      PaymentStatus.FAILED,
    ])
    .optional(),
  notes: z.string().optional(),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// ============================================================================
// DISPERSIONS
// ============================================================================

export const dispersionItemSchema = z.object({
  beneficiaryId: z.string().uuid("Beneficiario inválido"),
  accountId: z.string().uuid("Cuenta inválida"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
});

export type DispersionItemInput = z.infer<typeof dispersionItemSchema>;

export const createDispersionSchema = z
  .object({
    name: z.string().min(3, "El nombre de la dispersión es requerido"),
    concept: z.string().min(3, "El concepto es requerido"),
    sourceAccountId: z.string().uuid("Debe seleccionar una cuenta origen"),
    scheduledDate: z
      .string()
      .refine(
        (date) => !isNaN(Date.parse(date)),
        "La fecha debe ser válida"
      ),
    items: z
      .array(dispersionItemSchema)
      .min(1, "Debe agregar al menos un beneficiario"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const total = data.items.reduce((sum, item) => sum + item.amount, 0);
      return total > 0;
    },
    {
      message: "El monto total debe ser mayor a 0",
      path: ["items"],
    }
  );

export type CreateDispersionInput = z.infer<typeof createDispersionSchema>;

// ============================================================================
// BANK ACCOUNTS
// ============================================================================

export const createBankAccountSchema = z.object({
  counterpartyId: z.string().uuid("Debe seleccionar una contraparte"),
  bank_name: z.string().min(2, "El nombre del banco es requerido"),
  account_type: z.enum(["Ahorros", "Corriente", "Ahorro programado"]),
  account_number: z
    .string()
    .regex(/^\d{8,20}$/, "Número de cuenta inválido (8-20 dígitos)"),
  account_holder: z.string().min(3, "El titular es requerido"),
  routing_number: z.string().optional(),
  is_primary: z.boolean().default(false),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;

// ============================================================================
// FILTERS & SEARCH
// ============================================================================

export const receiptFiltersSchema = z.object({
  status: z.enum([ReceiptStatus.PENDING, ReceiptStatus.RECEIVED, ReceiptStatus.CANCELED]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(5).max(100).default(10),
});

export type ReceiptFiltersInput = z.infer<typeof receiptFiltersSchema>;

export const paymentFiltersSchema = z.object({
  status: z
    .enum([
      PaymentStatus.SCHEDULED,
      PaymentStatus.PROCESSED,
      PaymentStatus.IN_PROGRESS,
      PaymentStatus.CANCELED,
      PaymentStatus.FAILED,
    ])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(5).max(100).default(10),
});

export type PaymentFiltersInput = z.infer<typeof paymentFiltersSchema>;

export const dispersionFiltersSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(5).max(100).default(10),
});

export type DispersionFiltersInput = z.infer<typeof dispersionFiltersSchema>;
