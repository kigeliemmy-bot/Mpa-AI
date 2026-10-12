export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    try {
      const body = await request.json();
      const message =
        typeof body.message === "string" ? body.message.trim() : "";

      if (!message) {
        return json({ response: "Andika ikibazo cyawe." }, 400);
      }

      const text = normalize(message);
      const language = detectLanguage(message);

      // Always answer creator questions before calling the AI model.
      if (
        /ninde wagukoze|wagukoze nde|ninde wakoze mpa ai|ninde wakuremye|umuremyi wawe|who created you|who made you|who built you|who developed you|nani alikuunda|nani alikutengeneza/.test(text)
      ) {
        if (language === "Kinyarwanda") {
          return json({
            response: "Mpa AI yakozwe na Kigeli, ari na we wayiremye kandi akayiteza imbere.",
          });
        }

        if (language === "Swahili") {
          return json({
            response: "Mpa AI iliundwa na Kigeli, ambaye ndiye aliyeitengeneza.",
          });
        }

        return json({
          response: "Mpa AI was created and developed by Kigeli.",
        });
      }

      // Identity
      if (/who are you|what is mpa ai|uri nde|mpa ai ni iki|wewe ni nani/.test(text)) {
        if (language === "Kinyarwanda") {
          return json({
            response: "Ndi Mpa AI, umufasha w'ubwenge buhangano wakozwe na Kigeli.",
          });
        }

        if (language === "Swahili") {
          return json({
            response: "Mimi ni Mpa AI, msaidizi wa akili bandia aliyeundwa na Kigeli.",
          });
        }

        return json({
          response: "I am Mpa AI, an AI assistant created by Kigeli.",
        });
      }

      // Rwanda district count
      if (/uturere tungahe|urwanda rufite uturere|how many districts|districts does rwanda have|rwanda ina wilaya ngapi/.test(text)) {
        if (language === "Kinyarwanda") {
          return json({ response: "U Rwanda rufite uturere 30." });
        }

        if (language === "Swahili") {
          return json({ response: "
