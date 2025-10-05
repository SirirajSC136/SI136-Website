// app/components/academics/SubjectCard.tsx

import { Subject } from '@/types';
import Link from 'next/link';
// import Image from 'next/image'; // We no longer need this

const SubjectCard = ({ subject }: { subject: Subject }) => {
    return (
        <Link href={`/academics/${subject._id}`} className="group block rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            {/* --- THE FIX IS HERE --- */}
            {/* Replaced next/image with a standard img tag. */}
            <img
                src={`images/subjects/${subject._id}.png`}
                alt={`Image for ${subject.title}`}
                className="w-full h-48 object-cover rounded-t-xl"
            />
            <div className="p-5">
                <p className="text-sm font-semibold text-emerald-600">
                    Year {subject.year} &middot; Semester {subject.semester}
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-800 group-hover:text-emerald-700">{subject.courseCode}</h3>
                <p className="mt-1 text-slate-600 truncate">{subject.title}</p>
            </div>
        </Link>
    );
};

export default SubjectCard;