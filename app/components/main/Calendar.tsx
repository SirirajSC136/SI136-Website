const Calendar = () => {
    // IMPORTANT: Replace this src with the public embed URL from your own Google Calendar
    const calendarEmbedUrl = "https://calendar.google.com/calendar/u/0/embed?src=7a524a2877bd1861affa047cd44d8d80830214c00e300bda9e68bca66a634b48@group.calendar.google.com&ctz=Asia/Bangkok&csspa=1";

    return (
        <div className="container mx-auto my-12 px-4">
            <h2 className="text-3xl font-bold mb-6 text-center">Class Calendar</h2>
            <div className="rounded-lg overflow-hidden shadow-lg">
                <iframe
                    src={calendarEmbedUrl}
                    style={{ border: 0 }}
                    width="100%"
                    height="600"
                    frameBorder="0"
                    scrolling="no"
                ></iframe>
            </div>
        </div>
    );
};

export default Calendar;