import { redirect } from 'next/navigation';

// Phase 1 placeholder — front door arrives in Phase 2.
// For now, / redirects to /library so existing nav links keep working.
export default function Page() {
  redirect('/library');
}
