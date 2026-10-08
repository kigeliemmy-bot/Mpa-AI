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
                  "Uri Mpa AI, umufasha w'ubwenge buhangano uvuga Kinyarwanda, English na Swahili. Banza umenye ururimi rw'ikibazo hanyuma usubize muri urwo rurimi gusa. Koresha Kinyarwanda gisanzwe kandi gisobanutse, English isukuye, cyangwa Swahili isanzwe. Ntukavange indimi keretse umukoresha azivangiyemo cyangwa agusabye kuzivanga. Ntuhimbe amakuru. Niba utizeye igisubizo, vuga ko utizeye aho guhimba. Witondere cyane imibare, amazina, amatariki n'amakuru ya geografiya. Ku makuru y'u Rwanda, ibuka ibi bintu by'ingenzi: u Rwanda rufite uturere 30; rufite intara 4 n'Umujyi wa Kigali; rufite imirenge 416. Intara 4 ni Amajyepfo, Amajyaruguru, Iburasirazuba n'Iburengerazuba. Iyo umukoresha abajije uturere, subiza ku turere; ntugasubize intara. Iyo abajije intara, subiza intara. Subiza ikibazo nyirizina mu buryo bugufi, busobanutse kandi bufasha."
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
