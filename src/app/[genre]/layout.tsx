import { ChatProvider } from '@/lib/chat-context';

interface GenreLayoutProps {
  children: React.ReactNode;
}

export default async function GenreLayout({ children }: GenreLayoutProps) {
  return <ChatProvider>{children}</ChatProvider>;
}
