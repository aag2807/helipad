import { createTRPCRouter, securityOrAdminProcedure } from "../trpc";
import { bookings, users } from "@/server/db/schema";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  eachDayOfInterval,
  format,
} from "date-fns";

export const statsRouter = createTRPCRouter({
  /**
   * Get dashboard overview stats
   */
  getOverview: securityOrAdminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Total users
    const [{ totalUsers }] = await ctx.db
      .select({ totalUsers: count() })
      .from(users);

    // Active users
    const [{ activeUsers }] = await ctx.db
      .select({ activeUsers: count() })
      .from(users)
      .where(eq(users.isActive, true));

    // Today's bookings
    const [{ todayBookings }] = await ctx.db
      .select({ todayBookings: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startTime, todayStart),
          lte(bookings.startTime, todayEnd)
        )
      );

    // This week's bookings
    const [{ weekBookings }] = await ctx.db
      .select({ weekBookings: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startTime, weekStart),
          lte(bookings.startTime, weekEnd)
        )
      );

    // This month's bookings
    const [{ monthBookings }] = await ctx.db
      .select({ monthBookings: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startTime, monthStart),
          lte(bookings.startTime, monthEnd)
        )
      );

    // Total bookings (all time)
    const [{ totalBookings }] = await ctx.db
      .select({ totalBookings: count() })
      .from(bookings)
      .where(eq(bookings.status, "confirmed"));

    // Cancelled bookings this month
    const [{ cancelledThisMonth }] = await ctx.db
      .select({ cancelledThisMonth: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "cancelled"),
          gte(bookings.cancelledAt, monthStart),
          lte(bookings.cancelledAt, monthEnd)
        )
      );

    // Upcoming bookings (next 7 days)
    const [{ upcomingBookings }] = await ctx.db
      .select({ upcomingBookings: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startTime, now),
          lte(bookings.startTime, subDays(now, -7))
        )
      );

    return {
      totalUsers,
      activeUsers,
      todayBookings,
      weekBookings,
      monthBookings,
      totalBookings,
      cancelledThisMonth,
      upcomingBookings,
    };
  }),

  /**
   * Get booking trends for chart (last 30 days)
   */
  getBookingTrends: securityOrAdminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    // Get all confirmed bookings in the last 30 days
    const recentBookings = await ctx.db
      .select({
        startTime: bookings.startTime,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.createdAt, thirtyDaysAgo)
        )
      );

    // Group by date
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    const bookingsByDay = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const count = recentBookings.filter((b) => {
        const bookingDate = new Date(b.startTime!);
        return bookingDate >= dayStart && bookingDate <= dayEnd;
      }).length;

      return {
        date: format(day, "MMM d"),
        bookings: count,
      };
    });

    return bookingsByDay;
  }),

  /**
   * Get top users by bookings
   */
  getTopUsers: securityOrAdminProcedure.query(async ({ ctx }) => {
    const monthStart = startOfMonth(new Date());

    const topUsers = await ctx.db
      .select({
        userId: bookings.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        bookingCount: count(bookings.id),
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startTime, monthStart)
        )
      )
      .groupBy(bookings.userId, users.firstName, users.lastName)
      .orderBy(sql`count(${bookings.id}) DESC`)
      .limit(5);

    return topUsers;
  }),

  /**
   * Get popular time slots
   */
  getPopularTimeSlots: securityOrAdminProcedure.query(async ({ ctx }) => {
    const monthStart = startOfMonth(new Date());

    const bookingTimes = await ctx.db
      .select({
        startTime: bookings.startTime,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startTime, monthStart)
        )
      );

    // Group by hour
    const hourCounts: Record<number, number> = {};
    bookingTimes.forEach((b) => {
      const hour = new Date(b.startTime!).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Convert to array and sort by count
    const popularHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        label: `${parseInt(hour) % 12 || 12}${parseInt(hour) < 12 ? "am" : "pm"}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return popularHours;
  }),
});

