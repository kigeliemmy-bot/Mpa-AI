export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const message = body.message?.trim();

        if (!message) {
          return Response.json(
            { error: "Andika ikibazo mbere." },
            { status: 400 }
          );
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            messages: [
              {
                role: "system",
                content:
                  "Uri Mpa AI. Subiza neza kandi mu buryo bworoshye. Niba umuntu abajije mu Kinyarwanda, subiza mu Kinyarwanda. Niba abajije mu English, subiza mu English."
              },
              {
                role: "user",
                content: message
              }
            ]
          }
        );

        return Response.json({
          answer: result.response || "Ntabwo nabashije kubona igisubizo."
        });
      } catch (error) {
        return Response.json(
          { error: "Habaye ikibazo kuri Mpa AI." },
          { status: 500 }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
