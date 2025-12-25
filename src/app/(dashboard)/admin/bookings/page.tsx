"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Search, 
  Download, 
  RefreshCw, 
  Calendar,
  Filter,
  Eye,
  X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.bookings.listAll.useQuery({
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    status: (status as "confirmed" | "cancelled") || undefined,
    page,
    limit: 20,
  });

  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        type: "success",
        title: "Booking cancelled",
        description: "The booking has been cancelled.",
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
      title: "Export complete",
      description: `Exported ${data.bookings.length} bookings to CSV.`,
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
          <h1 className="text-2xl font-bold text-zinc-900">All Bookings</h1>
          <p className="text-zinc-500 mt-1">
            View and manage all helipad bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} disabled={bookings.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700">Filters</span>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-violet-600 hover:text-violet-700 ml-auto"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">From Date</label>
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
            <label className="text-xs text-zinc-500 mb-1 block">To Date</label>
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
            <label className="text-xs text-zinc-500 mb-1 block">Status</label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
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
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {pagination.total} booking{pagination.total !== 1 ? "s" : ""} found
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
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                    No bookings found
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
                            : "Unknown"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {booking.user?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        {format(new Date(booking.startTime!), "MMM d, yyyy")}
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
                          booking.status === "confirmed" ? "success" : "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.status === "confirmed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => cancelBooking.mutate({ id: booking.id })}
                          disabled={cancelBooking.isPending}
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      )}
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
