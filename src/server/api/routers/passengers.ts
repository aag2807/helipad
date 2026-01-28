import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { passengers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Validation schema for passenger
const passengerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  identificationType: z.enum(["cedula", "passport", "other"]),
  identificationNumber: z.string().min(1, "Identification number is required").max(50),
  idPhotoBase64: z.string().optional(), // Base64 string, max 10MB will be validated separately
});

export const passengersRouter = createTRPCRouter({
  /**
   * Get passengers for a booking
   */
  getByBookingId: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const passengersList = await ctx.db
        .select()
        .from(passengers)
        .where(eq(passengers.bookingId, input.bookingId))
        .orderBy(passengers.createdAt);

      return passengersList;
    }),

  /**
   * Create a passenger
   */
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        ...passengerSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate photo size if provided (max 10MB)
      if (input.idPhotoBase64) {
        const sizeInBytes = (input.idPhotoBase64.length * 3) / 4; // Rough base64 size calculation
        const sizeInMB = sizeInBytes / (1024 * 1024);
        if (sizeInMB > 10) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Photo size exceeds 10MB limit",
          });
        }
      }

      const [newPassenger] = await ctx.db
        .insert(passengers)
        .values({
          bookingId: input.bookingId,
          name: input.name,
          identificationType: input.identificationType,
          identificationNumber: input.identificationNumber,
          idPhotoBase64: input.idPhotoBase64,
        })
        .returning();

      return newPassenger;
    }),

  /**
   * Update a passenger
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        ...passengerSchema.partial().shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Validate photo size if provided
      if (updateData.idPhotoBase64) {
        const sizeInBytes = (updateData.idPhotoBase64.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        if (sizeInMB > 10) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Photo size exceeds 10MB limit",
          });
        }
      }

      const [updated] = await ctx.db
        .update(passengers)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(passengers.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Passenger not found" });
      }

      return updated;
    }),

  /**
   * Delete a passenger
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(passengers).where(eq(passengers.id, input.id));
      return { success: true };
    }),

  /**
   * Batch create passengers for a booking
   */
  batchCreate: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        passengers: z.array(passengerSchema).min(1, "At least one passenger is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate all photos
      for (const passenger of input.passengers) {
        if (passenger.idPhotoBase64) {
          const sizeInBytes = (passenger.idPhotoBase64.length * 3) / 4;
          const sizeInMB = sizeInBytes / (1024 * 1024);
          if (sizeInMB > 10) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Photo for ${passenger.name} exceeds 10MB limit`,
            });
          }
        }
      }

      const newPassengers = await ctx.db
        .insert(passengers)
        .values(
          input.passengers.map((p) => ({
            bookingId: input.bookingId,
            name: p.name,
            identificationType: p.identificationType,
            identificationNumber: p.identificationNumber,
            idPhotoBase64: p.idPhotoBase64,
          }))
        )
        .returning();

      return newPassengers;
    }),

  /**
   * Delete all passengers for a booking (used when re-creating)
   */
  deleteByBookingId: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(passengers).where(eq(passengers.bookingId, input.bookingId));
      return { success: true };
    }),
});
