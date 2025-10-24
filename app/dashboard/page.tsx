import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div className="p-10 text-center">Access Denied. Please log in.</div>;
  }

  return (
    <div className="p-10">
      <h1>Welcome, {session.user?.name}</h1>
    </div>
  );
}
