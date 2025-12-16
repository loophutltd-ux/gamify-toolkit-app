import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get game count and recent analytics
  const gameCount = await prisma.game.count({
    where: { shop: session.shop },
  });

  const recentGames = await prisma.game.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Get total stats across all games
  const analytics = await prisma.gameAnalytics.findMany({
    where: { shop: session.shop },
  });

  const totalImpressions = analytics.reduce((sum, a) => sum + a.impressions, 0);
  const totalPlays = analytics.reduce((sum, a) => sum + a.plays, 0);
  const totalPlaytime = analytics.reduce((sum, a) => sum + a.totalPlaytimeSeconds, 0);

  return {
    gameCount,
    recentGames,
    totalImpressions,
    totalPlays,
    totalPlaytime,
  };
};

export default function Index() {
  const { gameCount, recentGames, totalImpressions, totalPlays, totalPlaytime } = useLoaderData<typeof loader>();

  const formatPlaytime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <s-page heading="Gamify Toolkit">
      <s-button slot="primary-action" href="/app/games">
        Manage Games
      </s-button>

      <s-section heading="Welcome to Gamify Toolkit 🎮">
        <s-paragraph>
          Add interactive WebGL games to your store to increase engagement and keep 
          customers entertained. Track plays, impressions, and playtime to understand 
          how your customers interact with your games.
        </s-paragraph>
      </s-section>

      <s-section heading="Quick Stats">
        <s-stack direction="block" gap="base">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="inline" gap="large">
              <s-stack direction="block" gap="tight">
                <s-text variant="bodyLg" fontWeight="bold">
                  {gameCount}
                </s-text>
                <s-text tone="subdued">Total Games</s-text>
              </s-stack>
              <s-stack direction="block" gap="tight">
                <s-text variant="bodyLg" fontWeight="bold">
                  {totalImpressions.toLocaleString()}
                </s-text>
                <s-text tone="subdued">Total Impressions</s-text>
              </s-stack>
              <s-stack direction="block" gap="tight">
                <s-text variant="bodyLg" fontWeight="bold">
                  {totalPlays.toLocaleString()}
                </s-text>
                <s-text tone="subdued">Total Plays</s-text>
              </s-stack>
              <s-stack direction="block" gap="tight">
                <s-text variant="bodyLg" fontWeight="bold">
                  {formatPlaytime(totalPlaytime)}
                </s-text>
                <s-text tone="subdued">Total Playtime</s-text>
              </s-stack>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      {gameCount === 0 ? (
        <s-section heading="Get Started">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              You haven&apos;t added any games yet. Get started by adding your first game!
            </s-paragraph>
            <s-button href="/app/games">Add Your First Game</s-button>
          </s-stack>
        </s-section>
      ) : (
        <s-section heading="Recent Games">
          <s-stack direction="block" gap="base">
            {recentGames.map((game) => (
              <s-box
                key={game.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="inline" gap="base" align="space-between">
                  <s-stack direction="block" gap="tight">
                    <s-text variant="headingSm">{game.title}</s-text>
                    {game.description && (
                      <s-text tone="subdued">{game.description}</s-text>
                    )}
                  </s-stack>
                  <s-button href="/app/games" variant="tertiary">
                    View All
                  </s-button>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        </s-section>
      )}

      <s-section slot="aside" heading="Quick Links">
        <s-unordered-list>
          <s-list-item>
            <s-link href="/app/games">Manage Games</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/statistics">View Analytics</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/settings">App Settings</s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="How It Works">
        <s-unordered-list>
          <s-list-item>Add games in the Games section</s-list-item>
          <s-list-item>
            Go to your theme editor and add the &quot;WebGL Game&quot; block
          </s-list-item>
          <s-list-item>Configure settings and publish</s-list-item>
          <s-list-item>Track engagement in the Statistics page</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
