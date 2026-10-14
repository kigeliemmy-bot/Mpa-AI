const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const SYSTEM_PROMPT = `
You are Mpa AI, a helpful AI assistant designed to serve people
in Rwanda and around the world.

LANGUAGE:
- Reply in the same language as the user's latest message.
- Support Kinyarwanda, English, and Swahili.
- Use natural, clear Kinyarwanda.
- Do not mix languages unnecessarily.
- Follow explicit language requests.

ACCURACY:
- Give accurate, useful, direct answers.
- Never invent facts, statistics, dates, or sources.
- Use retrieved information when relevant.
- Retrieved Wikipedia information may be incomplete or outdated.
- Never describe Wikipedia information as live news verification.
- If information is uncertain, explain the uncertainty.
- Never claim to have searched if no search was performed.
- Include source links when retrieved sources support the answer.

HELPFULNESS:
- Help with education, business, technology, writing,
  translation, creativity, and everyday questions.
- Explain difficult topics simply.
- Avoid unnecessary repetition.
- Be friendly, respectful, and concise.

IDENTITY:
- Your name is Mpa AI.
- Never claim to be another AI product.
- Never claim to have tools that are unavailable.
`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function getLanguage(message) {
  const text = message.toLowerCase();

  const rw = [
    "muraho", "amakuru", "urakoze", "murakoze",
    "ndabaza", "ndashaka", "ese", "ufite",
    "mfite", "urwanda", "igihugu", "nshaka",
    "nshobora", "wakora", "bikore", "mfasha",
    "bisobanura", "bivuze", "ryari", "angahe",
    "zingahe", "tungahe", "gute", "kuki",
    "kandi", "ariko", "cyangwa", "neza",
    "yego", "oya", "wumva", "indirimbo",
    "umuntu", "abantu", "dukore", "ndabizi",
    "ndashimira", "ushaka", "ufasha", "uturere"
  ];

  const sw = [
    "habari", "asante", "tafadhali", "karibu",
    "nina", "nataka", "unaweza", "vipi", "nini",
    "kwanini", "kwa nini", "lini", "wapi",
    "ngapi", "kiswahili", "rafiki", "nzuri",
    "ndiyo", "hapana", "naomba", "mambo",
    "habari yako", "ninataka", "msaada"
  ];

  const en = [
    "hello", "please", "thank you", "what",
    "when", "where", "why", "how", "which",
    "who", "can you", "could you", "tell me",
    "explain", "help me", "write", "translate",
    "capital", "country", "language", "business",
    "school", "education", "good morning",
    "good evening", "i need", "i want",
    "how many", "what is", "who is", "do you",
    "the", "is", "are", "latest", "today"
  ];

  function countMatches(words) {
    return words.reduce((count, word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(
        `(^|[^a-z])${escaped}([^a-z]|$)`,
        "i"
      );
      return count + (pattern.test(text) ? 1 : 0);
    }, 0);
  }

  const scores = [
    ["Kinyarwanda", countMatches(rw)],
    ["Swahili", countMatches(sw)],
    ["English", countMatches(en)]
  ].sort((a, b) => b[1] - a[1]);

  if (scores[0][1] === 0) return "undetermined";
  if (scores[0][1] === scores[1][1]) return "undetermined";

  return scores[0][0];
}

function shouldSearch(message) {
  const text = message.toLowerCase();

  const patterns = [
    /\b(today|latest|current|currently|now|recent|news)\b/,
    /\b(this week|this month|this year|live|real.time)\b/,
    /\bweather|price|prices|score|scores\b/,
    /\bformula\s*1\b|\bf1\b/,
    /\bsearch (the )?(web|internet)\b/,
    /\bamakuru mashya\b/,
    /\buyu munsi\b/,
    /\bitariki\b/,
    /\bigiciro\b|\bibiciro\b/,
    /\bryari\b/,
    /\bleo\b|\bsasa\b/,
    /\bhabari mpya\b/,
    /\bbei\b|\blini\b/
  ];

  return patterns.some((pattern) => pattern.test(text));
}

