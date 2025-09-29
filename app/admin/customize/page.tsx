// app/admin/customize/page.tsx

import { Subject } from '@/types';
import Link from 'next/link';
import { Edit } from 'lucide-react';

async function getSubjects(): Promise<Subject[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subjects`, {
            cache: 'no-store', // Always fetch fresh data for the admin panel
        });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error("Failed to fetch subjects for admin:", error);
        return [];
    }
}

const AdminCustomizeLandingPage = async () => {
    const subjects = await getSubjects();

    if (!subjects || subjects.length === 0) {
        return (
            <div className="container mx-auto p-8 text-center">
                <h1 className="text-3xl font-bold">Customize Courses</h1>
                <p className="mt-4 text-slate-600">No subjects found to customize.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="container mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Customize Courses</h1>
                    <p className="mt-2 text-slate-600">Select a subject to add, edit, or remove custom materials.</p>
                </div>

                <div className="rounded-xl border bg-white shadow-sm">
                    <ul className="divide-y divide-slate-200">
                        {subjects.map(subject => (
                            <li key={subject._id}>
                                <Link href={`/admin/customize/${subject._id}`} className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50">
                                    <div>
                                        <p className="font-bold text-slate-800 group-hover:text-emerald-600">{subject.courseCode} - {subject.title}</p>
                                        <p className="text-sm text-slate-500">Year {subject.year} &middot; Semester {subject.semester}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <span className="text-sm font-semibold">Customize</span>
                                        <Edit size={16} />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default AdminCustomizeLandingPage;