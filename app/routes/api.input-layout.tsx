import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

// API endpoint to fetch input layouts for the storefront
// This is called from the WebGL game block to get touch control layouts
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const layoutId = url.searchParams.get("layoutId");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Shop parameter required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    let layout;

    if (layoutId && layoutId !== "default") {
      // Fetch specific layout
      layout = await prisma.inputLayout.findFirst({
        where: { 
          id: layoutId,
          shop: shop,
        },
      });
    } else {
      // Fetch default layout
      layout = await prisma.inputLayout.findFirst({
        where: { 
          shop: shop,
          isDefault: true,
        },
      });
    }

    if (!layout) {
      return new Response(JSON.stringify({ layout: null }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Parse the elements JSON
    const parsedLayout = {
      id: layout.id,
      name: layout.name,
      elements: JSON.parse(layout.elements),
    };

    return new Response(JSON.stringify({ layout: parsedLayout }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error fetching input layout:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch layout" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
