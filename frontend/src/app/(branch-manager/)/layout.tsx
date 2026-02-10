import { BranchManagerSidebar } from '@/components/layout/branch-manager-sidebar';

export default function BranchManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <BranchManagerSidebar />
      <main className="flex-1 bg-background-gray overflow-auto">
        {children}
      </main>
    </div>
  );
}
