import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const body = await request.json();
    const { gameId, type, value, shop } = body;

    if (!gameId || !type || !shop) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get app settings to check if tracking is enabled
    const settings = await prisma.appSettings.findUnique({
      where: { shop },
    });

    // Check if tracking is enabled for this metric
    const trackingEnabled = 
      (type === "impression" && settings?.trackImpressions !== false) ||
      (type === "play" && settings?.trackPlays !== false) ||
      (type === "playtime" && settings?.trackPlaytime !== false);

    if (!trackingEnabled) {
      return new Response(JSON.stringify({ success: true, tracked: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get or create today's analytics record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await prisma.gameAnalytics.findFirst({
      where: {
        gameId,
        shop,
        date: today,
      },
    });

    if (!analytics) {
      analytics = await prisma.gameAnalytics.create({
        data: {
          gameId,
          shop,
          date: today,
          impressions: 0,
          plays: 0,
          totalPlaytimeSeconds: 0,
        },
      });
    }

    // Update the appropriate metric
    if (type === "impression") {
      await prisma.gameAnalytics.update({
        where: { id: analytics.id },
        data: { impressions: { increment: 1 } },
      });
    } else if (type === "play") {
      await prisma.gameAnalytics.update({
        where: { id: analytics.id },
        data: { plays: { increment: 1 } },
      });
    } else if (type === "playtime" && typeof value === "number") {
      await prisma.gameAnalytics.update({
        where: { id: analytics.id },
        data: { totalPlaytimeSeconds: { increment: value } },
      });
    }

    return new Response(JSON.stringify({ success: true, tracked: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
