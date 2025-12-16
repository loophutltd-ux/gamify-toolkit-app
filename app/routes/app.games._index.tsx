import { useEffect, useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const games = await prisma.game.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  // Add example game if no games exist
  if (games.length === 0) {
    const exampleGame = await prisma.game.create({
      data: {
        shop: session.shop,
        title: "2048 - Example Game",
        description: "A fun puzzle game where you combine tiles to reach 2048! This is a free example game you can try.",
        gameUrl: "https://play2048.co/",
        thumbnailUrl: "",
        width: 800,
        height: 600,
      },
    });
    games.push(exampleGame);
  }

  return { games };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "delete") {
    const id = formData.get("id") as string;
    await prisma.game.delete({
      where: { id, shop: session.shop },
    });
    return { success: true, action: "deleted" };
  }

  if (action === "create") {
    const gameData = {
      shop: session.shop,
      title: formData.get("title") as string,
      description: formData.get("description") as string || "",
      gameUrl: formData.get("gameUrl") as string,
      thumbnailUrl: formData.get("thumbnailUrl") as string || "",
      width: parseInt(formData.get("width") as string) || 800,
      height: parseInt(formData.get("height") as string) || 600,
    };

    const game = await prisma.game.create({
      data: gameData,
    });

    return { success: true, action: "created", game };
  }

  return { success: false };
};

export default function GamesIndex() {
  const { games } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    gameUrl: "",
    thumbnailUrl: "",
    width: "800",
    height: "600",
  });

  useEffect(() => {
    if (fetcher.data?.success && fetcher.data.action === "created") {
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        gameUrl: "",
        thumbnailUrl: "",
        width: "800",
        height: "600",
      });
    }
  }, [fetcher.data]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this game?")) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("id", id);
      fetcher.submit(formData, { method: "POST" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append("action", "create");
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });
    fetcher.submit(submitData, { method: "POST" });
  };

  return (
    <s-page heading="WebGL Games">
      <s-button 
        slot="primary-action" 
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Cancel" : "Add New Game"}
      </s-button>

      {showForm && (
        <s-section>
          <s-stack direction="block" gap="base">
            <s-heading>Add New Game</s-heading>
            <form onSubmit={handleSubmit}>
              <s-stack direction="block" gap="base">
                <s-text-field
                  label="Game Title"
                  value={formData.title}
                  onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                
                <s-text-field
                  label="Description"
                  value={formData.description}
                  onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                />

                <s-text-field
                  label="Game URL"
                  value={formData.gameUrl}
                  onChange={(e: any) => setFormData({ ...formData, gameUrl: e.target.value })}
                  type="url"
                  required
                  helpText="Enter the full URL where your WebGL game is hosted"
                />

                <s-text-field
                  label="Thumbnail URL (Optional)"
                  value={formData.thumbnailUrl}
                  onChange={(e: any) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  type="url"
                />

                <s-stack direction="inline" gap="base">
                  <s-text-field
                    label="Width (px)"
                    value={formData.width}
                    onChange={(e: any) => setFormData({ ...formData, width: e.target.value })}
                    type="number"
                  />

                  <s-text-field
                    label="Height (px)"
                    value={formData.height}
                    onChange={(e: any) => setFormData({ ...formData, height: e.target.value })}
                    type="number"
                  />
                </s-stack>

                <s-stack direction="inline" gap="base">
                  <s-button 
                    type="submit" 
                    {...(fetcher.state === "submitting" ? { loading: true } : {})}
                  >
                    Add Game
                  </s-button>
                  <s-button 
                    variant="tertiary" 
                    onClick={() => setShowForm(false)}
                    type="button"
                  >
                    Cancel
                  </s-button>
                </s-stack>
              </s-stack>
            </form>
          </s-stack>
        </s-section>
      )}

      <s-section heading="Your Games">
        {games.length === 0 ? (
          <s-paragraph>
            No games yet. Click "Add New Game" to get started!
          </s-paragraph>
        ) : (
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
                    <s-button
                      variant="primary"
                      tone="critical"
                      onClick={() => handleDelete(game.id)}
                    >
                      Delete
                    </s-button>
                  </s-stack>

                  {game.description && (
                    <s-paragraph>{game.description}</s-paragraph>
                  )}

                  <s-stack direction="block" gap="tight">
                    <s-text>
                      <strong>URL:</strong> {game.gameUrl}
                    </s-text>
                    <s-text>
                      <strong>Size:</strong> {game.width}px × {game.height}px
                    </s-text>
                    <s-text>
                      <strong>Created:</strong> {new Date(game.createdAt).toLocaleDateString()}
                    </s-text>
                  </s-stack>

                  {game.thumbnailUrl && (
                    <img 
                      src={game.thumbnailUrl} 
                      alt={game.title}
                      style={{ maxWidth: "200px", borderRadius: "8px" }}
                    />
                  )}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="How to Use">
        <s-unordered-list>
          <s-list-item>
            Add your WebGL games using the "Add New Game" button
          </s-list-item>
          <s-list-item>
            Make sure your game is hosted and accessible via HTTPS
          </s-list-item>
          <s-list-item>
            Go to your theme editor and add the "WebGL Game" block
          </s-list-item>
          <s-list-item>
            Enter your game URL in the block settings
          </s-list-item>
          <s-list-item>
            Customers can click the fullscreen button to play in fullscreen mode
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Tips">
        <s-paragraph>
          <strong>Game Hosting:</strong> Your WebGL game must be hosted on a server
          that allows iframe embedding (X-Frame-Options must allow it).
        </s-paragraph>
        <s-paragraph>
          <strong>Performance:</strong> Optimize your games for web performance.
          Consider file size and loading times.
        </s-paragraph>
        <s-paragraph>
          <strong>Mobile:</strong> Test your games on mobile devices to ensure
          they work well on all screen sizes.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
