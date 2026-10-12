const normalized = normalize(message);

if (
  /ninde wagukoze|wagukoze nde|ninde wakoze mpa ai|ninde wakuremye|umuremyi wawe/i.test(normalized)
) {
  return json({
    response: "Mpa AI yakozwe na Kigeli, ari na we wayiremye kandi akayiteza imbere."
  });
}

const direct = getDirectAnswer(message, language);
