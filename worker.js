function greetingResponse(language) {
const answers = {
Kinyarwanda: "Muraho neza! Ndi Mpa AI. Nagufasha iki?",
English: "Hello! I'm Mpa AI. How can I help you?",
Swahili: "Habari! Mimi ni Mpa AI. Nikusaidie nini?",
};

return answers[language] || answers.English;
}
