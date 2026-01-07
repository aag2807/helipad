"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { 
  Search, 
  Download, 
  RefreshCw, 
  Calendar,
  Filter,
  Eye,
  X,
  Check
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

export default function AdminBookingsPage() {
  const { t, locale, translateError } = useTranslations();
  const dateLocale = locale === "es" ? es : enUS;
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.bookings.listAll.useQuery({
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    status: (status as "pending" | "confirmed" | "cancelled") || undefined,
    page,
    limit: 20,
  });

  const approveBooking = trpc.bookings.approve.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        type: "success",
        title: t("adminBookings.bookingApproved"),
        description: t("adminBookings.bookingApprovedDescription"),
      });
    },
    onError: (error) => {
      toast({
        type: "error",
        title: t("errors.generic"),
        description: translateError(error.message),
      });
    },
  });

  const rejectBooking = trpc.bookings.reject.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        type: "success",
        title: t("adminBookings.bookingRejected"),
        description: t("adminBookings.bookingRejectedDescription"),
      });
    },
    onError: (error) => {
      toast({
        type: "error",
        title: t("errors.generic"),
        description: translateError(error.message),
      });
    },
  });

  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        type: "success",
        title: t("adminBookings.bookingCancelled"),
        description: t("adminBookings.bookingCancelledDescription"),
      });
    },
    onError: (error) => {
      toast({
        type: "error",
        title: t("errors.generic"),
        description: translateError(error.message),
      });
    },
  });

  const handleExportCSV = () => {
    if (!data?.bookings) return;

    const headers = [
      "ID",
      "User",
      "Email",
      "Date",
      "Start Time",
      "End Time",
      "Purpose",
      "Status",
      "Created At",
    ];

    const rows = data.bookings.map((booking) => [
      booking.id,
      booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : "N/A",
      booking.user?.email ?? "N/A",
      format(new Date(booking.startTime!), "yyyy-MM-dd"),
      format(new Date(booking.startTime!), "HH:mm"),
      format(new Date(booking.endTime!), "HH:mm"),
      `"${booking.purpose?.replace(/"/g, '""') ?? ""}"`,
      booking.status,
      format(new Date(booking.createdAt!), "yyyy-MM-dd HH:mm"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      type: "success",
      title: t("adminBookings.exportComplete"),
      description: t("adminBookings.exportedBookings", { count: data.bookings.length.toString() }),
    });
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatus("");
    setPage(1);
  };

  const bookings = data?.bookings ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 };
  const hasFilters = startDate || endDate || status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t("adminBookings.title")}</h1>
          <p className="text-zinc-500 mt-1">
            {t("adminBookings.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            {t("common.refresh")}
          </Button>
          <Button onClick={handleExportCSV} disabled={bookings.length === 0}>
            <Download className="w-4 h-4" />
            {t("common.exportCSV")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700">{t("common.filters")}</span>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-violet-600 hover:text-violet-700 ml-auto cursor-pointer"
            >
              {t("common.clearAll")}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">{t("adminBookings.fromDate")}</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">{t("adminBookings.toDate")}</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">{t("adminBookings.status")}</label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("adminUsers.allStatus")}</option>
              <option value="pending">{t("bookingStatus.pending")}</option>
              <option value="confirmed">{t("bookingStatus.confirmed")}</option>
              <option value="cancelled">{t("bookingStatus.cancelled")}</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClearFilters}
              disabled={!hasFilters}
            >
              <X className="w-4 h-4" />
              {t("common.clear")}
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {pagination.total} {pagination.total !== 1 ? t("common.bookingsFound") : t("common.bookingFound")}
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>{t("adminBookings.tableHeaders.user")}</TableHead>
                <TableHead>{t("adminBookings.tableHeaders.date")}</TableHead>
                <TableHead>{t("adminBookings.tableHeaders.time")}</TableHead>
                <TableHead>{t("adminBookings.tableHeaders.purpose")}</TableHead>
                <TableHead>{t("adminBookings.tableHeaders.status")}</TableHead>
                <TableHead className="w-24">{t("adminBookings.tableHeaders.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                    {t("adminBookings.noBookingsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-900">
                          {booking.user
                            ? `${booking.user.firstName} ${booking.user.lastName}`
                            : t("adminBookings.unknown")}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {booking.user?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        {format(new Date(booking.startTime!), "MMM d, yyyy", { locale: dateLocale })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.startTime!), "h:mm a")} -{" "}
                      {format(new Date(booking.endTime!), "h:mm a")}
                    </TableCell>
                    <TableCell>
                      <p className="truncate max-w-[200px]" title={booking.purpose ?? ""}>
                        {booking.purpose}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === "confirmed" 
                            ? "success" 
                            : booking.status === "pending"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {booking.status === "confirmed" 
                          ? t("bookingStatus.confirmed") 
                          : booking.status === "pending"
                          ? t("bookingStatus.pending")
                          : t("bookingStatus.cancelled")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => approveBooking.mutate({ id: booking.id })}
                              disabled={approveBooking.isPending || rejectBooking.isPending}
                            >
                              <Check className="w-4 h-4" />
                              {t("common.approve")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => rejectBooking.mutate({ id: booking.id })}
                              disabled={approveBooking.isPending || rejectBooking.isPending}
                            >
                              <X className="w-4 h-4" />
                              {t("common.reject")}
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => cancelBooking.mutate({ id: booking.id })}
                            disabled={cancelBooking.isPending}
                          >
                            <X className="w-4 h-4" />
                            {t("common.cancel")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
