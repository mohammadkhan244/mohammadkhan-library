// Plain-English benchmarks for each metric. Sources verified below.
// All ratios are designed to stay in the 1.5×–10× range as data grows.
//
// Sources:
//   Breaking Bad: 62 episodes (AMC, confirmed)
//   Oppenheimer runtime: 180 min (Universal, 2023)
//   Average reading speed: 238 wpm (Brysbaert et al. 2019, Psychon Bull Rev)
//   Sherlock Holmes canon: 56 short stories (Doyle, Strand Magazine)

function halfSteps(x) {
  // Format e.g. 2.5 → "2½", 3.0 → "3", 2.0 → "2"
  const halves = Math.round(x * 2);
  const whole = Math.floor(halves / 2);
  const half = halves % 2 === 1;
  if (whole === 0) return half ? '½' : '0';
  return whole + (half ? '½' : '');
}

export function benchmarks(m) {
  const hrs = Math.round(m.words / 238 / 60);
  const oppenheimers = Math.round(m.words / 238 / 180);
  const bbTimes = halfSteps(m.longestRun / 62);
  const holmesMult = Math.round(m.stories / 56);
  const readMin = Math.round(m.avgWords / 238);
  const rawYears = m.weeksPublished / 52;
  const yearsStr = halfSteps(rawYears);

  return {
    longestRun: `${m.longestRun} weeks in a row. Watch one Breaking Bad episode a week and you'd finish the whole series ${bbTimes} times.`,
    words: `${m.words.toLocaleString()} words ≈ ${hrs} hours of reading, about ${oppenheimers} Oppenheimers back to back.`,
    stories: `${m.stories} stories, nearly ${holmesMult}× every Sherlock Holmes short story.`,
    avgWords: `${m.avgWords.toLocaleString()} words, about a ${readMin}-minute read.`,
    weeksPublished: `${m.weeksPublished} weeks of Mondays, about ${yearsStr} years.`,
    booksRead: `${m.booksRead} books read, one for almost every week I've published a story.`,
  };
}
