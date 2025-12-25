"use client";

import { format } from "date-fns";
import { Loader2, Calendar, Clock, User, Phone, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";

interface Booking {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  notes?: string | null;
  contactPhone?: string | null;
  status: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
}

interface BookingDetailsProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onEdit: () => void;
  isOwner: boolean;
  isAdmin: boolean;
  isCancelling?: boolean;
}

export function BookingDetails({
  booking,
  open,
  onOpenChange,
  onCancel,
  onEdit,
  isOwner,
  isAdmin,
  isCancelling,
}: BookingDetailsProps) {
  if (!booking) return null;

  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const isPast = endTime < new Date();
  const canModify = (isOwner || isAdmin) && !isPast && booking.status === "confirmed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Booking Details
            <Badge
              variant={
                booking.status === "confirmed"
                  ? "success"
                  : booking.status === "cancelled"
                  ? "destructive"
                  : "secondary"
              }
            >
              {booking.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
              <Calendar className="w-5 h-5 text-violet-600 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Date</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {format(startTime, "EEEE, MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
              <Clock className="w-5 h-5 text-violet-600 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Time</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                </p>
              </div>
            </div>
          </div>

          {/* User info */}
          {booking.user && (
            <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
              <User className="w-5 h-5 text-violet-600 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Booked by</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {booking.user.firstName} {booking.user.lastName}
                </p>
                {booking.user.email && (
                  <p className="text-xs text-zinc-500">{booking.user.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Purpose */}
          <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
            <FileText className="w-5 h-5 text-violet-600 mt-0.5" />
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Purpose</p>
              <p className="text-sm text-zinc-900">{booking.purpose}</p>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-600 font-medium uppercase mb-1">Notes</p>
              <p className="text-sm text-amber-900">{booking.notes}</p>
            </div>
          )}

          {/* Contact phone */}
          {booking.contactPhone && (
            <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
              <Phone className="w-5 h-5 text-violet-600 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Contact</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {booking.contactPhone}
                </p>
              </div>
            </div>
          )}

          {/* Past booking notice */}
          {isPast && booking.status === "confirmed" && (
            <div className="p-3 bg-zinc-100 rounded-xl text-center text-sm text-zinc-600">
              This booking has already passed
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canModify && (
            <>
              <Button variant="outline" onClick={onEdit}>
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={onCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Cancel Booking
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

