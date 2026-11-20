import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const csv = readFileSync(join(root, 'data', 'storygraph.csv'), 'utf8');

function parseCSVLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let val = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          val += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          val += line[i++];
        }
      }
      fields.push(val);
      if (line[i] === ',') i++;
    } else {
      let val = '';
      while (i < line.length && line[i] !== ',') val += line[i++];
      fields.push(val);
      if (line[i] === ',') i++;
    }
  }
  return fields;
}

const lines = csv.split('\n').filter(l => l.trim());
const headers = parseCSVLine(lines[0]);

const idx = {
  title: headers.indexOf('Title'),
  authors: headers.indexOf('Authors'),
  rating: headers.indexOf('Star Rating'),
  lastRead: headers.indexOf('Last Date Read'),
  status: headers.indexOf('Read Status'),
};

const books = [];

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields[idx.status] !== 'read') continue;

  const title = fields[idx.title]?.trim() || '';
  const authors = fields[idx.authors]?.trim() || '';
  const ratingStr = fields[idx.rating]?.trim() || '';
  const lastRead = fields[idx.lastRead]?.trim() || '';
  const rating = ratingStr ? parseFloat(ratingStr) : null;

  books.push({ title, authors, rating, lastRead });
}

// Sort by rating desc (nulls last), then lastRead desc
books.sort((a, b) => {
  if (a.rating !== b.rating) {
    if (a.rating === null) return 1;
    if (b.rating === null) return -1;
    return b.rating - a.rating;
  }
  return b.lastRead.localeCompare(a.lastRead);
});

writeFileSync(join(root, 'data', 'books.json'), JSON.stringify(books, null, 2));
console.log(`Written ${books.length} books to data/books.json`);
