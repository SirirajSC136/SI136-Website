"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { GetNowTime } from '@/util/time';

type DeadlineResult = {
  text: string;
  isUrgent: boolean;
};

// ✅ Define the assignment type
interface Assignment {
  Subject: string;
  "Work Name": string;
  Deadline: string;
  "รายละเอียดเพิ่มเติม": string;
}

const formatSheetDeadline = (dateString: string): DeadlineResult => {
    if (!dateString) return { text: "No deadline", isUrgent: false };
    const parts = dateString.split('/');
    if (parts.length !== 3) return { text: "Invalid date", isUrgent: false };
    const target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const diff = target.getTime() - GetNowTime() + 86399000;
    console.log(diff)
    if (diff < 0) return { text: "Past", isUrgent: false };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const text = days > 0 ? `${days}d ${hours}h left` : hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
    return { text, isUrgent: diff < 24 * 60 * 60 * 1000 };
};

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const updateCountdown = () => {
    const { text, isUrgent } = formatSheetDeadline(assignment.Deadline);
    setTimeLeft(text);
    setIsUrgent(isUrgent);
  };

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 60 * 1000); // update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href={assignment["รายละเอียดเพิ่มเติม"]}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 mb-3 bg-background rounded-lg border border-border transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <ClipboardList className="h-5 w-5 mt-0.5 text-amber-700" />
          <div>
            <p className="font-semibold text-amber-700">{assignment.Subject}</p>
            <p className="text-primary font-medium mt-1">{assignment["Work Name"]}</p>
          </div>
        </div>
        <span
          className={`text-xs font-medium flex-shrink-0 ml-2 ${
            isUrgent ? "text-red-600 " : "text-primary"
          }`}
        >
          {timeLeft}
        </span>
      </div>
    </Link>
  );
}
