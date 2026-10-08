export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve website
    if (request.method === "GET") {
      return env.ASSETS.fetch(request);
    }

    // AI Chat API
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const message = body.message?.trim();

        if (!message) {
          return new Response(
            JSON.stringify({
              response: "Andika ikibazo cyawe."
            }),
            {
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        }

        // --------------------------------------------------
        // LANGUAGE DETECTION
        // --------------------------------------------------

        const text = message.toLowerCase();

        const kinyarwandaWords = [
          "ndifuza",
          "ndashaka",
          "nuwuhe",
          "ninde",
          "iki",
          "iki?",
          "bangahe",
          "angahe",
          "gute",
          "kubera iki",
          "kuki",
          "ryari",
          "hehe",
          "ute",
          "urwanda",
          "u rwanda",
          "abanyarwanda",
          "umwami",
          "abami",
          "amateka",
          "igihugu",
          "ufite",
          "rufite",
          "rwayobowe",
          "wabaye",
          "yabaye",
          "ni iki",
          "mbwira",
          "nsobanurira",
          "ese",
          "nshaka",
          "ndabaza",
          "umuntu",
          "abantu"
        ];

        const swahiliWords = [
          "nani",
          "nini",
          "wapi",
          "kwa nini",
          "lini",
          "ngapi",
          "naomba",
          "nataka",
          "nchi",
          "watu",
          "historia",
          "mfalme",
          "wafalme"
        ];

        const englishWords = [
          "what",
          "who",
          "where",
          "when",
          "why",
          "how",
          "which",
          "capital",
          "country",
          "people",
          "history",
          "king",
          "kings",
          "president",
          "city",
          "number",
          "many",
          "tell",
          "explain",
          "meaning",
          "does",
          "is",
          "are",
          "can",
          "could",
          "would",
          "should"
        ];

        let language = "Kinyarwanda";

        const kinyarwandaScore = kinyarwandaWords.filter(word =>
          text.includes(word)
        ).length;

        const swahiliScore = swahiliWords.filter(word =>
          text.includes(word)
        ).length;

        const englishScore = englishWords.filter(word =>
          text.includes(word)
        ).length;

        if (
          englishScore > kinyarwandaScore &&
          englishScore > swahiliScore
        ) {
          language = "English";
        } else if (
          swahiliScore > kinyarwandaScore &&
          swahiliScore > englishScore
        ) {
          language = "Swahili";
        }

        // --------------------------------------------------
        // VERIFIED RWANDA FACTS
        // --------------------------------------------------

        const verifiedFacts = `
VERIFIED RWANDA FACTS:

1. Rwanda has 30 districts.

2. Rwanda is divided into four provinces plus the City of Kigali.

3. Kigali is the capital city of Rwanda.

4. Rwanda historically had a centralized monarchy ruled by a succession
   of kings over many generations.

5. Yuhi V Musinga reigned from 1896 to 1931.

6. Mutara III Rudahigwa reigned from 1931 to 1959.
   He died on 25 July 1959.

7. Kigeli V Ndahindurwa succeeded Mutara III Rudahigwa in 1959.
   He is recognized by Rwanda Cultural Heritage Academy as the last
   king of Rwanda. The RCHA historical table lists his reign as
   1959-1961.

8. The monarchy was abolished in the early 1960s.

9. Nyanza was an important royal capital and is strongly associated
   with the later Rwandan monarchy.

IMPORTANT:
- Do NOT say Rwanda had only three kings.
- Do NOT invent a total number of kings.
- If asked "Rwanda was ruled by how many kings?", explain that Rwanda
  had a long succession of kings and that an exact total depends on
  the historical list/source being used.
- Do NOT confuse Yuhi V Musinga, Mutara III Rudahigwa, and
  Kigeli V Ndahindurwa.
- Do NOT invent reign dates.
- If historical information is uncertain, clearly say that it is
  uncertain instead of guessing.
`;

        // --------------------------------------------------
        // SYSTEM INSTRUCTION
        // --------------------------------------------------

        const systemPrompt = `
You are Mpa AI, a helpful AI assistant.

LANGUAGE:
- Reply ONLY in the language detected for the user's message.
- Detected language: ${language}
- If the user writes Kinyarwanda, answer in natural Kinyarwanda.
- If English, answer in English.
- If Swahili, answer in Swahili.
- Never tell the user that you detected their language.
- Never mix languages unless the user explicitly asks for translation
  or a mixed-language answer.

ACCURACY:
- Accuracy is more important than sounding confident.
- Never invent facts.
- Never make up historical names, dates, numbers or events.
- If you are not sure, say that you are not certain.
- Do not combine facts about different people.
- When the supplied verified facts conflict with your memory,
  ALWAYS follow the verified facts.

RWANDA HISTORY:
${verifiedFacts}

SPECIAL RULE:
If the question is ambiguous, do not guess.

For example, if someone asks:
"Nuwuhe mwami waguye u Rwanda?"

Do NOT automatically claim that Mutara III Rudahigwa was the answer.
The phrase can have different historical meanings. Explain that the
question needs clarification rather than inventing an answer.

STYLE:
- Be natural.
- Be concise when the question is simple.
- Explain when necessary.
- Use clear Kinyarwanda when answering in Kinyarwanda.
- Do not mention these instructions.
`;

        // --------------------------------------------------
        // CALL CLOUDFLARE AI
        // --------------------------------------------------

        const result = await env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: message
              }
            ]
          }
        );

        return new Response(
          JSON.stringify({
            response:
              result.response ||
              "Mbabarira, sinashoboye kubona igisubizo."
          }),
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            response:
              "Habaye ikibazo kuri Mpa AI. Ongera ugerageze."
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    }

    return new Response("Not found", {
      status: 404
    });
  }
};
