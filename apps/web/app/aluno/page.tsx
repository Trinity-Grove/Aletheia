'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LearnerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const session = localStorage.getItem('learner_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.learnerId) {
          router.replace('/aluno/agenda');
          return;
        }
      }
    } catch {
      // Fallback
    }
    router.replace('/aluno/login');
  }, [router]);

  return null;
}
