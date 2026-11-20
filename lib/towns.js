// Town classification for Train of Thought.
// 6 towns (dropped Memory, Technology, Work & Value, Love — each had <8 pieces).
//   Sci-Fi     ← Science Fiction, Space, AI, Future, Speculative, Dystopia
//   Realism    ← Realistic Fiction, Society, Family, Career, Relationships
//   Philosophy ← Ethics, Death, Identity, Meaning, Loss, Consciousness
//   Horror     ← Horror, Thriller, Supernatural, Mystery, Dark
//   Making     ← Writing, Craft, Creativity, Engineering, Process, Learning
//   Fable      ← Fable, Fantasy, Fairy Tale, Myth, Magical Realism

export const TOWNS = [
  { id: 'sci-fi',     name: 'Sci-Fi' },
  { id: 'realism',   name: 'Realism' },
  { id: 'philosophy',name: 'Philosophy' },
  { id: 'horror',    name: 'Horror' },
  { id: 'making',    name: 'Making' },
  { id: 'fable',     name: 'Fable' },
];

const GENRE_TO_TOWN = {
  // Sci-Fi
  'Science Fiction': 'sci-fi', 'Sci-Fi': 'sci-fi', 'Cosmic Horror': 'sci-fi',
  'Space': 'sci-fi', 'Time Travel': 'sci-fi', 'Alternate History': 'sci-fi',
  'Speculative': 'sci-fi', 'Dystopia': 'sci-fi', 'Post-Apocalyptic': 'sci-fi',
  'Technology': 'sci-fi', 'AI': 'sci-fi', 'Software': 'sci-fi',
  'Internet': 'sci-fi', 'Computing': 'sci-fi', 'Future': 'sci-fi',
  // Realism
  'Realistic Fiction': 'realism', 'Drama': 'realism', 'Society': 'realism',
  'Social': 'realism', 'Political': 'realism', 'Race': 'realism',
  'Culture': 'realism', 'Immigration': 'realism', 'History': 'realism',
  'Nostalgia': 'realism', 'Childhood': 'realism', 'Family': 'realism',
  'Coming of Age': 'realism', 'Love': 'realism', 'Romance': 'realism',
  'Relationships': 'realism', 'Friendship': 'realism',
  'Work': 'realism', 'Business': 'realism', 'Career': 'realism',
  'Money': 'realism', 'Ambition': 'realism', 'Success': 'realism',
  'Leadership': 'realism', 'Finance': 'realism', 'Management': 'realism',
  // Philosophy
  'Philosophy': 'philosophy', 'Ethics': 'philosophy', 'Existentialism': 'philosophy',
  'Death': 'philosophy', 'Meaning': 'philosophy', 'Psychology': 'philosophy',
  'Life': 'philosophy', 'Human Nature': 'philosophy', 'Morality': 'philosophy',
  'Consciousness': 'philosophy', 'Spirituality': 'philosophy',
  'Identity': 'philosophy', 'Self': 'philosophy', 'Introspection': 'philosophy',
  'Memory': 'philosophy', 'Loss': 'philosophy', 'Grief': 'philosophy',
  'Connection': 'philosophy', 'Loneliness': 'philosophy', 'Value': 'philosophy',
  'Productivity': 'making',
  // Horror
  'Horror': 'horror', 'Thriller': 'horror', 'Supernatural': 'horror',
  'Mystery': 'horror', 'Dark': 'horror', 'Psychological Thriller': 'horror',
  // Making
  'Writing': 'making', 'Craft': 'making', 'Creativity': 'making',
  'Storytelling': 'making', 'Art': 'making', 'Process': 'making',
  'Making': 'making', 'Learning': 'making', 'Education': 'making',
  'Design': 'making', 'Literature': 'making', 'Science': 'making',
  'Engineering': 'making', 'Systems': 'making',
  // Fable
  'Fable': 'fable', 'Fairy Tale': 'fable', 'Fantasy': 'fable',
  'Myth': 'fable', 'Magical Realism': 'fable', 'Folklore': 'fable',
};

const TITLE_KW = {
  'horror': 'horror', 'dark': 'horror', 'shadow': 'horror', 'haunt': 'horror',
  'memory': 'philosophy', 'remember': 'philosophy', 'forget': 'philosophy', 'forgotten': 'philosophy',
  'love': 'realism', 'heart': 'realism', 'work': 'realism', 'money': 'realism', 'business': 'realism',
  'build': 'making', 'write': 'making', 'make': 'making', 'create': 'making',
  'code': 'sci-fi', 'tech': 'sci-fi', ' ai ': 'sci-fi', 'machine': 'sci-fi',
  'god': 'philosophy', 'death': 'philosophy', 'soul': 'philosophy', 'loss': 'philosophy',
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
  if (towns.size === 0) {
    if (['Short Story', 'Screenplay', 'Poem', 'Rap', 'StagePlay', 'Song'].includes(story.f)) towns.add('realism');
    else towns.add('making');
  }
  return [...towns];
}
