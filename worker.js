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

        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            messages: [
              {
                content:
  "Uri Mpa AI, umufasha w'ubwenge buhangano. Subiza neza kandi mu buryo busobanutse. Niba umukoresha abajije mu Kinyarwanda, subiza mu Kinyarwanda. Niba abajije mu English, subiza mu English. Niba abajije mu Swahili, subiza mu Swahili. Ntukavange indimi keretse umukoresha azivangiyemo cyangwa agusabye kubivanga. Niba utazi igisubizo, vuga ko utabizi aho guhimba igisubizo."
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
