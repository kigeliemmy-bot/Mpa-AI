export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve the website
    if (request.method === "GET") {
      if (!env.ASSETS) {
        return new Response("Website assets are not configured.", {
          status: 500,
        });
      }

      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return json({ response: "Not found." }, 404);
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

      // Natural greeting responses
      if (isGreeting(text)) {
        return json({
          response: greetingResponse(language),
        });
      }

      // Identity and creator
      if (
        /ninde wagukoze|wagukoze nde|ninde wakoze mpa ai|ninde wakuremye|umuremyi wawe|who created you|who made you|who built you|who developed you|nani alikuunda|nani alikutengeneza/.test(text)
      ) {
        const answers = {
          Kinyarwanda:
            "Mpa AI yakozwe kandi iteza imbere na Kigeli.",
          English:
            "Mpa AI was created and is developed by Kigeli.",
          Swahili:
            "Mpa AI iliundwa na inaendelezwa na Kigeli.",
        };

        return json({ response: answers[language] });
      }

      // Identity
      if (
        /who are you|what is mpa ai|uri nde|mpa ai ni iki|wewe ni nani/.test(text)
      ) {
        const answers = {
          Kinyarwanda:
            "Ndi Mpa AI, umufasha w'ubwenge buhangano wakozwe na Kigeli. Nagufasha iki?",
          English:
            "I am Mpa AI, an AI assistant created by Kigeli. How can I help you?",
          Swahili:
            "Mimi ni Mpa AI, msaidizi wa akili bandia aliyeundwa na Kigeli
