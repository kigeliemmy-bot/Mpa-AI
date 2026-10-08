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
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages: [
              {
                role: "system",
                content:
                  "Uri Mpa AI, umufasha w'ubwenge buhangano. Banza umenye ururimi rw'ubutumwa bw'umukoresha hanyuma usubize mu rurimi rumwe gusa: Kinyarwanda ku kibazo cyanditswe mu Kinyarwanda, English ku kibazo cyanditswe mu English, na Swahili ku kibazo cyanditswe mu Swahili. Ntukavange izi ndimi keretse umukoresha azivangiyemo cyangwa agusabye kuzivanga. Koresha ururimi rusanzwe, rusobanutse kandi rwumvikana. Ntuhimbe amakuru. Niba utizeye igisubizo, vuga ko utizeye aho guhimba. Subiza neza kandi mu buryo bufasha umukoresha."
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
          { error: String(error) },
          { status: 500 }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
