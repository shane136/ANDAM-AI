export default {
  fetch(request: Request) {
    if (request.method !== "GET") {
      return Response.json(
        { error: "Method not allowed." },
        { status: 405, headers: { Allow: "GET" } },
      );
    }

    return Response.json({
      status: "ok",
      app: "ANDAM AI - Iligan City DRRM Assistant",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  },
};
