import { ChatProvider } from '@/lib/chat-context';
import Chatbot from '@/components/Chatbot';

interface GenreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ genre: string }>;
}

export default async function GenreLayout({ children, params }: GenreLayoutProps) {
  const { genre } = await params;
  return (
    <ChatProvider>
      {children}
      <Chatbot genre={genre} />
    </ChatProvider>
  );
}
