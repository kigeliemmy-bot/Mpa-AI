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
const lower = message.toLowerCase().trim();

const kinyarwandaPatterns = [
  /\bni\b/,
  /\biki\b/,
  /\buwuhe\b/,
  /\buwuhe\b/,
  /\bangahe\b/,
  /\bgute\b/,
  /\bkuki\b/,
  /\bhe\b/,
  /\bryari\b/,
  /\bese\b/,
  /\burwanda\b/,
  /\bndifuza\b/,
  /\bndashaka\b/,
  /\bmbwira\b/,
  /\bumuntu\b/,
  /\babantu\b/,
  /\bturere\b/,
  /\bintara\b/,
  /\babaturage\b/,
  /\bnabantu\b/,
  /\bngahe\b/,
  /\bikihe\b/,
  /\buri\b/,
  /\bufite\b/,
  /\brufite\b/,
  /\bndashaka\b/,
  /\bndabaza\b/,
  /\bndakubaza\b/,
  /\bwakora\b/,
  /\bwakomoka\b/,
  /\buri hehe\b/,
  /\bni nde\b/,
  /\bni iki\b/,
  /\bni bangahe\b/
];

const swahiliPatterns = [
  /\bnini\b/,
  /\bnani\b/,
  /\bwapi\b/,
  /\blini\b/,
  /\bkwa nini\b/,
  /\bvipi\b/,
  /\bngapi\b/,
  /\bmji\b/,
  /\bnchi\b/,
  /\bhii\b/,
  /\bhuyu\b/,
  /\bnaweza\b/,
  /\bnataka\b/,
  /\btafadhali\b/
];

const englishPatterns = [
  /\bwhat\b/,
  /\bwho\b/,
  /\bwhere\b/,
  /\bwhen\b/,
  /\bwhy\b/,
  /\bhow\b/,
  /\bwhich\b/,
  /\bis\b/,
  /\bare\b/,
  /\bthe\b/,
  /\bcan\b/,
  /\bcould\b/,
  /\bwould\b/,
  /\bshould\b/,
  /\btell\b/,
  /\bgive\b/,
  /\bexplain\b/,
  /\bcapital\b/,
  /\bcountry\b/
];

const countPatterns = (patterns) =>
  patterns.reduce(
    (count, pattern) => count + (pattern.test(lower) ? 1 : 0),
    0
  );

const rwScore = countPatterns(kinyarwandaPatterns);
const swScore = countPatterns(swahiliPatterns);
const enScore = countPatterns(englishPatterns);

// Kinyarwanda is the default language.
// This is important for short Rwanda/Kinyarwanda questions.
let language = "Kinyarwanda";

if (enScore > rwScore && enScore > swScore) {
  language = "English";
} else if (swScore > rwScore && swScore > enScore) {
  language = "Swahili";
}

// Extra protection for common Kinyarwanda sentence patterns
if (
  /\b(urwanda|rwanda|rwa|rwo|rwe|ruri|rufite|ufite|abantu|abaturage|intara|turere|bangahe|ngahe|gute|kuki|ryari|uwuhe|ni nde|ni iki)\b/.test(lower)
) {
  language = "Kinyarwanda";
}
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
