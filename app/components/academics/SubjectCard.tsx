// app/components/academics/SubjectCard.tsx

import Link from 'next/link';
import Image from 'next/image';
import { Subject } from '@/types';

const SubjectCard = ({ subject }: { subject: Subject }) => (
    <Link href={`/academics/${subject.id}`} className="group block overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-lg">
        {/* The parent div MUST be relative for layout="fill" to work */}
        <div className="relative h-56">
            <Image
                // The `src` prop correctly receives a string from `subject.imageUrl`.
                // Next.js handles this correctly because we use `layout="fill"`.
                src={subject.imageUrl}
                alt={`Image for ${subject.title}`}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-500 ease-in-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 text-white">
                <h3 className="text-2xl font-bold">{subject.courseCode}</h3>
                <p className="text-sm font-light uppercase tracking-wider">{subject.title}</p>
            </div>
        </div>
        <div className="bg-white p-4 text-center font-semibold text-gray-700 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
            View Details
        </div>
    </Link>
);

export default SubjectCard;