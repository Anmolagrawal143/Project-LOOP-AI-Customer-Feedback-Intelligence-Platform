import {
  PrismaClient,
  FeedbackChannel,
  FeedbackSentiment,
  FeedbackStatus,
  Role,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const FEEDBACK_SAMPLES = [
  "The onboarding flow is confusing — I couldn't find where to invite my team.",
  "Love the new dashboard! Much cleaner than before.",
  "Export to CSV failed twice this week. Very frustrating.",
  "Dark mode would be a great addition for late-night work sessions.",
  "Customer support responded within an hour. Impressive!",
  "The mobile app crashes when I open notifications.",
  "Pricing is fair for the features offered.",
  "Would love integration with Slack for real-time alerts.",
  "Search is too slow when filtering by date range.",
  "The tutorial videos were incredibly helpful for getting started.",
  "Billing page shows incorrect tax amount for EU customers.",
  "Notifications are too noisy — need better granular controls.",
  "Great product overall, but the UI feels dated in places.",
  "API documentation is excellent and well-organized.",
  "Unable to reset password — the link expired immediately.",
  "The sentiment analysis feature saved us hours of manual tagging.",
  "Widget embed code doesn't work on WordPress sites.",
  "Team permissions are exactly what we needed.",
  "Monthly report emails arrive a day late consistently.",
  "Would pay extra for SSO / SAML support.",
  "Feedback inbox sorting by priority is a game changer.",
  "Page load times have improved noticeably after the last update.",
  "Can't bulk-assign feedback items to themes.",
  "The free trial was long enough to evaluate properly.",
  "Color contrast in the settings panel fails accessibility checks.",
  "Integration with Zendesk syncs perfectly.",
  "Need a way to tag feedback with custom labels.",
  "The analyst role permissions feel too restrictive.",
  "Exporting charts as PNG would help with executive reports.",
  "Login with Google would simplify onboarding for our org.",
];

const CHANNELS = Object.values(FeedbackChannel);
const SENTIMENTS = Object.values(FeedbackSentiment);
const STATUSES = Object.values(FeedbackStatus);

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generateFeedbackContent(index: number): string {
  const base = FEEDBACK_SAMPLES[index % FEEDBACK_SAMPLES.length];
  const suffix = index >= FEEDBACK_SAMPLES.length ? ` (Report #${index + 1})` : "";
  return `${base}${suffix}`;
}

async function main() {
  console.log("Seeding database...");

  await prisma.feedback.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Insights Co.",
    },
  });

  const defaultPassword = "password123";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alex Admin",
        email: "admin@acme-insights.com",
        passwordHash,
        role: Role.ADMIN,
        workspaceId: workspace.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sam Analyst",
        email: "analyst@acme-insights.com",
        passwordHash,
        role: Role.ANALYST,
        workspaceId: workspace.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Victor Viewer",
        email: "viewer@acme-insights.com",
        passwordHash,
        role: Role.VIEWER,
        workspaceId: workspace.id,
      },
    }),
  ]);

  const themes = await Promise.all([
    prisma.theme.create({
      data: { name: "Onboarding", workspaceId: workspace.id },
    }),
    prisma.theme.create({
      data: { name: "Performance", workspaceId: workspace.id },
    }),
    prisma.theme.create({
      data: { name: "Feature Requests", workspaceId: workspace.id },
    }),
    prisma.theme.create({
      data: { name: "Bug Reports", workspaceId: workspace.id },
    }),
  ]);

  const feedbackData = Array.from({ length: 50 }, (_, index) => ({
    content: generateFeedbackContent(index),
    channel: pickRandom(CHANNELS),
    sentiment: pickRandom(SENTIMENTS),
    status: pickRandom(STATUSES),
    workspaceId: workspace.id,
  }));

  await prisma.feedback.createMany({ data: feedbackData });

  console.log("Seed completed successfully.");
  console.log(`Workspace: ${workspace.name} (${workspace.id})`);
  console.log("Users created:");
  users.forEach((user) => {
    console.log(`  - ${user.name} <${user.email}> [${user.role}]`);
  });
  console.log(`Themes: ${themes.length}`);
  console.log(`Feedback items: ${feedbackData.length}`);
  console.log(`Default password for all users: ${defaultPassword}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
