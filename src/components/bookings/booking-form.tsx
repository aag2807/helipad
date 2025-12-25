"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { Loader2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { generateTimeSlots } from "@/hooks/use-calendar";

const bookingFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.number().min(15, "Minimum 15 minutes").max(240, "Maximum 4 hours"),
  purpose: z.string().min(1, "Purpose is required").max(500),
  notes: z.string().max(1000).optional(),
  contactPhone: z.string().max(20).optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    startTime: string;
    endTime: string;
    purpose: string;
    notes?: string;
    contactPhone?: string;
  }) => void;
  isLoading?: boolean;
  initialDate?: Date;
  initialHour?: number;
  initialMinute?: number;
}

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

export function BookingForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialDate,
  initialHour,
  initialMinute,
}: BookingFormProps) {
  const timeSlots = useMemo(() => generateTimeSlots(6, 22, 15), []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      duration: 60,
    },
  });

  // Reset form when dialog opens with initial values
  useEffect(() => {
    if (open) {
      const date = initialDate || new Date();
      const hour = initialHour ?? 9;
      const minute = initialMinute ?? 0;

      reset({
        date: format(date, "yyyy-MM-dd"),
        startTime: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        duration: 60,
        purpose: "",
        notes: "",
        contactPhone: "",
      });
    }
  }, [open, initialDate, initialHour, initialMinute, reset]);

  const watchedDate = watch("date");
  const watchedStartTime = watch("startTime");
  const watchedDuration = watch("duration");

  const endTime = useMemo(() => {
    if (!watchedDate || !watchedStartTime || !watchedDuration) return null;

    const [hours, minutes] = watchedStartTime.split(":").map(Number);
    const startDate = setMinutes(setHours(new Date(watchedDate), hours), minutes);
    const endDate = addMinutes(startDate, watchedDuration);

    return format(endDate, "h:mm a");
  }, [watchedDate, watchedStartTime, watchedDuration]);

  const handleFormSubmit = (data: BookingFormData) => {
    const [hours, minutes] = data.startTime.split(":").map(Number);
    const startDate = setMinutes(setHours(new Date(data.date), hours), minutes);
    const endDate = addMinutes(startDate, data.duration);

    onSubmit({
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      purpose: data.purpose,
      notes: data.notes || undefined,
      contactPhone: data.contactPhone || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Helipad</DialogTitle>
          <DialogDescription>
            Select your preferred time slot and provide booking details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogBody className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" required>
                Date
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                  error={!!errors.date}
                  className="pl-10"
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              {errors.date && (
                <p className="text-xs text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Time row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" required>
                  Start Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Select
                    id="startTime"
                    {...register("startTime")}
                    error={!!errors.startTime}
                    className="pl-10"
                  >
                    {timeSlots.map((slot) => (
                      <option
                        key={`${slot.hour}-${slot.minute}`}
                        value={`${slot.hour.toString().padStart(2, "0")}:${slot.minute.toString().padStart(2, "0")}`}
                      >
                        {slot.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" required>
                  Duration
                </Label>
                <Select
                  id="duration"
                  {...register("duration", { valueAsNumber: true })}
                  error={!!errors.duration}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* End time preview */}
            {endTime && (
              <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl text-sm">
                <Clock className="w-4 h-4 text-violet-600" />
                <span className="text-violet-700">
                  Booking ends at <strong>{endTime}</strong>
                </span>
              </div>
            )}

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose" required>
                Purpose
              </Label>
              <Input
                id="purpose"
                {...register("purpose")}
                error={!!errors.purpose}
                placeholder="e.g., Medical transport, VIP arrival"
              />
              {errors.purpose && (
                <p className="text-xs text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea
                id="notes"
                {...register("notes")}
                className="flex w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:border-violet-500 transition-colors resize-none"
                rows={3}
                placeholder="Any special requirements or notes..."
              />
            </div>

            {/* Contact phone */}
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone (optional)</Label>
              <Input
                id="contactPhone"
                type="tel"
                {...register("contactPhone")}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Book Now
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

