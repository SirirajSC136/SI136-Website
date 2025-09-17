// app/academics/page.tsx

import AcademicHero from '@/app/components/academics/AcademicHero';
import SubjectCard from '@/app/components/academics/SubjectCard';
import { Subject } from '@/types';

async function getSubjects(): Promise<Subject[]> {
    try {
        // --- THE FIX IS HERE ---
        // We replace `next: { revalidate: 600 }` with `cache: 'no-store'`
        // to ensure we always get fresh data from our API route.
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subjects`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error("API responded with an error:", res.status);
            return [];
        }
        return res.json();
    } catch (error) {
        console.error("Failed to fetch subjects:", error);
        return [];
    }
}

const AcademicPage = async () => {
    const subjects = await getSubjects();

    // If subjects is empty after the fetch, you can display a message
    if (!subjects || subjects.length === 0) {
        return (
            <div className="bg-white">
                <AcademicHero />
                <main className="container mx-auto px-4 py-16 text-center">
                    <h2 className="text-2xl font-bold text-slate-800">No subjects found.</h2>
                    <p className="text-slate-600 mt-2">The API might be returning an empty list, or there was an issue fetching the data.</p>
                </main>
            </div>
        );
    }

    const groupedSubjects = subjects.reduce((acc, subject) => {
        const yearKey = `Year ${subject.year}`;
        const semesterKey = `Semester ${subject.semester}`;
        if (!acc[yearKey]) acc[yearKey] = {};
        if (!acc[yearKey][semesterKey]) acc[yearKey][semesterKey] = [];
        acc[yearKey][semesterKey].push(subject);
        return acc;
    }, {} as Record<string, Record<string, Subject[]>>);

    return (
        <div className="bg-white">
            <AcademicHero />
            <main className="container mx-auto px-4 py-16">
                {Object.entries(groupedSubjects).sort((a, b) => b[0].localeCompare(a[0])).map(([year, semesters]) => (
                    <section key={year} className="mb-16">
                        <div className="relative text-center mb-10">
                            <h2 className="text-4xl font-bold text-slate-800">{year}</h2>
                            <div className="absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-gray-200"></div>
                        </div>
                        {Object.entries(semesters).sort((a, b) => a[0].localeCompare(a[0])).map(([semester, subjectList]) => (
                            <div key={semester} className="mt-4">
                                <h3 className="mb-8 text-center text-2xl font-semibold text-slate-600">
                                    {semester}
                                </h3>
                                <div className="grid grid-cols-1 gap-8 md-grid-cols-2 lg:grid-cols-3">
                                    {subjectList.map(subject => <SubjectCard key={subject._id} subject={subject} />)}
                                </div>
                            </div>
                        ))}
                    </section>
                ))}
            </main>
        </div>
    );
};

export default AcademicPage;