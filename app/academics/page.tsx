import { subjects } from '@/app/data/subjects';
import AcademicHero from '@/app/components/academics/AcademicHero';
import SubjectCard from '@/app/components/academics/SubjectCard';
import { Subject } from '@/types';

const AcademicPage = () => {
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
                        {Object.entries(semesters).sort((a, b) => a[0].localeCompare(b[0])).map(([semester, subjectList]) => (
                            <div key={semester} className="mt-4">
                                <h3 className="mb-8 text-center text-2xl font-semibold text-slate-600">
                                    {semester}
                                </h3>
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {subjectList.map(subject => <SubjectCard key={subject.id} subject={subject} />)}
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