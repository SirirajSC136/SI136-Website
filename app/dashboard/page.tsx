import { getSessionUserFromCookies } from "@/lib/server/auth/session";

export default async function DashboardPage() {
  const session = await getSessionUserFromCookies();

  if (!session) {
    return <div className="p-10 text-center">Access Denied. Please log in.</div>;
  }

  return (
    <div className="p-10">
      <h1>Welcome, {session.name || session.email || session.uid}</h1>
    </div>
  );
}
