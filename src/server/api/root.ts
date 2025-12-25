import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { bookingsRouter } from "./routers/bookings";
import { settingsRouter } from "./routers/settings";
import { statsRouter } from "./routers/stats";
import { passwordResetRouter } from "./routers/password-reset";

/**
 * Root tRPC router combining all sub-routers
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: usersRouter,
  bookings: bookingsRouter,
  settings: settingsRouter,
  stats: statsRouter,
  passwordReset: passwordResetRouter,
});

export type AppRouter = typeof appRouter;

