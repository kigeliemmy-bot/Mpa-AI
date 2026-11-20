
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const SYSTEM_PROMPT = `
You are BAZA KIGELI, a helpful assistant.
Reply in the language of the latest user message: Kinyarwanda, English, or Swahili.
For Kinyarwanda, write natural, correct, everyday Kinyarwanda used in Rwanda.
Use simple sentences. Do not translate English word-for-word.
Never invent Kinyarwanda words. Do not mix languages unnecessarily.
Answer the exact question. Be accurate; admit uncertainty.
Do not invent facts, dates, sources, or search results.
Your name is BAZA KIGELI. Never call yourself Mpa AI.
When search sources are provided, use them and include relevant source URLs in your answer.
`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function normalize(value) {
  return String(value || "").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLanguage(message) {
  const text = normalize(message);

  const rw = [
    "muraho", "amakuru", "urakoze", "murakoze", "ndashaka",
    "nshaka", "mfasha", "urwanda", "igihugu", "angahe",
    "zingahe", "tungahe", "gute", "kuki", "kandi", "ariko",
    "cyangwa", "yego", "oya", "indirimbo", "umuntu", "abantu",
    "dukore", "ushaka", "ufasha", "uturere", "witwa nde",
    "mbwira", "mwiriwe", "mwaramutse", "nkeneye", "uyu munsi",
    "ryari", "ese", "ibiki", "bite", "ikinyarwanda",
    "intego", "ubuzima", "ni byiza"
  ];

  const sw = [
    "habari", "asante", "tafadhali", "karibu", "nataka",
    "unaweza", "vipi", "kwanini", "kwa nini", "wapi",
    "ngapi", "kiswahili", "rafiki", "nzuri", "ndiyo",
    "hapana", "naomba", "mambo", "ninahitaji"
  ];

  const en = [
    "hello", "hi", "hey", "please", "thank you", "what",
    "when", "where", "why", "how", "which", "who", "can you",
    "tell me", "explain", "help me", "write", "translate",
    "education", "good morning", "i need", "i want",
    "how many", "what is", "your name", "news", "today",
    "formula 1", "latest", "current", "recent", "weather",
    "price", "president", "election", "search"
  ];

  const score = words =>
    words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);

  const scores = [
    ["Kinyarwanda", score(rw)],
    ["Swahili", score(sw)],
    ["English", score(en)]
  ].sort((a, b) => b[1] - a[1]);

  if (!scores[0][1] || scores[0][1] === scores[1][1])
    return "undetermined";

  return scores[0][0];
}

function greeting(message) {
  const t = normalize(message);

  if (/^(muraho|muraho neza|amakuru|mwaramutse|mwiriwe|bite)( baza kigeli)?$/.test(t))
    return "Muraho neza! Ndi BAZA KIGELI. Nagufasha iki?";

  if (/^(hello|hi|hey|good morning|good afternoon|good evening)( baza kigeli)?$/.test(t))
    return "Hello! I'm BAZA KIGELI. How can I help you?";

  if (/^(habari|mambo|habari yako)$/.test(t))
    return "Habari! Mimi ni BAZA KIGELI. Nikusaidie nini?";

  return null;
}

function knownAnswer(message) {
  const t = normalize(message);

  if (
    t.includes("kuki ari byiza kugira intego mu buzima") ||
    t.includes("akamaro ko kugira intego mu buzima")
  ) {
    return "Kugira intego mu buzima ni ingenzi kuko bidufasha kumenya icyo dushaka kugeraho. Intego zidufasha gutegura ibikorwa byacu, gukoresha neza igihe no kudacika intege iyo duhuye n’imbogamizi. Iyo dufite intego, biroroha kumenya intambwe dutera n’aho tugana.";
  }

  if (t === "witwa nde" || t === "izina ryawe ni irihe")
    return "Nitwa BAZA KIGELI. Nagufasha iki?";

  return null;
}

