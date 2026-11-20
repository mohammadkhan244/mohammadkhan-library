// Plain-English benchmarks for each metric.
// Returns { label, comparison } pairs so the UI can colour them separately.
// Every figure is cited; drop any you can't verify.
//
// Verified sources:
//   Breaking Bad 62 episodes — AMC (confirmed)
//   Sherlock Holmes 56 short stories — Doyle canon, Strand Magazine
//   Reading speed 238 wpm — Brysbaert et al. 2019, Psychon Bull Rev
//   The Great Gatsby ~47,094 words — commonly cited (Scribner, 1925)
//   Friends 236 episodes — NBC 1994–2004 (confirmed)
//   Dune: Part One 155 min — IMDb (2h 35m, 2021)
//   Dune: Part Two 166 min — IMDb (2h 46m, 2024)
//   Spider-Man: Into the Spider-Verse 117 min — IMDb (1h 57m, 2018)
//   Spider-Man: Across the Spider-Verse 140 min — IMDb (2h 20m, 2023)
//   The Road ~58,700 words — commonly cited (McCarthy, 2006)
//   Blood Meridian ~170,000 words — commonly cited (McCarthy, 1985)

function halfSteps(x) {
  const halves = Math.round(x * 2);
  const whole = Math.floor(halves / 2);
  const half = halves % 2 === 1;
  if (whole === 0) return half ? '½' : '0';
  return whole + (half ? '½' : '');
}

export function benchmarks(m) {
  const hrs      = Math.round(m.words / 238 / 60);
  const gatsbys  = Math.round(m.words / 47094);   // The Great Gatsby ~47,094 words
  const bbTimes  = halfSteps(m.longestRun / 62);  // Breaking Bad 62 episodes
  const holmesMult = Math.round(m.stories / 56);  // Holmes 56 short stories
  const readMin  = Math.round(m.avgWords / 238);

  return {
    weeksPublished: {
      label: 'consecutive Mondays',
      // Friends: 236 episodes (NBC 1994–2004). Literally true when weeksPublished ≤ 236.
      comparison: m.weeksPublished <= 236
        ? `Watch one Friends episode a week from season 1 and you wouldn't have finished the show yet.`
        : `More Mondays than there are episodes of Friends — ${halfSteps(m.weeksPublished / 52)} years straight.`,
    },
    longestRun: {
      label: 'weeks in a row',
      comparison: `Watch one Breaking Bad episode a week and you'd finish the whole series ${bbTimes} times.`,
    },
    words: {
      label: 'words written',
      // Great Gatsby ~47,094 words; reading speed 238 wpm
      comparison: `${hrs} hours of reading — about ${gatsbys} Great Gatsbys back to back.`,
    },
    stories: {
      label: 'stories',
      comparison: `Nearly ${holmesMult}× every Sherlock Holmes short story.`,
    },
    avgWords: {
      label: 'avg words / story',
      comparison: `About a ${readMin}-minute read.`,
    },
    booksRead: {
      label: 'books read',
      comparison: `One for almost every week I've published a story.`,
    },
  };
}
