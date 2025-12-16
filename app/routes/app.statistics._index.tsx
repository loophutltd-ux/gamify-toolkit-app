import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get all games with their analytics
  const games = await prisma.game.findMany({
    where: { shop: session.shop },
    include: {
      analytics: {
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate totals for each game
  const gamesWithStats = games.map((game) => {
    const totalImpressions = game.analytics.reduce((sum, a) => sum + a.impressions, 0);
    const totalPlays = game.analytics.reduce((sum, a) => sum + a.plays, 0);
    const totalPlaytime = game.analytics.reduce((sum, a) => sum + a.totalPlaytimeSeconds, 0);
    const playRate = totalImpressions > 0 ? ((totalPlays / totalImpressions) * 100).toFixed(1) : 0;

    return {
      ...game,
      totalImpressions,
      totalPlays,
      totalPlaytime,
      playRate,
    };
  });

  // Get overall stats
  const totalImpressions = gamesWithStats.reduce((sum, g) => sum + g.totalImpressions, 0);
  const totalPlays = gamesWithStats.reduce((sum, g) => sum + g.totalPlays, 0);
  const totalPlaytime = gamesWithStats.reduce((sum, g) => sum + g.totalPlaytime, 0);
  const overallPlayRate = totalImpressions > 0 ? ((totalPlays / totalImpressions) * 100).toFixed(1) : 0;

  return {
    games: gamesWithStats,
    overallStats: {
      totalImpressions,
      totalPlays,
      totalPlaytime,
      overallPlayRate,
    },
  };
};

export default function Statistics() {
  const { games, overallStats } = useLoaderData<typeof loader>();

  const formatPlaytime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatAvgPlaytime = (totalSeconds: number, plays: number) => {
    if (plays === 0) return "0s";
    const avgSeconds = Math.floor(totalSeconds / plays);
    return formatPlaytime(avgSeconds);
  };

  return (
    <s-page heading="Statistics">
      <s-section heading="Overall Performance">
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="inline" gap="large">
            <s-stack direction="block" gap="tight">
              <s-text variant="bodyLg" fontWeight="bold">
                {overallStats.totalImpressions.toLocaleString()}
              </s-text>
              <s-text tone="subdued">Total Impressions</s-text>
            </s-stack>
            <s-stack direction="block" gap="tight">
              <s-text variant="bodyLg" fontWeight="bold">
                {overallStats.totalPlays.toLocaleString()}
              </s-text>
              <s-text tone="subdued">Total Plays</s-text>
            </s-stack>
            <s-stack direction="block" gap="tight">
              <s-text variant="bodyLg" fontWeight="bold">
                {overallStats.overallPlayRate}%
              </s-text>
              <s-text tone="subdued">Play Rate</s-text>
            </s-stack>
            <s-stack direction="block" gap="tight">
              <s-text variant="bodyLg" fontWeight="bold">
                {formatPlaytime(overallStats.totalPlaytime)}
              </s-text>
              <s-text tone="subdued">Total Playtime</s-text>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      {games.length === 0 ? (
        <s-section heading="No Games Yet">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              You haven&apos;t added any games yet. Add your first game to start tracking analytics!
            </s-paragraph>
            <s-button href="/app/games">Add Your First Game</s-button>
          </s-stack>
        </s-section>
      ) : (
        <s-section heading="Game Performance">
          <s-stack direction="block" gap="base">
            {games.map((game) => (
              <s-box
                key={game.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="base" align="space-between">
                    <s-heading>{game.title}</s-heading>
                    <s-text tone="subdued">
                      Added {new Date(game.createdAt).toLocaleDateString()}
                    </s-text>
                  </s-stack>

                  <s-stack direction="inline" gap="large">
                    <s-stack direction="block" gap="tight">
                      <s-text variant="bodyLg" fontWeight="bold">
                        {game.totalImpressions.toLocaleString()}
                      </s-text>
                      <s-text tone="subdued">Impressions</s-text>
                    </s-stack>
                    <s-stack direction="block" gap="tight">
                      <s-text variant="bodyLg" fontWeight="bold">
                        {game.totalPlays.toLocaleString()}
                      </s-text>
                      <s-text tone="subdued">Plays</s-text>
                    </s-stack>
                    <s-stack direction="block" gap="tight">
                      <s-text variant="bodyLg" fontWeight="bold">
                        {game.playRate}%
                      </s-text>
                      <s-text tone="subdued">Play Rate</s-text>
                    </s-stack>
                    <s-stack direction="block" gap="tight">
                      <s-text variant="bodyLg" fontWeight="bold">
                        {formatPlaytime(game.totalPlaytime)}
                      </s-text>
                      <s-text tone="subdued">Total Playtime</s-text>
                    </s-stack>
                    <s-stack direction="block" gap="tight">
                      <s-text variant="bodyLg" fontWeight="bold">
                        {formatAvgPlaytime(game.totalPlaytime, game.totalPlays)}
                      </s-text>
                      <s-text tone="subdued">Avg. Session</s-text>
                    </s-stack>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        </s-section>
      )}

      <s-section slot="aside" heading="About Analytics">
        <s-paragraph>
          Track how customers interact with your games. Metrics are collected based on your settings preferences.
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            <strong>Impressions:</strong> Number of times the game was viewed
          </s-list-item>
          <s-list-item>
            <strong>Plays:</strong> Number of times the game was started
          </s-list-item>
          <s-list-item>
            <strong>Play Rate:</strong> Percentage of impressions that led to plays
          </s-list-item>
          <s-list-item>
            <strong>Playtime:</strong> Total time customers spent playing
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Manage Settings">
        <s-paragraph>
          Control which metrics are tracked in the{" "}
          <s-link href="/app/settings">Settings</s-link> page.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
