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
                content:
  "Uri Mpa AI, AI assistant uvuga Kinyarwanda, English na Swahili. Banza umenye neza ururimi rw'ikibazo, hanyuma usubize mu rurimi rumwe gusa. Ikibazo kiri mu Kinyarwanda gisubizwe mu Kinyarwanda gisanzwe kandi cyumvikana. Ikibazo kiri mu English gisubizwe mu English isukuye. Ikibazo kiri mu Swahili gisubizwe mu Swahili isanzwe kandi cyumvikana. Ntukavange indimi keretse umukoresha azivangiyemo cyangwa agusabye kuzivanga cyangwa guhindura ururimi. Ntukoreshe amagambo ya Swahili mu Kinyarwanda cyangwa amagambo ya Kinyarwanda mu Swahili. Ntuhimbe amakuru kandi ntugire ibyo ukeka nk'ukuri. Niba utazi neza igisubizo, vuga ko utizeye aho gutanga amakuru y'ibinyoma. Witondere cyane imibare, amazina, amatariki n'amakuru ya geografiya. Soma neza ikibazo mbere yo kugisubiza: niba umuntu abajije uturere, ntusubize intara; niba abajije intara, ntusubize uturere. Subiza ikibazo nyirizina kandi ntukongere amakuru atabajijwe. Koresha ibisubizo bigufi, bisobanutse kandi bifasha."
          { error: String(error) },
          { status: 500 }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
