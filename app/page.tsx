import Introduction from '@/app/components/main/Introduction';
import UpcomingEvents from '@/app/components/main/UpcomingEvents';
import Materials from '@/app/components/main/Materials';
import Calendar from '@/app/components/main/Calendar';
import Committee from '@/app/components/main/Committee';
import Announcement from './components/main/Announcement';

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