"use client";

import { 
  Users, 
  Calendar, 
  CalendarCheck, 
  TrendingUp, 
  Clock, 
  XCircle,
  BarChart3,
  Trophy 
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/admin/stat-card";
import { MiniChart } from "@/components/admin/mini-chart";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = trpc.stats.getOverview.useQuery();
  const { data: trends, isLoading: trendsLoading } = trpc.stats.getBookingTrends.useQuery();
  const { data: topUsers, isLoading: topUsersLoading } = trpc.stats.getTopUsers.useQuery();
  const { data: popularSlots, isLoading: slotsLoading } = trpc.stats.getPopularTimeSlots.useQuery();

  const isLoading = statsLoading || trendsLoading || topUsersLoading || slotsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        <p className="text-zinc-500 mt-1">
          Overview of your helipad booking system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Bookings"
          value={stats?.todayBookings ?? 0}
          icon={Calendar}
          color="violet"
        />
        <StatCard
          title="This Week"
          value={stats?.weekBookings ?? 0}
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="This Month"
          value={stats?.monthBookings ?? 0}
          icon={TrendingUp}
          color="sky"
        />
        <StatCard
          title="Upcoming (7 days)"
          value={stats?.upcomingBookings ?? 0}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          description={`${stats?.activeUsers ?? 0} active`}
          color="violet"
        />
        <StatCard
          title="All-Time Bookings"
          value={stats?.totalBookings ?? 0}
          icon={BarChart3}
          color="emerald"
        />
        <StatCard
          title="Cancelled (Month)"
          value={stats?.cancelledThisMonth ?? 0}
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Booking Trends Chart */}
        <div className="lg:col-span-2">
          {trends && trends.length > 0 && <MiniChart data={trends} height={200} />}
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-medium text-zinc-500">Top Bookers (Month)</h3>
          </div>
          
          {topUsers && topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? "bg-amber-100 text-amber-700" : 
                      index === 1 ? "bg-zinc-100 text-zinc-600" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-zinc-50 text-zinc-500"}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-zinc-600">
                    {user.bookingCount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-4">
              No bookings this month
            </p>
          )}
        </div>
      </div>

      {/* Popular Time Slots */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-violet-500" />
          <h3 className="text-sm font-medium text-zinc-500">Popular Time Slots (Month)</h3>
        </div>

        {popularSlots && popularSlots.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {popularSlots.map((slot, index) => (
              <div
                key={slot.hour}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium
                  ${index === 0 ? "bg-violet-100 text-violet-800" :
                    "bg-zinc-100 text-zinc-700"}
                `}
              >
                {slot.label}
                <span className="ml-2 text-xs opacity-70">
                  ({slot.count} bookings)
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No bookings this month</p>
        )}
      </div>
    </div>
  );
}

