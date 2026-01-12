"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Loader2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useTranslations } from "@/hooks/use-translations";

const bookingFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  purpose: z.string().min(1, "Purpose is required").max(500),
  notes: z.string().max(1000).optional(),
  contactPhone: z.string().max(20).optional(),
  passengers: z.number().int().min(1, "At least 1 passenger").max(50, "Maximum 50 passengers"),
  helicopterRegistration: z.string().min(1, "Helicopter registration is required").max(50),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface EditingBooking {
  id: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  notes?: string | null;
  contactPhone?: string | null;
  passengers?: number | null;
  helicopterRegistration?: string | null;
}

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    startTime: string;
    endTime: string;
    purpose: string;
    notes?: string;
    contactPhone?: string;
    passengers: number;
    helicopterRegistration: string;
  }) => void;
  isLoading?: boolean;
  initialDate?: Date;
  initialHour?: number;
  initialMinute?: number;
  editingBooking?: EditingBooking | null;
}

export function BookingForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialDate,
  initialHour,
  initialMinute,
  editingBooking,
}: BookingFormProps) {
  const { t, locale } = useTranslations();
  const dateLocale = locale === "es" ? es : enUS;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate || new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Generate 15-minute time slots (10 min booking + 5 min buffer)
  const timeSlots = useMemo(() => generateTimeSlots(6, 22, 15), []);
  
  // Fixed 10-minute duration
  const FIXED_DURATION = 10;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
  });

  // Reset form when dialog opens with initial values or editing booking
  useEffect(() => {
    if (open) {
      if (editingBooking) {
        // Pre-fill form with existing booking data
        const startDate = new Date(editingBooking.startTime);
        setSelectedDate(startDate);

        reset({
          date: format(startDate, "yyyy-MM-dd"),
          startTime: `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`,
          purpose: editingBooking.purpose,
          notes: editingBooking.notes || "",
          contactPhone: editingBooking.contactPhone || "",
          passengers: editingBooking.passengers || 1,
          helicopterRegistration: editingBooking.helicopterRegistration || "",
        });
      } else {
        // New booking - use initial values
        const date = initialDate || new Date();
        const hour = initialHour ?? 9;
        const minute = initialMinute ?? 0;
        setSelectedDate(date);

        reset({
          date: format(date, "yyyy-MM-dd"),
          startTime: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          purpose: "",
          notes: "",
          contactPhone: "",
          passengers: 1,
          helicopterRegistration: "",
        });
      }
    }
  }, [open, initialDate, initialHour, initialMinute, editingBooking, reset]);

  const watchedDate = watch("date");
  const watchedStartTime = watch("startTime");

  // Calculate end time (fixed 10 minutes)
  const endTime = useMemo(() => {
    if (!watchedDate || !watchedStartTime) return null;

    const [hours, minutes] = watchedStartTime.split(":").map(Number);
    const [year, month, day] = watchedDate.split("-").map(Number);
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = addMinutes(startDate, FIXED_DURATION);

    return format(endDate, "h:mm a");
  }, [watchedDate, watchedStartTime]);

  const handleFormSubmit = (data: BookingFormData) => {
    const [hours, minutes] = data.startTime.split(":").map(Number);
    
    // Parse date string as local date (not UTC) to avoid timezone issues
    const [year, month, day] = data.date.split("-").map(Number);
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = addMinutes(startDate, FIXED_DURATION);

    onSubmit({
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      purpose: data.purpose,
      notes: data.notes || undefined,
      contactPhone: data.contactPhone || undefined,
      passengers: data.passengers,
      helicopterRegistration: data.helicopterRegistration,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingBooking ? t("bookings.editBooking") : t("bookings.bookHelipad")}
          </DialogTitle>
          <DialogDescription>
            {editingBooking ? t("bookings.updateTimeSlot") : t("bookings.selectTimeSlot")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogBody className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" required>
                {t("bookings.date")}
              </Label>
              <input type="hidden" {...register("date")} />
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 !pl-[40px]",
                      !selectedDate && "text-muted-foreground",
                      errors.date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="absolute left-[38px] w-4 h-4 text-zinc-400" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: dateLocale }) : <span>{t("bookings.selectDate")}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    locale={dateLocale}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setValue("date", format(date, "yyyy-MM-dd"), { shouldValidate: true });
                        setDatePickerOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Time row - single column since duration is fixed */}
            <div className="space-y-2">
              <Label htmlFor="startTime" required>
                {t("bookings.startTime")}
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
              {errors.startTime && (
                <p className="text-xs text-red-600">{errors.startTime.message}</p>
              )}
            </div>

            {/* Duration info and end time preview */}
            {endTime && (
              <div className="p-3 bg-violet-50 rounded-xl">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-600" />
                    <span className="text-violet-700">
                      <strong>{t("bookings.fixedDuration")}</strong> {t("bookings.fixedDurationBooking")}
                    </span>
                  </div>
                  <span className="text-violet-700">
                    {t("bookings.endsAt")} <strong>{endTime}</strong>
                  </span>
                </div>
                <p className="text-xs text-violet-600">
                  {t("bookings.bufferInfo")}
                </p>
              </div>
            )}

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose" required>
                {t("bookings.purpose")}
              </Label>
              <Input
                id="purpose"
                {...register("purpose")}
                error={!!errors.purpose}
                placeholder={t("bookings.purposePlaceholder")}
              />
              {errors.purpose && (
                <p className="text-xs text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("bookings.notesOptional")}</Label>
              <textarea
                id="notes"
                {...register("notes")}
                className="flex w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:border-violet-500 transition-colors resize-none"
                rows={3}
                placeholder={t("bookings.notesPlaceholder")}
              />
            </div>

            {/* Contact phone */}
            <div className="space-y-2">
              <Label htmlFor="contactPhone">{t("bookings.contactPhoneOptional")}</Label>
              <Input
                id="contactPhone"
                type="tel"
                {...register("contactPhone")}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <Label htmlFor="passengers" required>
                {t("bookings.passengers")}
              </Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="50"
                {...register("passengers", { valueAsNumber: true })}
                error={!!errors.passengers}
                placeholder={t("bookings.passengersPlaceholder")}
              />
              {errors.passengers && (
                <p className="text-xs text-red-600">{errors.passengers.message}</p>
              )}
            </div>

            {/* Helicopter Registration */}
            <div className="space-y-2">
              <Label htmlFor="helicopterRegistration" required>{t("bookings.helicopterRegistration")}</Label>
              <Input
                id="helicopterRegistration"
                type="text"
                {...register("helicopterRegistration")}
                error={!!errors.helicopterRegistration}
                placeholder={t("bookings.helicopterRegistrationPlaceholder")}
              />
              {errors.helicopterRegistration && (
                <p className="text-xs text-red-600">{errors.helicopterRegistration.message}</p>
              )}
            </div>
          </DialogBody>

          <DialogFooter className="flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingBooking ? t("bookings.updateBooking") : t("bookings.bookNow")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

