import { useEffect, useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get or create settings
  let settings = await prisma.appSettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        shop: session.shop,
        trackImpressions: true,
        trackPlays: true,
        trackPlaytime: true,
      },
    });
  }

  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const trackImpressions = formData.get("trackImpressions") === "true";
  const trackPlays = formData.get("trackPlays") === "true";
  const trackPlaytime = formData.get("trackPlaytime") === "true";

  const settings = await prisma.appSettings.upsert({
    where: { shop: session.shop },
    update: {
      trackImpressions,
      trackPlays,
      trackPlaytime,
    },
    create: {
      shop: session.shop,
      trackImpressions,
      trackPlays,
      trackPlaytime,
    },
  });

  return { success: true, settings };
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  
  const [trackImpressions, setTrackImpressions] = useState(settings.trackImpressions);
  const [trackPlays, setTrackPlays] = useState(settings.trackPlays);
  const [trackPlaytime, setTrackPlaytime] = useState(settings.trackPlaytime);

  useEffect(() => {
    if (fetcher.data?.success) {
      // Settings saved successfully
    }
  }, [fetcher.data]);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("trackImpressions", trackImpressions.toString());
    formData.append("trackPlays", trackPlays.toString());
    formData.append("trackPlaytime", trackPlaytime.toString());
    fetcher.submit(formData, { method: "POST" });
  };

  const hasChanges = 
    trackImpressions !== settings.trackImpressions ||
    trackPlays !== settings.trackPlays ||
    trackPlaytime !== settings.trackPlaytime;

  return (
    <s-page heading="Settings">
      <s-section heading="Analytics Tracking">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Control which metrics are collected from your games. These settings apply to all games in your store.
            Shopify handles cookie consent through the store&apos;s privacy settings.
          </s-paragraph>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
          >
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" gap="base" align="space-between">
                <s-stack direction="block" gap="tight">
                  <s-text variant="bodyLg" fontWeight="bold">
                    Track Impressions
                  </s-text>
                  <s-text tone="subdued">
                    Count how many times games are viewed on your store
                  </s-text>
                </s-stack>
                <input
                  type="checkbox"
                  checked={trackImpressions}
                  onChange={(e) => setTrackImpressions(e.target.checked)}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
              </s-stack>

              <s-stack direction="inline" gap="base" align="space-between">
                <s-stack direction="block" gap="tight">
                  <s-text variant="bodyLg" fontWeight="bold">
                    Track Plays
                  </s-text>
                  <s-text tone="subdued">
                    Count how many times customers start playing games
                  </s-text>
                </s-stack>
                <input
                  type="checkbox"
                  checked={trackPlays}
                  onChange={(e) => setTrackPlays(e.target.checked)}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
              </s-stack>

              <s-stack direction="inline" gap="base" align="space-between">
                <s-stack direction="block" gap="tight">
                  <s-text variant="bodyLg" fontWeight="bold">
                    Track Playtime
                  </s-text>
                  <s-text tone="subdued">
                    Measure how long customers spend playing games
                  </s-text>
                </s-stack>
                <input
                  type="checkbox"
                  checked={trackPlaytime}
                  onChange={(e) => setTrackPlaytime(e.target.checked)}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
              </s-stack>
            </s-stack>
          </s-box>

          <s-stack direction="inline" gap="base">
            <s-button
              onClick={handleSave}
              {...(fetcher.state === "submitting" ? { loading: true } : {})}
              {...(!hasChanges ? { disabled: true } : {})}
            >
              Save Changes
            </s-button>
            {fetcher.data?.success && (
              <s-text tone="success">Settings saved successfully!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Privacy & Cookies">
        <s-paragraph>
          This app respects your store&apos;s privacy settings. Analytics tracking follows Shopify&apos;s cookie consent framework.
        </s-paragraph>
        <s-paragraph>
          When tracking is disabled, no data will be collected from customer interactions with your games.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Data Collection">
        <s-unordered-list>
          <s-list-item>
            <strong>Impressions:</strong> Recorded when a game block is visible in the viewport
          </s-list-item>
          <s-list-item>
            <strong>Plays:</strong> Recorded when a customer clicks play or the game loads
          </s-list-item>
          <s-list-item>
            <strong>Playtime:</strong> Recorded periodically while a customer is actively playing
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="View Analytics">
        <s-paragraph>
          Check the{" "}
          <s-link href="/app/statistics">Statistics</s-link> page to see your game performance metrics.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
