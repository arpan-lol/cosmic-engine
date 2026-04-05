import type { Metadata } from 'next';
import { ArchitectureV2Scene } from '@/components/arch-v2/ArchitectureV2Scene';

export const metadata: Metadata = {
  title: 'Cosmic Engine - Architecture v2',
  description: 'Interactive architecture visual for baseline RAG and strategy toggles.',
};

export default function ArchitectureV2Page() {
  return <ArchitectureV2Scene />;
}
