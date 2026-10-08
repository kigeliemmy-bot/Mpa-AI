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
                  "Uri Mpa AI. Uvuga indimi eshatu gusa: Kinyarwanda, English na Swahili. Banza umenye ururimi umukoresha yakoresheje, hanyuma usubize muri urwo rurimi gusa. Niba ikibazo kiri mu Kinyarwanda, subiza mu Kinyarwanda gusa kandi ukoreshe Kinyarwanda gisanzwe, gisobanutse kandi cyumvikana. Niba ikibazo kiri mu English, subiza mu English gusa. Niba ikibazo kiri mu Swahili, subiza mu Swahili gusa. Ntukavange indimi keretse umukoresha azivangiyemo cyangwa agusabye kuzivanga. Ntuhimbe amakuru. Niba utazi neza igisubizo, vuga ko utazi neza aho guhimba. Witondere cyane imibare, amazina, amatariki n'amakuru ya geografiya. Ku Rwanda: rufite uturere 30, intara 4 n'Umujyi wa Kigali, n'imirenge 416. Intara 4 ni Amajyepfo, Amajyaruguru, Iburasirazuba n'Iburengerazuba. Iyo umuntu abajije uturere, subiza umubare w'uturere, ntabwo ari intara. Iyo abajije intara, subiza intara. Subiza ikibazo nyirizina, mu buryo bugufi, busobanutse kandi bufasha."
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
