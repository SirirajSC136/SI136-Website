// app/components/academics/SubjectCard.tsx

import { Subject } from "@/types";
import Link from "next/link";

const SubjectCard = ({ subject }: { subject: Subject }) => {
	return (
		<Link
			href={`/academics/${subject._id}`}
			className="group block rounded-xl border broder-border bg-white dark:bg-secondary-background shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
			<img
				src={`images/subjects/${subject._id}.png`}
				alt={`Image for ${subject.title}`}
				className="w-full h-48 object-cover rounded-t-xl"
			/>
			<div className="p-5">
				<p className="text-sm font-semibold text-chart-2">
					Year {subject.year} &middot; Semester {subject.semester}
				</p>
				<h3 className="mt-2 text-xl font-bold text-primary group-hover:text-emerald-700">
					{subject.courseCode}
				</h3>
				<p className="mt-1 text-secondary whitespace-normal break-words">
					{subject.title}
				</p>
			</div>
		</Link>
	);
};

export default SubjectCard;
