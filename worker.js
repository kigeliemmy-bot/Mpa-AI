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

        // Detect the language before sending the message to AI
        const lower = message.toLowerCase();

        const kinyarwandaWords = [
          "ni", "iki", "uwuhe", "iki", "angahe", "gute",
          "kuki", "he", "ryari", "u Rwanda", "ndifuza",
          "ndashaka", "mbwira", "ese", "urwanda", "umuntu",
          "abantu", "turere", "intara"
        ];

        const swahiliWords = [
          "nini", "nani", "wapi", "lini", "kwa nini",
          "vipi", "ni ngapi", "mji", "nchi", "hii",
          "huyu", "ambayo", "naweza", "nataka", "tafadhali"
        ];

        const englishWords = [
          "what", "who", "where", "when", "why", "how",
          "which", "is", "are", "the", "a", "an",
          "can", "could", "would", "should", "tell",
          "give", "explain", "capital", "country"
        ];

        const countMatches = (words) =>
          words.reduce(
            (count, word) =>
              count + (lower.includes(word.toLowerCase()) ? 1 : 0),
            0
          );

        const rwScore = countMatches(kinyarwandaWords);
        const swScore = countMatches(swahiliWords);
        const enScore = countMatches(englishWords);

        let language = "Kinyarwanda";

        if (enScore > rwScore && enScore > swScore) {
          language = "English";
        } else if (swScore > rwScore && swScore > enScore) {
          language = "Swahili";
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages: [
              {
                role: "system",
                content: `
You are Mpa AI.

The user's detected language is: ${language}

IMPORTANT:
- Reply ONLY in ${language}.
- Do not translate the user's question.
- Do not use another language in your answer.
- If the detected language is English, answer entirely in English.
- If the detected language is Kinyarwanda, answer entirely in Kinyarwanda.
- If the detected language is Swahili, answer entirely in Swahili.
- Keep the answer clear, natural and concise.
- Do not invent facts.
- If you are not sure, say that you are not sure.

For Rwanda:
- Rwanda has 30 districts.
- Rwanda has 4 provinces and the City of Kigali.
- The four provinces are Southern, Western, Northern and Eastern Province.
- If asked for districts, answer 30.
- If asked for provinces, answer the four provinces and the City of Kigali.
`
              },
              {
                role: "user",
                content: message
              }
            ]
          }
        );

        return Response.json({
          answer:
            result.response ||
            "Ntabwo nabashije kubona igisubizo."
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
