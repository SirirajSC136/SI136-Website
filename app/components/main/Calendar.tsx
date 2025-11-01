// ./app/components/Calendar.tsx

"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar as CalendarIcon } from "lucide-react";

type EventInput = {
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  location?: string;
  extendedProps?: Record<string, any>;
};

export default function MyCalendar() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch("/api/events");
        const json = await res.json();
        if (isMounted && json?.events) setEvents(json.events);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full bg-secondary-background py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-emerald-900 dark:text-emerald-600">
            Year 1 Schedule
          </h2>
          <p className="mt-2 text-lg text-secondary">
            A centralized view of SI136 academic events.
          </p>
        </div>

        {/* Calendar card styled like Materials ResourceCard */}
        <div className="flex flex-col rounded-xl bg-background border border-border p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5">
          {/* Card Header */}
          <div className="flex items-center gap-4 border-b border-border pb-4 mb-4">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
              <CalendarIcon size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary">
              SI136 Academic Calendar
            </h3>
          </div>

          {/* Calendar Body */}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: "title",
              center: "",
              right: "today prev,next",
            }}
            initialView="dayGridMonth"
            height="90vh"
            expandRows={true}
            fixedWeekCount={false}
            events={events}
            eventContent={(arg) => {
              const isFinalExam = arg.event.extendedProps?.type === "finalExam";
              return (
                <div
                  className={`flex items-center justify-center px-3 py-1 text-sm font-medium transition-all duration-200 hover:shadow-sm focus:outline-none
                    ${
                      isFinalExam
                        ? "rounded-md bg-red-50 text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-100 hover:ring-red-300 dark:bg-red-900 dark:text-red-300 dark:ring-red-700 dark:hover:bg-red-800"
                        : "rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 hover:ring-emerald-300 dark:bg-emerald-900 dark:text-emerald-300 dark:ring-emerald-700 dark:hover:bg-emerald-800"
                    }`}
                >
                  <span className="truncate">{arg.event.title}</span>
                </div>
              );
            }}
            dayCellContent={(arg) => {
              const isToday =
                arg.date.toDateString() === new Date().toDateString();
              return (
                <div
                  className={`flex items-center justify-center w-8 h-8 ${
                    isToday
                      ? "rounded-full bg-emerald-600 text-white font-semibold dark:bg-emerald-400 dark:text-gray-900"
                      : ""
                  }`}
                >
                  {arg.dayNumberText}
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
