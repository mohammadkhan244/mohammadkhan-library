// Computes library metrics from live Notion data (or snapshot fallback).
// Fields that depend on wc/wksc/comp return 0/empty when running on snapshot.

export function computeMetrics({ stories, posts = [], tools = [], projects = [], booksRead }) {
  // weeksPublished: sum of "Weeks Covered" field, else derive from title week string
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

  // competitions: formatted string from Competition Entry + Result
  const compStories = stories.filter(s => s.comp);
  const entries = compStories.length;
  const wins  = compStories.filter(s => /won|win|1st|first/i.test(s.result || '')).length;
  const rups  = compStories.filter(s => /runner.?up|2nd|second|honorable/i.test(s.result || '')).length;
  const semis = compStories.filter(s => /semi/i.test(s.result || '')).length;
  const compParts = entries > 0 ? [`${entries} entered`] : [];
  if (wins)  compParts.push(`${wins} win${wins > 1 ? 's' : ''}`);
  if (rups)  compParts.push(`${rups} runner-up${rups > 1 ? 's' : ''}`);
  if (semis) compParts.push(`${semis} semifinalist${semis > 1 ? 's' : ''}`);
  const competitions = compParts.join(' · ');

  // thingsMade: stories + tools + projects + newsletter posts that aren't also stories.
  // A post is "also a story" if its title starts with "Week N" or matches a story title.
  const storyTitles = new Set(stories.map(s => s.t.toLowerCase().replace(/[^a-z0-9]/g, '')));
  const nonStoryPosts = posts.filter(p => {
    const norm = p.t.toLowerCase().replace(/[^a-z0-9]/g, '');
    return !/^week\d/.test(norm) && !storyTitles.has(norm);
  });
  const thingsMade = storiesCount + tools.length + projects.length + nonStoryPosts.length;

  return {
    weeksPublished,
    longestRun,
    words,
    stories: storiesCount,
    avgWords,
    booksRead,
    competitions,
    thingsMade,
  };
}
