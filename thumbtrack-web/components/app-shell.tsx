'use client';

import { useAuth } from '@/lib/auth-context';
import { Sidebar, MobileNav } from '@/components/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // Show sidebar and adjust layout only when logged in
  const showSidebar = !isLoading && !!user;

  return (
    <div className="flex">
      {/* Desktop Sidebar - only when logged in */}
      {showSidebar && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}
      
      {/* Main Content */}
      <main className={`flex-1 pt-16 pb-16 md:pb-0 ${showSidebar ? 'md:pl-16' : ''}`}>
        {children}
      </main>
      
      {/* Mobile Bottom Navigation - only when logged in */}
      {showSidebar && <MobileNav />}
    </div>
  );
}