function shouldSearch(message) {
  const t = normalize(message);

  return /\b(today|latest|current|recent|news|weather|price|score|live|when|ryari|uzabera|izabera|amakuru mashya|uyu munsi|igiciro|ibiciro|bei|formula 1|f1|president|election|schedule|forecast|amakuru y'uyu munsi|amakuru yuyu munsi|latest news|search|update|updates)\b/i.test(t);
}

async function searchTavily(query, env) {
  console.log("[DIAGNOSTIC] Tavily search started");

  if (!env.TAVILY_API_KEY) {
    console.error("[DIAGNOSTIC] TAVILY_API_KEY is MISSING");
    return [];
  }

  console.log("[DIAGNOSTIC] TAVILY_API_KEY exists");

  try {
    const response = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: env.TAVILY_API_KEY,
          query: query.slice(0, 500),
          search_depth: "basic",
          topic: "general",
          max_results: 5
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    console.log(
      "[DIAGNOSTIC] Tavily HTTP status:",
      response.status
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error(
        "[DIAGNOSTIC] Tavily API failed:",
        response.status,
        errorBody.slice(0, 300)
      );

      return [];
    }

    const data = await response.json();

    const results = (data.results || [])
      .filter(x => x.title && x.url && x.content)
      .slice(0, 5)
      .map(x => ({
        title: String(x.title).slice(0, 250),
        content: String(x.content).slice(0, 1400),
        url: String(x.url)
      }));

    console.log(
      "[DIAGNOSTIC] Tavily results received:",
      results.length
    );

    return results;

  } catch (error) {
    console.error(
      "[DIAGNOSTIC] Tavily exception:",
      error?.message || String(error)
    );

    return [];
  }
}

async function searchWikipedia(query, language) {
  console.log("[DIAGNOSTIC] Wikipedia fallback started");

  const langs = language === "Kinyarwanda"
    ? ["rw", "en"]
    : language === "Swahili"
      ? ["sw", "en"]
      : ["en"];

  for (const lang of langs) {
    try {
      const url = new URL(
        `https://${lang}.wikipedia.org/w/api.php`
      );

      url.searchParams.set("action", "query");
      url.searchParams.set("generator", "search");
      url.searchParams.set("gsrsearch", query.slice(0, 180));
      url.searchParams.set("gsrnamespace", "0");
      url.searchParams.set("gsrlimit", "3");
      url.searchParams.set("prop", "extracts");
      url.searchParams.set("exintro", "1");
      url.searchParams.set("explaintext", "1");
      url.searchParams.set("exchars", "700");
      url.searchParams.set("format", "json");

      const response = await fetch(url, {
        signal: AbortSignal.timeout(7000)
      });

      console.log(
        "[DIAGNOSTIC] Wikipedia",
        lang,
        "HTTP status:",
        response.status
      );

      if (!response.ok) continue;

      const data = await response.json();

      const pages = Object.values(data.query?.pages || {});

      const results = pages
        .filter(p => p.title && p.extract)
        .slice(0, 3)
        .map(p => ({
          title: p.title,
          content: p.extract,
          url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`
        }));

      if (results.length) {
        console.log(
          "[DIAGNOSTIC] Wikipedia results received:",
          results.length
        );

        return results;
      }

    } catch (error) {
      console.error(
        "[DIAGNOSTIC] Wikipedia error:",
        error?.message || String(error)
      );
    }
  }

  console.log("[DIAGNOSTIC] Wikipedia returned no results");

  return [];
}

function extractText(result) {
  if (typeof result === "string") return result;

  if (typeof result?.response === "string")
    return result.response;

  const content = result?.choices?.[0]?.message?.content;

  return typeof content === "string" ? content : "";
}

function errorMessage(language) {
  if (language === "Kinyarwanda")
    return "Mbabarira, habaye ikibazo. Ongera ugerageze nyuma gato.";

  if (language === "Swahili")
    return "Samahani, tatizo limetokea. Tafadhali jaribu tena baadaye.";

  return "Sorry, something went wrong. Please try again shortly.";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    console.log(
      "[DIAGNOSTIC] Request received:",
      request.method,
      url.pathname
    );

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
        console.log("[DIAGNOSTIC] Invalid method");

        return jsonResponse(
          {error: "Method not allowed."},
          405
        );
      }

      if (!env.AI || typeof env.AI.run !== "function") {
        console.error("[DIAGNOSTIC] Workers AI binding missing");

        return jsonResponse(
          {error: "The AI binding is not configured."},
          500
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        console.error("[DIAGNOSTIC] Invalid JSON request");

        return jsonResponse(
          {error: "Invalid JSON request."},
          400
        );
      }

      if (!body || !Array.isArray(body.messages)) {
        return jsonResponse(
          {error: "Messages must be provided as an array."},
          400
        );
      }

      const messages = body.messages
        .filter(m =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
        )
        .slice(-16)
        .map(m => ({
          role: m.role,
          content: m.content.slice(0, 7000)
        }));

      const lastUser = [...messages]
        .reverse()
        .find(m => m.role === "user");

      if (!lastUser) {
        return jsonResponse(
          {error: "Please enter a message."},
          400
        );
      }

      const language = getLanguage(lastUser.content);

      console.log(
        "[DIAGNOSTIC] Message language:",
        language
      );

      const hello = greeting(lastUser.content);

      if (hello) {
        console.log("[DIAGNOSTIC] Greeting response");

        return jsonResponse({
          success: true,
          reply: hello,
          sources: []
        });
      }

      const fixed = knownAnswer(lastUser.content);

      if (fixed) {
        console.log("[DIAGNOSTIC] Known answer response");

        return jsonResponse({
          success: true,
          reply: fixed,
          sources: []
        });
      }

      let searchResults = [];
      let searchAttempted = false;

      const searchRequired = shouldSearch(lastUser.content);

      console.log(
        "[DIAGNOSTIC] Search condition:",
        searchRequired
      );

      if (searchRequired) {
        searchAttempted = true;

        searchResults = await searchTavily(
          lastUser.content,
          env
        );

        if (!searchResults.length) {
          console.log(
            "[DIAGNOSTIC] Tavily returned no usable results"
          );

          searchResults = await searchWikipedia(
            lastUser.content,
            language
          );
        }
      }

      console.log(
        "[DIAGNOSTIC] Total search results:",
        searchResults.length
      );

      const languageRule = language === "undetermined"
        ? "Identify the language of the latest user message and reply in that language."
        : `The user's language is ${language}. Reply only in ${language}.`;

      let system = SYSTEM_PROMPT + "\n" + languageRule;

      if (language === "Kinyarwanda") {
        system += `
IMPORTANT KINYARWANDA QUALITY CHECK:
Write like a fluent, educated person in Rwanda speaking naturally.
Use common, established Kinyarwanda words and correct grammar.
Do not make up words or use strange phrases.
Avoid literal translations and avoid overly complicated vocabulary.
Before sending, silently review every sentence.
If a sentence sounds unnatural or unclear, rewrite it in simpler Kinyarwanda.
If you are unsure of a Kinyarwanda term, explain the idea using simpler words instead of guessing.`;
      }

      if (searchResults.length) {
        system +=
          "\nVerified search material (may be incomplete):\n" +
          searchResults.map((x, i) =>
            `${i + 1}. ${x.title}\n${x.content}\nSource URL: ${x.url}`
          ).join("\n\n") +
          "\nUse relevant facts from these results. Do not invent details. Cite relevant source URLs in your answer.";
      } else if (searchAttempted) {
        system +=
          "\nSearch found no usable information. Be transparent. Do not guess current facts or pretend that you searched successfully.";
      }

      try {
        console.log("[DIAGNOSTIC] Calling Workers AI");

        const result = await env.AI.run(MODEL, {
          messages: [
            {role: "system", content: system},
            ...messages
          ],
          max_tokens: 700,
          temperature: 0.05
        });

        let answer = extractText(result).trim();

        if (!answer) {
          console.error("[DIAGNOSTIC] AI returned empty answer");

          return jsonResponse(
            {error: errorMessage(language)},
            502
          );
        }

        if (language === "Kinyarwanda" && answer.length > 20) {
          try {
            console.log("[DIAGNOSTIC] Kinyarwanda review started");

            const edited = await env.AI.run(MODEL, {
              messages: [
                {
                  role: "system",
                  content: "Uri umwanditsi w'Ikinyarwanda cyiza. Kosora igisubizo gikurikira kugira ngo cyumvikane neza, ukoreshe Ikinyarwanda gisanzwe kandi cy'ukuri. Ntuhindure igisobanuro, ntukongere amakuru mashya, ntuhimbe amagambo. Subiza igisubizo cyakosowe gusa."
                },
                {
                  role: "user",
                  content: answer
                }
              ],
              max_tokens: 700,
              temperature: 0
            });

            const revised = extractText(edited).trim();

            if (revised) answer = revised;

          } catch (editError) {
            console.error(
              "[DIAGNOSTIC] Kinyarwanda review failed:",
              editError?.message || String(editError)
            );
          }
        }

        console.log("[DIAGNOSTIC] Chat response completed");

        return jsonResponse({
          success: true,
          reply: answer,
          sources: searchResults.map(x => ({
            title: x.title,
            url: x.url
          }))
        });

      } catch (error) {
        console.error(
          "[DIAGNOSTIC] BAZA KIGELI AI error:",
          error?.message || String(error)
        );

        return jsonResponse({
          error: errorMessage(language)
        }, 502);
      }
    }

    if (request.method === "GET" || request.method === "HEAD") {
      if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
        console.error("[DIAGNOSTIC] Website assets binding missing");

        return new Response(
          "Website assets binding is not configured.",
          {status: 500}
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
