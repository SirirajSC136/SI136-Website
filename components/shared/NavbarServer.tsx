import Navbar from "@/components/shared/Navbar";
import { getSessionUserFromCookies } from "@/lib/server/domains/auth/service";

export default async function NavbarServer() {
	const session = await getSessionUserFromCookies();
	return <Navbar isAdmin={session?.isAdmin === true} />;
}
