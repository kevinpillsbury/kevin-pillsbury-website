import { ChatProvider } from '@/lib/chat-context';

interface GenreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ genre: string }>;
}

export default async function GenreLayout({ children, params }: GenreLayoutProps) {
  return <ChatProvider>{children}</ChatProvider>;
}
