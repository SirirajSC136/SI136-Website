// app/academics/page.tsx

import AcademicHero from '@/app/components/academics/AcademicHero';
import SubjectCard from '@/app/components/academics/SubjectCard';
import { Subject } from '@/types';

async function getSubjects(): Promise<Subject[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subjects`, {
            next: { revalidate: 60 },
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
    const allSubjects = await getSubjects(); // 1. Fetch all subjects first

    // --- THE FIX IS HERE ---
    // 2. Define the hardcoded ID you want to exclude.
    const excludedIdList = ['1266'];

    // 3. Filter the array to create a new list that does not include the subject with the excluded ID.
    const firstsubjects = allSubjects.filter(subject => !excludedIdList.includes(subject._id));

    const subjects = firstsubjects.map(s => {
        if (s.courseCode === 'SIID143_68') {
            return {
                ...s,
                courseCode: 'SIID 143/68',                          // display code
                title: s.title.replace(/SIID?143[_/ ]?68/, 'SI143/68') // fix if code appears in title
            };
        }
        return s;
    });

    console.log(subjects); // This will now log the filtered list of subjects

    // The rest of the component now uses the filtered `subjects` array.
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
        <div className="bg-background">
            <AcademicHero />
            <main className="container mx-auto px-4 py-16">
                {Object.entries(groupedSubjects).sort((a, b) => b[0].localeCompare(a[0])).map(([year, semesters]) => (
                    <section key={year} className="mb-16">
                        <div className="relative text-center mb-10">
                            <h2 className="text-4xl font-bold text-primary">{year}</h2>
                            <div className="absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-secondary-background"></div>
                        </div>
                        {Object.entries(semesters).sort((a, b) => a[0].localeCompare(a[0])).map(([semester, subjectList]) => (
                            <div key={semester} className="mt-4">
                                <h3 className="mb-8 text-center text-2xl font-semibold text-secondary">
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