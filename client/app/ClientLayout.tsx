'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import Header from "./(components)/Header";
import Sidebar from "./(components)/Sidebar";

const queryClient = new QueryClient();

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen">
        {!isAuthPage && <Header />}
        <div className="flex flex-1 overflow-hidden">
          {!isAuthPage && <Sidebar />}
          <main className={`flex-1 overflow-y-auto ${!isAuthPage ? 'p-4' : 'p-0'}`}>
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
