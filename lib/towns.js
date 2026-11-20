// Town classification for the Train of Thought.
// Towns derive from genres + title keywords (≤10).
//
// Town list:
//   Sci-Fi     ← Science Fiction, Cosmic Horror, Space, Speculative, Time Travel
//   Memory     ← Memory, Identity, Nostalgia, Childhood, Family, Self
//   Horror     ← Horror, Thriller, Supernatural, Mystery
//   Philosophy ← Philosophy, Ethics, Existentialism, Death, Meaning, Psychology, Life
//   Technology ← Technology, Engineering, AI, Software, Computing, Science
//   Making     ← Writing, Craft, Creativity, Storytelling, Art, Process, Design
//   Work       ← Work, Business, Career, Money, Productivity, Ambition, Leadership
//   Fable      ← Fable, Fairy Tale, Fantasy, Myth, Magical Realism
//   Realism    ← Realistic Fiction, Society, Culture, Race, Political
//   Love       ← Love, Romance, Relationships, Friendship, Loss, Grief

export const TOWNS = [
  { id: 'sci-fi',      name: 'Sci-Fi' },
  { id: 'memory',      name: 'Memory' },
  { id: 'horror',      name: 'Horror' },
  { id: 'philosophy',  name: 'Philosophy' },
  { id: 'technology',  name: 'Technology' },
  { id: 'making',      name: 'Making' },
  { id: 'work',        name: 'Work & Value' },
  { id: 'fable',       name: 'Fable' },
  { id: 'realism',     name: 'Realism' },
  { id: 'love',        name: 'Love' },
];

const GENRE_TO_TOWN = {
  // Sci-Fi
  'Science Fiction': 'sci-fi', 'Sci-Fi': 'sci-fi', 'Cosmic Horror': 'sci-fi',
  'Space': 'sci-fi', 'Time Travel': 'sci-fi', 'Alternate History': 'sci-fi',
  'Speculative': 'sci-fi', 'Dystopia': 'sci-fi', 'Post-Apocalyptic': 'sci-fi',
  // Memory
  'Memory': 'memory', 'Identity': 'memory', 'Nostalgia': 'memory',
  'Childhood': 'memory', 'Family': 'memory', 'Self': 'memory',
  'Introspection': 'memory', 'Coming of Age': 'memory',
  // Horror
  'Horror': 'horror', 'Thriller': 'horror', 'Supernatural': 'horror',
  'Mystery': 'horror', 'Dark': 'horror', 'Psychological Thriller': 'horror',
  // Philosophy
  'Philosophy': 'philosophy', 'Ethics': 'philosophy', 'Existentialism': 'philosophy',
  'Death': 'philosophy', 'Meaning': 'philosophy', 'Psychology': 'philosophy',
  'Life': 'philosophy', 'Human Nature': 'philosophy', 'Morality': 'philosophy',
  'Consciousness': 'philosophy', 'Spirituality': 'philosophy',
  // Technology
  'Technology': 'technology', 'Engineering': 'technology', 'AI': 'technology',
  'Software': 'technology', 'Internet': 'technology', 'Computing': 'technology',
  'Science': 'technology', 'Systems': 'technology', 'Future': 'technology',
  // Making
  'Writing': 'making', 'Craft': 'making', 'Creativity': 'making',
  'Storytelling': 'making', 'Art': 'making', 'Process': 'making',
  'Making': 'making', 'Learning': 'making', 'Education': 'making',
  'Design': 'making', 'Literature': 'making',
  // Work
  'Work': 'work', 'Business': 'work', 'Career': 'work',
  'Money': 'work', 'Value': 'work', 'Work & Value': 'work',
  'Productivity': 'work', 'Ambition': 'work', 'Success': 'work',
  'Leadership': 'work', 'Finance': 'work', 'Management': 'work',
  // Fable
  'Fable': 'fable', 'Fairy Tale': 'fable', 'Fantasy': 'fable',
  'Myth': 'fable', 'Magical Realism': 'fable', 'Folklore': 'fable',
  // Realism
  'Realistic Fiction': 'realism', 'Drama': 'realism', 'Society': 'realism',
  'Social': 'realism', 'Political': 'realism', 'Race': 'realism',
  'Culture': 'realism', 'Immigration': 'realism', 'History': 'realism',
  // Love
  'Love': 'love', 'Romance': 'love', 'Relationships': 'love',
  'Friendship': 'love', 'Loss': 'love', 'Grief': 'love',
  'Connection': 'love', 'Loneliness': 'love',
};

const TITLE_KW = {
  'memory': 'memory', 'remember': 'memory', 'forget': 'memory', 'forgotten': 'memory',
  'work': 'work', 'money': 'work', 'business': 'work',
  'horror': 'horror', 'dark': 'horror', 'shadow': 'horror', 'haunt': 'horror',
  'love': 'love', 'heart': 'love', 'loss': 'love', 'grief': 'love',
  'build': 'making', 'write': 'making', 'make': 'making', 'create': 'making',
  'code': 'technology', 'tech': 'technology', ' ai ': 'technology', 'machine': 'technology',
  'god': 'philosophy', 'death': 'philosophy', 'soul': 'philosophy',
  'story': 'fable', 'myth': 'fable', 'once upon': 'fable',
};

export function classifyTowns(story) {
  const towns = new Set();
  for (const g of (story.g || [])) {
    const t = GENRE_TO_TOWN[g];
    if (t) towns.add(t);
  }
  if (towns.size === 0) {
    const low = (' ' + (story.t || '') + ' ').toLowerCase();
    for (const [kw, t] of Object.entries(TITLE_KW)) {
      if (low.includes(kw)) { towns.add(t); break; }
    }
  }
  // Format-based fallback
  if (towns.size === 0) {
    if (['Short Story', 'Screenplay', 'Poem', 'Rap', 'StagePlay', 'Song'].includes(story.f)) towns.add('realism');
    else towns.add('making');
  }
  return [...towns];
}
