function getDirectAnswer(message, language) {
  const text = normalize(message);

  const has = (...phrases) =>
    phrases.some((phrase) => text.includes(normalize(phrase)));

  // CREATOR
  if (
    has(
      "ninde wagukoze",
      "wagukoze nde",
      "ninde wakoze mpa ai",
      "ninde wakuremye",
      "umuremyi wawe",
      "who created you",
      "who made you",
      "who built you",
      "who developed you",
      "nani alikuunda",
      "nani alikutengeneza"
    )
  ) {
    if (language === "Kinyarwanda") {
      return "Mpa AI yakozwe na Kigeli, ari na we wayiremye kandi akayiteza imbere.";
    }

    if (language === "Swahili") {
      return "Mpa AI iliundwa na Kigeli, ambaye ndiye aliyeitengeneza.";
    }

    return "Mpa AI was created and developed by Kigeli.";
  }

  // IDENTITY
  if (
    has(
      "uri nde",
      "wowe uri nde",
      "mpa ai ni iki",
      "who are you",
      "what is mpa ai",
      "wewe ni nani"
    )
  ) {
    if (language === "Kinyarwanda") {
      return "Ndi Mpa AI, umufasha w'ubwenge buhangano wakozwe na Kigeli.";
    }

    if (language === "Swahili") {
      return "Mimi ni Mpa AI, msaidizi wa akili bandia aliyeundwa na Kigeli.";
    }

    return "I am Mpa AI, an AI assistant created by Kigeli.";
  }

  // DISTRICTS
  if (
    has(
      "uturere tungahe",
      "urwanda rufite uturere tungahe",
      "how many districts",
      "districts does rwanda have",
      "rwanda ina wilaya ngapi"
    )
  ) {
    if (language === "Kinyarwanda") {
      return "U Rwanda rufite uturere 30.";
    }

    if (language === "Swahili") {
      return "Rwanda ina wilaya 30.";
    }

    return "Rwanda has 30 districts.";
  }

  // CAPITAL
  if (
    has(
      "capital of rwanda",
      "capital city of rwanda",
      "umurwa mukuru w urwanda",
      "mji mkuu wa rwanda"
    )
  ) {
    if (language === "Kinyarwanda") {
      return "Umurwa mukuru w'u Rwanda ni Kigali.";
    }

    if (language === "Swahili") {
      return "Mji mkuu wa Rwanda ni Kigali.";
    }

    return "The capital city of Rwanda is Kigali.";
  }

  // LAST KING
  if (
    has(
      "last king of rwanda",
      "umwami wa nyuma w urwanda",
      "mfalme wa mwisho wa rwanda"
    )
  ) {
    if (language === "Kinyarwanda") {
      return "Umwami wa nyuma w'u Rwanda yari Kigeli V Ndahindurwa.";
    }

    if (language === "Swahili") {
      return "Mfalme wa mwisho wa Rwanda alikuwa Kigeli V Ndahindurwa.";
    }

    return "The last king of Rwanda was Kigeli V Ndahindurwa.";
  }

  return null;
}
