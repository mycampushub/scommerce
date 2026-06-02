// Account pages layout - dynamic to prevent build-time data collection
export const dynamic = 'force-dynamic';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}