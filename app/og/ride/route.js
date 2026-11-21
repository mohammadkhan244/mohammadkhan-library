import { ImageResponse } from 'next/og';
import { getLibrary } from '../../../lib/notion';
import { classifyTowns, TOWNS } from '../../../lib/towns';
import { loadOgFonts, ogFontList } from '../../../lib/og-fonts';
import { trainTicket } from '../../../lib/og-ticket';
import questionsData from '../../../data/questions.json';

export const revalidate = 3600;

function townName(id) {
  return TOWNS.find((t) => t.id === id)?.name || id;
}

function getQuestion(a, b) {
  const qs =
    questionsData[`${a}|${b}`] ||
    questionsData[`${b}|${a}`] ||
    [];
  return qs[0] || null;
}

function hash6(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++)
    h = (Math.imul(h ^ str.charCodeAt(i), 16777619)) >>> 0;
  return h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

function fmtDate(isoDate) {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${months[m - 1]} ${d} ${y}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const r   = searchParams.get('r') || 'sci-fi,philosophy';
  const c   = searchParams.get('c') || '';
  const car = searchParams.get('car') || '';

  const routeTowns  = r.split(',').filter(Boolean);
  const firstId     = routeTowns[0]  || 'sci-fi';
  const lastId      = routeTowns[routeTowns.length - 1] || 'philosophy';
  const firstName   = townName(firstId);
  const lastName    = townName(lastId);
  const midTowns    = routeTowns.length > 2
    ? routeTowns.slice(1, -1).map(townName)
    : [];

  const carriageIds = c.split(',').filter(Boolean);
  const seats       = `${carriageIds.length}/3`;
  const ticketNo    = hash6(r + c);
  const today       = new Date().toISOString().slice(0, 10);

  let question   = null;
  let noQuestion = null;

  const [data, fonts] = await Promise.all([getLibrary(), loadOgFonts()]);

  if (carriageIds.length >= 2) {
    // Build story lookup
    const byId = new Map();
    for (const st of data.stories) {
      const id =
        's-' +
        (st.w ||
          st.t
            .slice(0, 20)
            .replace(/[^a-z0-9]/gi, '-')
            .toLowerCase());
      byId.set(id, st);
    }
    const s1 = byId.get(carriageIds[0]);
    const s2 = byId.get(carriageIds[1]);

    if (s1 && s2) {
      const towns1 = classifyTowns(s1);
      const towns2 = classifyTowns(s2);
      outer: for (const a of towns1) {
        for (const b of towns2) {
          question = getQuestion(a, b);
          if (question) break outer;
        }
      }
      if (!question) {
        noQuestion = [s1.t, s2.t].filter(Boolean).join(' + ');
      }
    }
  } else {
    // No combine — use the route endpoint towns' question
    question = getQuestion(firstId, lastId);
  }

  return new ImageResponse(
    trainTicket({
      firstName,
      lastName,
      midTowns,
      question,
      noQuestion,
      date: fmtDate(today),
      seats,
      car: car || null,
      ticketNo,
    }),
    { width: 1200, height: 630, fonts: ogFontList(fonts) },
  );
}
