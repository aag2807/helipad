import { db } from "./index";
import { users, settings } from "./schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if admin already exists
  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, "admin"),
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists, skipping user seed");
  } else {
    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await db.insert(users).values({
      username: "admin",
      email: "admin@helipad.local",
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      isActive: true,
    });

    console.log("✅ Created admin user (username: admin, password: admin123)");

    // Create a demo user
    const demoPassword = await bcrypt.hash("demo1234", 10);
    
    await db.insert(users).values({
      username: "demo",
      email: "demo@helipad.local",
      password: demoPassword,
      firstName: "Demo",
      lastName: "User",
      role: "user",
      isActive: true,
    });

    console.log("✅ Created demo user (username: demo, password: demo1234)");
  }

  // Seed default settings
  const defaultSettingsData = [
    {
      key: "operationalHours",
      value: JSON.stringify({ start: "06:00", end: "22:00" }),
    },
    {
      key: "timeSlotDuration",
      value: JSON.stringify(15),
    },
    {
      key: "minBookingNotice",
      value: JSON.stringify(60),
    },
    {
      key: "maxBookingDuration",
      value: JSON.stringify(240),
    },
    {
      key: "cancellationCutoff",
      value: JSON.stringify(60),
    },
    {
      key: "blackoutDates",
      value: JSON.stringify([]),
    },
    {
      key: "emailNotifications",
      value: JSON.stringify({
        confirmationEnabled: true,
        reminderEnabled: true,
        reminderHoursBefore: 24,
        adminNotificationsEnabled: true,
      }),
    },
  ];

  for (const setting of defaultSettingsData) {
    const existing = await db.query.settings.findFirst({
      where: (settings, { eq }) => eq(settings.key, setting.key),
    });

    if (!existing) {
      await db.insert(settings).values(setting);
      console.log(`✅ Created setting: ${setting.key}`);
    }
  }

  console.log("🎉 Seed completed!");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

