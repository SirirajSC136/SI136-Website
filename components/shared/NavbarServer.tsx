import Navbar from "@/components/shared/Navbar";
import { SessionSummary } from "@/lib/auth/sessionSummary";
import { getSessionUserFromCookies } from "@/lib/server/domains/auth/service";

export default async function NavbarServer() {
	const session = await getSessionUserFromCookies();
	const sessionSummary: SessionSummary = session
		? {
				isAuthenticated: true,
				isAdmin: session.isAdmin,
				name: session.name,
				email: session.email,
				picture: session.picture,
			}
		: {
				isAuthenticated: false,
				isAdmin: false,
			};

	return <Navbar session={sessionSummary} />;
}
