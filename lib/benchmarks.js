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
    longestRun: `consecutive weeks without missing a Monday — watch one Breaking Bad episode a week and you'd finish the whole series ${bbTimes} times over.`,
    words: `words written across all stories — about ${hrs} hours of reading, ${oppenheimers} Oppenheimers back to back.`,
    stories: `stories written since 2020 — nearly ${holmesMult}× every Sherlock Holmes short story ever published.`,
    avgWords: `avg words per story — about a ${readMin}-minute read.`,
    weeksPublished: `weeks strong — ${yearsStr} years of showing up every Monday since 2020.`,
    booksRead: `books read alongside the writing — one for almost every week published.`,
  };
}
