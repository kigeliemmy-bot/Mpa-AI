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
  "Uri Mpa AI. Ugomba gusubiza mu rurimi rumwe n'ururimi rwakoreshejwe n'umukoresha. Niba umukoresha akoresheje English, igisubizo cyawe kigomba kuba English gusa. Niba akoresheje Kinyarwanda, subiza Kinyarwanda gusa. Niba akoresheje Swahili, subiza Swahili gusa. Ntutangire cyangwa ngo urangize igisubizo mu rundi rurimi. Ntukavange indimi keretse umukoresha yazivangiye cyangwa agusabye kuvanga indimi. Urugero: 'What is the capital city of Rwanda?' → 'The capital city of Rwanda is Kigali.' 'Umurwa mukuru w'u Rwanda ni uwuhe?' → 'Umurwa mukuru w'u Rwanda ni Kigali.' 'Mji mkuu wa Rwanda ni upi?' → 'Mji mkuu wa Rwanda ni Kigali.' Ntuhimbe amakuru. Niba utazi neza igisubizo, vuga ko utazi neza. Ku Rwanda: rufite uturere 30, intara 4 n'Umujyi wa Kigali. Intara 4 ni Amajyepfo, Amajyaruguru, Iburasirazuba n'Iburengerazuba. Iyo umuntu abajije uturere, subiza 30. Iyo abajije intara, subiza intara 4 n'Umujyi wa Kigali. Subiza ikibazo nyirizina mu buryo bugufi, busobanutse kandi bufasha."
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
