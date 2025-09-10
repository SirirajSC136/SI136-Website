import Introduction from '@/app/components/main/Introduction';
import UpcomingEvents from '@/app/components/main/UpcomingEvents';
import Materials from '@/app/components/main/Materials';
import Calendar from '@/app/components/main/Calendar';
import Committee from '@/app/components/main/Committee';

export default function HomePage() {
  return (
    <>
      <Introduction />
      <UpcomingEvents />
      <Materials />
      <Calendar />
      <Committee />
    </>
  );
}