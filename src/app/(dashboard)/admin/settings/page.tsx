"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Clock, 
  Calendar, 
  Bell, 
  Save, 
  Plus, 
  X, 
  Loader2,
  Settings as SettingsIcon
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { data: settings, isLoading } = trpc.settings.getAll.useQuery();
  const utils = trpc.useUtils();

  // Form state
  const [operationalHours, setOperationalHours] = useState({ start: "06:00", end: "22:00" });
  const [timeSlotDuration, setTimeSlotDuration] = useState(15);
  const [minBookingNotice, setMinBookingNotice] = useState(60);
  const [maxBookingDuration, setMaxBookingDuration] = useState(240);
  const [cancellationCutoff, setCancellationCutoff] = useState(60);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [emailSettings, setEmailSettings] = useState({
    confirmationEnabled: true,
    reminderEnabled: true,
    reminderHoursBefore: 24,
    adminNotificationsEnabled: true,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setOperationalHours(settings.operationalHours);
      setTimeSlotDuration(settings.timeSlotDuration);
      setMinBookingNotice(settings.minBookingNotice);
      setMaxBookingDuration(settings.maxBookingDuration);
      setCancellationCutoff(settings.cancellationCutoff);
      setBlackoutDates(settings.blackoutDates);
      setEmailSettings(settings.emailNotifications);
    }
  }, [settings]);

  // Mutations
  const updateSettings = trpc.settings.updateMany.useMutation({
    onSuccess: () => {
      utils.settings.getAll.invalidate();
      toast({
        type: "success",
        title: "Settings saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        type: "error",
        title: "Error",
        description: error.message,
      });
    },
  });

  const addBlackoutDate = trpc.settings.addBlackoutDate.useMutation({
    onSuccess: (data) => {
      setBlackoutDates(data);
      setNewBlackoutDate("");
      utils.settings.getAll.invalidate();
      toast({
        type: "success",
        title: "Blackout date added",
      });
    },
  });

  const removeBlackoutDate = trpc.settings.removeBlackoutDate.useMutation({
    onSuccess: (data) => {
      setBlackoutDates(data);
      utils.settings.getAll.invalidate();
      toast({
        type: "success",
        title: "Blackout date removed",
      });
    },
  });

  const handleSaveGeneral = () => {
    updateSettings.mutate({
      settings: {
        operationalHours,
        timeSlotDuration,
        minBookingNotice,
        maxBookingDuration,
        cancellationCutoff,
      },
    });
  };

  const handleSaveEmail = () => {
    updateSettings.mutate({
      settings: {
        emailNotifications: emailSettings,
      },
    });
  };

  const handleAddBlackout = () => {
    if (newBlackoutDate && !blackoutDates.includes(newBlackoutDate)) {
      addBlackoutDate.mutate({ date: newBlackoutDate });
    }
  };

  const handleRemoveBlackout = (date: string) => {
    removeBlackoutDate.mutate({ date });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">System Settings</h1>
        <p className="text-zinc-500 mt-1">
          Configure helipad booking system settings
        </p>
      </div>

      {/* Operational Hours */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-100 rounded-xl">
            <Clock className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Operational Hours</h2>
            <p className="text-sm text-zinc-500">Set when the helipad is available for booking</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Opening Time</Label>
            <Select
              value={operationalHours.start}
              onChange={(e) =>
                setOperationalHours({ ...operationalHours, start: e.target.value })
              }
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                  {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Closing Time</Label>
            <Select
              value={operationalHours.end}
              onChange={(e) =>
                setOperationalHours({ ...operationalHours, end: e.target.value })
              }
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                  {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Time Slot Duration</Label>
            <Select
              value={timeSlotDuration.toString()}
              onChange={(e) => setTimeSlotDuration(Number(e.target.value))}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Max Booking Duration</Label>
            <Select
              value={maxBookingDuration.toString()}
              onChange={(e) => setMaxBookingDuration(Number(e.target.value))}
            >
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
              <option value="240">4 hours</option>
              <option value="480">8 hours</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Min. Advance Notice</Label>
            <Select
              value={minBookingNotice.toString()}
              onChange={(e) => setMinBookingNotice(Number(e.target.value))}
            >
              <option value="0">None</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="1440">24 hours</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveGeneral} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Blackout Dates */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-xl">
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Blackout Dates</h2>
            <p className="text-sm text-zinc-500">Days when the helipad is unavailable</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            type="date"
            value={newBlackoutDate}
            onChange={(e) => setNewBlackoutDate(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
            className="max-w-xs"
          />
          <Button
            onClick={handleAddBlackout}
            disabled={!newBlackoutDate || addBlackoutDate.isPending}
          >
            <Plus className="w-4 h-4" />
            Add Date
          </Button>
        </div>

        {blackoutDates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {blackoutDates.sort().map((date) => (
              <div
                key={date}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm"
              >
                <span className="text-red-800">
                  {format(new Date(date), "MMM d, yyyy")}
                </span>
                <button
                  onClick={() => handleRemoveBlackout(date)}
                  className="text-red-500 hover:text-red-700"
                  disabled={removeBlackoutDate.isPending}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No blackout dates configured</p>
        )}
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Email Notifications</h2>
            <p className="text-sm text-zinc-500">Configure automated email settings</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors">
            <input
              type="checkbox"
              checked={emailSettings.confirmationEnabled}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, confirmationEnabled: e.target.checked })
              }
              className="h-5 w-5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <div>
              <p className="font-medium text-zinc-900">Booking Confirmations</p>
              <p className="text-sm text-zinc-500">Send email when a booking is created</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors">
            <input
              type="checkbox"
              checked={emailSettings.reminderEnabled}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, reminderEnabled: e.target.checked })
              }
              className="h-5 w-5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <div className="flex-1">
              <p className="font-medium text-zinc-900">Booking Reminders</p>
              <p className="text-sm text-zinc-500">Send reminder before booking time</p>
            </div>
            <Select
              value={emailSettings.reminderHoursBefore.toString()}
              onChange={(e) =>
                setEmailSettings({
                  ...emailSettings,
                  reminderHoursBefore: Number(e.target.value),
                })
              }
              className="w-32"
              disabled={!emailSettings.reminderEnabled}
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
            </Select>
          </label>

          <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors">
            <input
              type="checkbox"
              checked={emailSettings.adminNotificationsEnabled}
              onChange={(e) =>
                setEmailSettings({
                  ...emailSettings,
                  adminNotificationsEnabled: e.target.checked,
                })
              }
              className="h-5 w-5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <div>
              <p className="font-medium text-zinc-900">Admin Notifications</p>
              <p className="text-sm text-zinc-500">Notify admins of new bookings and cancellations</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveEmail} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