async function searchWikipedia(query, language) {
  const languages = {
    Kinyarwanda: ["rw", "en"],
    English: ["en"],
    Swahili: ["sw", "en"],
    undetermined: ["en"]
  };

  const wikiLanguages = languages[language] || ["en"];

  for (const lang of wikiLanguages) {
    try {
      const url = new URL(
        `https://${lang}.wikipedia.org/w/api.php`
      );

      url.searchParams.set("action", "query");
      url.searchParams.set("generator", "search");
      url.searchParams.set("gsrsearch", query.slice(0, 200));
      url.searchParams.set("gsrnamespace", "0");
      url.searchParams.set("gsrlimit", "3");
      url.searchParams.set("prop", "extracts");
      url.searchParams.set("exintro", "1");
      url.searchParams.set("explaintext", "1");
      url.searchParams.set("exchars", "900");
      url.searchParams.set("format", "json");

      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json",
          "User-Agent": "MpaAI/1.0"
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) continue;

      const data = await response.json();
      const pages = Object.values(data.query?.pages || {});

      const results = pages
        .filter((page) => page.title && page.extract)
        .slice(0, 3)
        .map((page) => ({
          title: page.title,
          extract: page.extract.slice(0, 1200),
          url:
            `https://${lang}.wikipedia.org/wiki/` +
            encodeURIComponent(page.title.replace(/ /g, "_"))
        }));

      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.error("Wikipedia search error:", error);
    }
  }

  return [];
}

function extractText(result) {
  if (!result) return "";

  if (typeof result === "string") {
    return result;
  }

  if (typeof result.response === "string") {
    return result.response;
  }

  if (
    result.choices &&
    result.choices[0] &&
    result.choices[0].message &&
    typeof result.choices[0].message.content === "string"
  ) {
    return result.choices[0].message.content;
  }

  return "";
}

function getErrorMessage(language) {
  if (language === "Kinyarwanda") {
    return "Mbabarira, habaye ikibazo mu gutanga igisubizo. Ongera ugerageze nyuma gato.";
  }

  if (language === "Swahili") {
    return "Samahani, tatizo limetokea. Tafadhali jaribu tena baadaye.";
  }

  return "Sorry, something went wrong. Please try again shortly.";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return jsonResponse(
          { error: "Method not allowed." },
          405
        );
      }

      if (!env.AI || typeof env.AI.run !== "function") {
        return jsonResponse(
          { error: "The AI binding is not configured." },
          500
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return jsonResponse(
          { error: "Invalid JSON request." },
          400
        );
      }

      if (!Array.isArray(body.messages)) {
        return jsonResponse(
          { error: "Messages must be provided as an array." },
          400
        );
      }

      const messages = body.messages
        .filter(
          (message) =>
            message &&
            ["user", "assistant"].includes(message.role) &&
            typeof message.content === "string"
        )
        .slice(-20)
        .map((message) => ({
          role: message.role,
          content: message.content.slice(0, 10000)
        }));

      const lastUserMessage = [...messages]
        .reverse()
        .find((message) => message.role === "user");

      if (!lastUserMessage) {
        return jsonResponse(
          { error: "Please enter a message." },
          400
        );
      }

      const language = getLanguage(lastUserMessage.content);

      let searchResults = [];

      if (shouldSearch(lastUserMessage.content)) {
        searchResults = await searchWikipedia(
          lastUserMessage.content,
          language
        );
      }

      let systemPrompt = SYSTEM_PROMPT;

      if (language !== "undetermined") {
        systemPrompt +=
          `\nThe user's latest message appears to be in ${language}. ` +
          `Reply in ${language}, unless another language is requested.`;
      }

      if (shouldSearch(lastUserMessage.content)) {
        if (searchResults.length > 0) {
          systemPrompt +=
            "\n\nWIKIPEDIA SEARCH RESULTS:\n" +
            "Use these results only when relevant. They may be outdated. " +
            "Do not treat them as proof of breaking news. " +
            "If they do not answer the question, say so honestly.\n" +
            searchResults.map((item, index) =>
              `${index + 1}. ${item.title}\n` +
              `${item.extract}\nSource: ${item.url}`
            ).join("\n\n");
        } else {
          systemPrompt +=
            "\n\nA Wikipedia search was attempted, but no useful results " +
            "were found. Do not claim that live information was verified. " +
            "Explain this limitation if the question needs current information.";
        }
      }

      const conversation = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      try {
        const result = await env.AI.run(MODEL, {
          messages: conversation,
          max_tokens: 800,
          temperature: 0.2
        });

        const answer = extractText(result).trim();

        if (!answer) {
          return jsonResponse(
            { error: getErrorMessage(language) },
            502
          );
        }

        return jsonResponse({
          success: true,
          reply: answer,
          sources: searchResults.map((item) => ({
            title: item.title,
            url: item.url
          }))
        });
      } catch (error) {
        console.error("Mpa AI error:", error);

        return jsonResponse(
          { error: getErrorMessage(language) },
          502
        );
      }
    }

    if (request.method === "GET" || request.method === "HEAD") {
      if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
        return new Response(
          "Website assets binding is not configured.",
          { status: 500 }
        );
      }

      return env.ASSETS.fetch(request);
    }

    return new Response("Method not allowed.", {
      status: 405,
      headers: {
        "Allow": "GET, HEAD, POST, OPTIONS"
      }
    });
  }
};
