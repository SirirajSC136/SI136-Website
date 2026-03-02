import LoginButton from "@/components/LoginButton";
import { getSessionUserFromCookies } from "@/lib/server/domains/auth/service";

type GuardCardProps = {
	title: string;
	description: string;
	showLogin?: boolean;
};

function GuardCard({ title, description, showLogin = false }: GuardCardProps) {
	return (
		<div className="container mx-auto flex min-h-[calc(100vh-220px)] items-center justify-center px-4 py-16">
			<div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
				<h2 className="mb-3 text-2xl font-bold text-foreground">{title}</h2>
				<p className="text-sm text-muted-foreground">{description}</p>
				{showLogin ? <LoginButton /> : null}
			</div>
		</div>
	);
}

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSessionUserFromCookies();

	if (!session) {
		return (
			<GuardCard
				title="Admin Access Required"
				description="You must sign in to access the admin dashboard."
				showLogin
			/>
		);
	}

	if (!session.isAdmin) {
		return (
			<GuardCard
				title="Admin Role Required"
				description="Your account is authenticated but does not have admin access."
			/>
		);
	}

	return <>{children}</>;
}
