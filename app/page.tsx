import Introduction from "@/components/main/Introduction";
import UpcomingEvents from "@/components/main/UpcomingEvents";
import Materials from "@/components/main/Materials";
import Calendar from "@/components/main/Calendar";
import Committee from "@/components/main/Committee";
import Announcement from "@/components/main/Announcement";

export default function HomePage() {
	return (
		<>
			<Introduction />
			<Announcement />
			<UpcomingEvents />
			<Materials />
			<Calendar />
			<Committee />
		</>
	);
}
