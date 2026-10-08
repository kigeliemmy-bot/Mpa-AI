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

        // =========================
        // LANGUAGE DETECTION
        // =========================

        const lower = message
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        const kinyarwandaPatterns = [
          /\burwanda\b/,
          /\burwanda\b/,
          /\brufite\b/,
          /\bufite\b/,
          /\babantu\b/,
          /\babaturage\b/,
          /\bintara\b/,
          /\bturere\b/,
          /\bbangahe\b/,
          /\bngahe\b/,
          /\bgute\b/,
          /\bkuki\b/,
          /\bryari\b/,
          /\buwuhe\b/,
          /\bnuwuhe\b/,
          /\bni nde\b/,
          /\bninde\b/,
          /\bni iki\b/,
          /\bndifuza\b/,
          /\bndashaka\b/,
          /\bmbwira\b/,
          /\bndabaza\b/,
          /\bndakubaza\b/,
          /\bcyane\b/,
          /\bnone\b/,
          /\bubu\b/,
          /\buyu munsi\b/,
          /\bntabwo\b/,
          /\byego\b/,
          /\bhoya\b/,
          /\bndumva\b/,
          /\bndabona\b/,
          /\bwakora\b/,
          /\bwakomoka\b/,
          /\bwavuga\b/,
          /\buziko\b/,
          /\bcyangwa\b/
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
          /\btafadhali\b/,
          /\bhabari\b/,
          /\byangu\b/,
          /\byako\b/,
          /\byetu\b/,
          /\bsana\b/
        ];

        const englishPatterns = [
          /\bwhat\b/,
          /\bwho\b/,
          /\bwhere\b/,
          /\bwhen\b/,
          /\bwhy\b/,
          /\bhow\b/,
          /\bwhich\b/,
          /\bwhat's\b/,
          /\bwhats\b/,
          /\bis\b/,
          /\bare\b/,
          /\bthe\b/,
          /\ba\b/,
          /\ban\b/,
          /\bcan\b/,
          /\bcould\b/,
          /\bwould\b/,
          /\bshould\b/,
          /\btell\b/,
          /\bgive\b/,
          /\bexplain\b/,
          /\bcapital\b/,
          /\bcountry\b/,
          /\bpeople\b/,
          /\bpopulation\b/,
          /\bdistricts\b/,
          /\bprovince\b/,
          /\bking\b/,
          /\bqueen\b/,
          /\bhelp\b/,
          /\bplease\b/,
          /\bmean\b/,
          /\bmeaning\b/,
          /\bhow many\b/,
          /\bhow much\b/
        ];

        function countMatches(patterns) {
          return patterns.reduce(
            (count, pattern) =>
              count + (pattern.test(lower) ? 1 : 0),
            0
          );
        }

        const rwScore = countMatches(kinyarwandaPatterns);
        const swScore = countMatches(swahiliPatterns);
        const enScore = countMatches(englishPatterns);

        // Default language
        let language = "Kinyarwanda";

        // English wins when it has the strongest score
        if (enScore > rwScore && enScore >= swScore) {
          language = "English";
        }

        // Swahili wins when it has the strongest score
        if (swScore > rwScore && swScore > enScore) {
          language = "Swahili";
        }

        // Strong Kinyarwanda expressions
        // Notice: "rwanda" alone is NOT enough.
        const strongKinyarwanda =
          /\b(rufite|ufite|abaturage|intara|turere|bangahe|ngahe|gute|kuki|ryari|uwuhe|nuwuhe|ni nde|ninde|ni iki|ndifuza|ndashaka|mbwira|ndabaza|ndakubaza|ntabwo|yego|hoya|ndumva|ndabona|wakora|wakomoka|wavuga|uziko|cyangwa)\b/
            .test(lower);

        if (strongKinyarwanda) {
          language = "Kinyarwanda";
        }

        // =========================
        // SYSTEM PROMPT
        // =========================

        const systemPrompt = `
You are Mpa AI, a helpful AI assistant designed for users in Rwanda.

DETECTED LANGUAGE:
${language}

LANGUAGE RULES:
1. Reply in ${language}.
2. If the user writes in English, reply in English.
3. If the user writes in Kinyarwanda, reply in Kinyarwanda.
4. If the user writes in Swahili, reply in Swahili.
5. Never change the language unnecessarily.
6. Never mention the language detection system.
7. Never say things like "as you requested" about the language.
8. Never mix Kinyarwanda, English and Swahili unless the user asks for mixed language.

ACCURACY:
1. Do not invent facts.
2. Do not invent names, dates, statistics or historical events.
3. Never combine information about different people.
4. If you are uncertain, say so clearly.
5. Do not guess just to sound confident.
6. For historical questions, carefully distinguish people, kings, dates and events.
7. Answer the exact question asked.
8. Do not add unrelated information.

STYLE:
1. Be natural and conversational.
2. Be respectful.
3. Keep simple answers short.
4. Explain more when necessary.
5. When speaking Kinyarwanda, use natural Kinyarwanda.
6. Do not produce awkward literal translations from English.

KNOWN RWANDA FACTS:
- Rwanda has 30 districts.
- Rwanda has 4 provinces and the City of Kigali.
- The provinces are Northern Province, Southern Province, Eastern Province and Western Province.
- Kigali is the capital city of Rwanda.

IMPORTANT:
If you do not know something with reasonable confidence, say that you are not sure rather than creating information.
`;

        // =========================
        // AI REQUEST
        // =========================

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

        // =========================
        // RESPONSE
        // =========================

        return Response.json({
          answer:
            result.response ||
            "Ntabwo nabashije kubona igisubizo."
        });

      } catch (error) {
        return Response.json(
          {
            error: "Hari ikibazo cyabaye kuri server.",
            details: String(error)
          },
          {
            status: 500
          }
        );
      }
    }

    return new Response("Not found", {
      status: 404
    });
  }
};
