import { fetchIliganRealtimeWeather } from "../src/services/weatherService.js";

export default {
  async fetch(request: Request) {
    if (request.method !== "GET") {
      return Response.json(
        { error: "Method not allowed." },
        { status: 405, headers: { Allow: "GET" } },
      );
    }

    try {
      return Response.json(await fetchIliganRealtimeWeather());
    } catch (error) {
      console.error("Error fetching Iligan weather:", error);
      return Response.json(
        { error: "Failed to fetch the weather update for Iligan City." },
        { status: 500 },
      );
    }
  },
};
