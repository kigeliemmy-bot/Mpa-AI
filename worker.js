export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const message = body.message;

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            messages: [
              {
                role: "system",
                content:
                  "Uri Mpa AI. Subiza neza. Niba umuntu akubajije mu Kinyarwanda, subiza mu Kinyarwanda. Niba akubajije mu English, subiza mu English."
              },
              {
                role: "user",
                content: message
              }
            ]
          }
        );

        return new Response(
          JSON.stringify({ answer: result.response }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }
    }

    return new Response("Mpa AI is running.");
  }
};
