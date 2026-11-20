// Computes library metrics from live Notion data (or snapshot fallback).
// All fields that depend on wc/wksc/comp return 0 when running on snapshot
// (snapshot stories lack those fields), which is acceptable.

export function computeMetrics({ stories, booksRead }) {
  // weeksPublished: Notion "Weeks Covered" field, or derived from title week string
  let weeksPublished = 0;
  for (const s of stories) {
    if (s.wksc > 0) {
      weeksPublished += s.wksc;
    } else if (s.w) {
      const m = s.w.match(/^(\d+)-(\d+)$/);
      weeksPublished += m ? parseInt(m[2]) - parseInt(m[1]) + 1 : 1;
    } else {
      weeksPublished += 1;
    }
  }

  // longestRun: longest consecutive sequence of week numbers parsed from titles
  const weekNums = new Set();
  for (const s of stories) {
    if (!s.w) continue;
    const m = s.w.match(/^(\d+)-(\d+)$/);
    if (m) {
      for (let i = parseInt(m[1]); i <= parseInt(m[2]); i++) weekNums.add(i);
    } else {
      const n = parseInt(s.w);
      if (!isNaN(n)) weekNums.add(n);
    }
  }
  const sorted = [...weekNums].sort((a, b) => a - b);
  let longestRun = 0, run = 0, prev = -2;
  for (const n of sorted) {
    run = n === prev + 1 ? run + 1 : 1;
    if (run > longestRun) longestRun = run;
    prev = n;
  }

  // words, avgWords
  let words = 0, wcCount = 0;
  for (const s of stories) {
    if (s.wc > 0) { words += s.wc; wcCount++; }
  }
  const avgWords = wcCount > 0 ? Math.round(words / wcCount) : 0;

  // story count: entries with Format set
  const storiesCount = stories.filter(s => s.f).length;

  // competitions: entries with Competition Entry checkbox
  const compStories = stories.filter(s => s.comp);
  const competitions = compStories.length;
  const compStats = {};
  for (const s of compStories) {
    const r = s.result || 'Unknown';
    compStats[r] = (compStats[r] || 0) + 1;
  }

  return { weeksPublished, longestRun, words, stories: storiesCount, avgWords, booksRead, competitions, compStats };
}
