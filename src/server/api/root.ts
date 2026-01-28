import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { bookingsRouter } from "./routers/bookings";
import { settingsRouter } from "./routers/settings";
import { statsRouter } from "./routers/stats";
import { passwordResetRouter } from "./routers/password-reset";
import { emailConfigRouter } from "./routers/email-config";
import { passengersRouter } from "./routers/passengers";

/**
 * Root tRPC router combining all sub-routers
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: usersRouter,
  bookings: bookingsRouter,
  passengers: passengersRouter,
  settings: settingsRouter,
  stats: statsRouter,
  passwordReset: passwordResetRouter,
  emailConfig: emailConfigRouter,
});

export type AppRouter = typeof appRouter;

