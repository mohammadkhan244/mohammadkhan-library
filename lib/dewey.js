// Dewey classification for the Library: Stacks view.
// Fiction → shelves by genre.
// Nonfiction → shelves by Dewey class (four classes used below).
//
// MAPPING (show to user):
// ┌──────────────────────────────────────────────┐
// │ Nonfiction Dewey classes                     │
// │  100  Philosophy & Meaning                   │
// │  808  Writing & Learning                     │
// │  650  Work & Business                        │
// │  600  Technology                             │
// │                                              │
// │ Genre → Class                                │
// │  Memory, Identity, Death, Meaning            │
// │  Philosophy, Ethics, Psychology,             │
// │  Existentialism, Human Nature, Life,         │
// │  Spirituality, Self, Introspection   → 100   │
// │                                              │
// │  Writing, Craft, Creativity,                 │
// │  Storytelling, Learning, Education,          │
// │  Art, Literature, Language, Reading,         │
// │  Process, Research, Study          → 808     │
// │                                              │
// │  Work, Business, Career, Money,              │
// │  Productivity, Ambition, Success,            │
// │  Management, Leadership, Finance,            │
// │  Work & Value, Value               → 650     │
// │                                              │
// │  Technology, Engineering, Science,           │
// │  AI, Software, Internet, Future,             │
// │  Making, Building, Computing,                │
// │  Design, Systems                   → 600     │
// └──────────────────────────────────────────────┘

export const DEWEY_CLASSES = {
  '100': 'Philosophy & Meaning',
  '808': 'Writing & Learning',
  '650': 'Work & Business',
  '600': 'Technology',
};

const GENRE_TO_DEWEY = {
  // 100 Philosophy & Meaning
  'Memory': '100',
  'Identity': '100',
  'Death': '100',
  'Meaning': '100',
  'Philosophy': '100',
  'Ethics': '100',
  'Psychology': '100',
  'Existentialism': '100',
  'Human Nature': '100',
  'Life': '100',
  'Spirituality': '100',
  'Self': '100',
  'Introspection': '100',
  'Consciousness': '100',
  'Morality': '100',

  // 808 Writing & Learning
  'Writing': '808',
  'Craft': '808',
  'Creativity': '808',
  'Storytelling': '808',
  'Learning': '808',
  'Education': '808',
  'Art': '808',
  'Literature': '808',
  'Language': '808',
  'Reading': '808',
  'Process': '808',
  'Research': '808',
  'Study': '808',

  // 650 Work & Business
  'Work': '650',
  'Business': '650',
  'Career': '650',
  'Money': '650',
  'Value': '650',
  'Work & Value': '650',
  'Productivity': '650',
  'Ambition': '650',
  'Success': '650',
  'Management': '650',
  'Leadership': '650',
  'Finance': '650',

  // 600 Technology
  'Technology': '600',
  'Engineering': '600',
  'Science': '600',
  'AI': '600',
  'Software': '600',
  'Internet': '600',
  'Future': '600',
  'Making': '600',
  'Building': '600',
  'Computing': '600',
  'Design': '600',
  'Systems': '600',
};

const FICTION_FORMATS = new Set([
  'Short Story', 'Screenplay', 'Poem', 'Rap',
  'StagePlay', 'Song', 'Anthology',
]);

export function classifyStory(story) {
  const isNonfiction = !FICTION_FORMATS.has(story.f);

  if (!isNonfiction) {
    // Fiction room: shelve by primary genre (not format tag)
    const shelf = (story.g || []).find(g => g && g !== story.f) || story.f || 'Other';
    return { room: 'fiction', shelf, dewey: null };
  }

  // Nonfiction room: find Dewey class from genres
  for (const g of (story.g || [])) {
    const d = GENRE_TO_DEWEY[g];
    if (d) {
      return {
        room: 'nonfiction',
        shelf: d + ' ' + DEWEY_CLASSES[d],
        dewey: d,
      };
    }
  }

  // Format-based fallback
  const fallback = story.f === 'Memoir' ? '100' : '808';
  return {
    room: 'nonfiction',
    shelf: fallback + ' ' + DEWEY_CLASSES[fallback],
    dewey: fallback,
  };
}
