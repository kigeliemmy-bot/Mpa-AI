export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve the website
    if (request.method === "GET") {
      return env.ASSETS.fetch(request);
    }

    // AI Chat API
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

        /*
         * LANGUAGE DETECTION
         * -----------------
         * Kinyarwanda is the default because Mpa AI
         * is designed primarily for Rwanda.
         */

        const lower = message
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        const kinyarwandaPatterns = [
          /\bni\b/,
          /\biki\b/,
          /\buwuhe\b/,
          /\buwuhe\b/,
          /\bangahe\b/,
          /\bngahe\b/,
          /\bgute\b/,
          /\bkuki\b/,
          /\bhe\b/,
          /\bhehe\b/,
          /\bryari\b/,
          /\bese\b/,
          /\burwanda\b/,
          /\brwanda\b/,
          /\brufite\b/,
          /\bufite\b/,
          /\buri\b/,
          /\buri hehe\b/,
          /\bndifuza\b/,
          /\bndashaka\b/,
          /\bmbwira\b/,
          /\bumuntu\b/,
          /\babantu\b/,
          /\babaturage\b/,
          /\bturere\b/,
          /\bintara\b/,
          /\bndabaza\b/,
          /\bndakubaza\b/,
          /\bwakora\b/,
          /\bwakomoka\b/,
          /\bni nde\b/,
          /\bni iki\b/,
          /\bni bangahe\b/,
          /\bnuwuhe\b/,
          /\bninde\b/,
          /\bwakunze\b/,
          /\bwakwita\b/,
          /\bwavuga\b/,
          /\buziko\b/,
          /\bntabwo\b/,
          /\byego\b/,
          /\bhoya\b/,
          /\bndabona\b/,
          /\bndumva\b/,
          /\bndifuza\b/,
          /\bndashaka\b/,
          /\bcyangwa\b/,
          /\bcyane\b/,
          /\bnone\b/,
          /\bubu\b/,
          /\buyu munsi\b/
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
          /\bambayo\b/,
          /\bnaweza\b/,
          /\bnataka\b/,
          /\btafadhali\b/,
          /\bhabari\b/,
          /\bmaana\b/,
          /\bkwa\b/,
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
          /\bwhen\b/,
          /\bhelp\b/,
          /\bplease\b/,
          /\bmean\b/,
          /\bmeaning\b/
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

        // Kinyarwanda is the default language
        let language = "Kinyarwanda";

        if (enScore > rwScore && enScore > swScore) {
          language = "English";
        } else if (swScore > rwScore && swScore > enScore) {
          language = "Swahili";
        }

        /*
         * STRONG KINYARWANDA PROTECTION
         * --------------------------------
         * These words should strongly indicate Kinyarwanda,
         * even when the question is short.
         */

        const strongKinyarwanda =
          /\b(urwanda|rwanda|rwo|rwa|rwe|ruri|rufite|ufite|abantu|abaturage|intara|turere|bangahe|ngahe|gute|kuki|ryari|uwuhe|nuwuhe|ni nde|ninde|ni iki|ndifuza|ndashaka|mbwira|ndabaza|ndakubaza|cyane|none|ubu|uyu munsi)\b/
            .test(lower);

        if (strongKinyarwanda) {
          language = "Kinyarwanda";
        }

        /*
         * AI SYSTEM INSTRUCTIONS
         */

        const systemPrompt = `
You are Mpa AI, a helpful AI assistant made for users in Rwanda.

The detected language is: ${language}

LANGUAGE RULES:
- Reply ONLY in ${language}.
- Never switch to another language unless the user asks you to translate.
- If the language is Kinyarwanda, use natural and understandable Kinyarwanda.
- If the language is English, answer entirely in English.
- If the language is Swahili, answer entirely in Swahili.
- Do not translate the user's question before answering it.

ACCURACY RULES:
- Give the most accurate answer you can.
- Never invent names, dates, numbers, events, quotations, or historical facts.
- Never combine facts about different people or historical events.
- If you are not confident about a fact, clearly say that you are not sure.
- Do not make up an answer just to sound confident.
- For historical questions, carefully distinguish between people, kings, dates, and events.
- If a question is ambiguous, explain what is unclear instead of guessing.
- Answer the exact question the user asked.
- Do not add unrelated information.

RWANDA FACTS:
- Rwanda has 30 districts.
- Rwanda has 4 provinces and the City of Kigali.
- The four provinces are Northern Province, Southern Province, Eastern Province, and Western Province.
- Kigali is the capital city of Rwanda.

RESPONSE STYLE:
- Be helpful and respectful.
- Keep simple questions concise.
- Give more explanation when the question requires it.
- Use natural Kinyarwanda when responding in Kinyarwanda.
- Do not use unnecessary English words in Kinyarwanda answers.
`;

        /*
         * SEND REQUEST TO CLOUDFLARE WORKERS AI
         */

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

        /*
         * RETURN AI RESPONSE
         */

        return Response.json({
          answer:
            result.response ||
            "Ntabwo nabashije kubona igisubizo."
        });

      } catch (error) {
        return Response.json(
          {
            error: String(error)
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
