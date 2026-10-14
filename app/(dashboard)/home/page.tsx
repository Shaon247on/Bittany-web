import type { Metadata } from 'next';
import { Suspense } from 'react';
import HomePageClient from '@/features/home/components/HomePageClient';
import HomePageSkeleton from '@/features/home/components/HomePageSkeleton';

export const metadata: Metadata = {
  title: 'Dashboard Home | ParentBridge',
  description: 'Your ParentBridge dashboard overview.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageClient />
    </Suspense>
  );
}