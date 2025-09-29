"use client"; // This directive makes it a Client Component

import { useState, useEffect } from 'react'; // Import hooks
import { Subject } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Import the correct hook
import TopicItem from '@/app/components/academics/TopicItem';
import { Home } from 'lucide-react';

// This helper function is fine and can be kept as is
async function getSubject(id: string): Promise<Subject | undefined> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subjects/${id}`, {
            next: { revalidate: 0 },
        });
        if (!res.ok) {
            return undefined;
        }
        return res.json();
    } catch (error) {
        console.error("Failed to fetch subject:", error);
        return undefined;
    }
}

// The component is no longer async
const SubjectDetailPage = () => {
    // State for managing data, loading, and errors
    const [subject, setSubject] = useState<Subject | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get URL parameters using the hook
    const params = useParams();
    const subjectId = params.subjectId as string;

    // Fetch data inside a useEffect hook
    useEffect(() => {
        if (!subjectId) return; // Don't fetch if the ID isn't available yet

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            const fetchedSubject = await getSubject(subjectId);

            if (fetchedSubject) {
                setSubject(fetchedSubject);
            } else {
                setError("Subject not found."); // Set an error state instead of calling notFound()
            }
            setIsLoading(false);
        };

        fetchData();
    }, [subjectId]); // Re-run the effect if the subjectId changes

    // --- Render loading and error states ---
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading subject...</div>;
    }

    if (error || !subject) {
        return <div className="flex h-screen items-center justify-center text-red-600">{error || "Could not load subject."}</div>;
    }

    // --- Render the page with the fetched data ---
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumbs Header */}
            <header className="border-b bg-white">
                <div className="container mx-auto flex items-center gap-2 p-4 text-sm text-slate-600">
                    <Link href="/" className="hover:text-emerald-600"><Home size={16} /></Link>
                    <span>/</span>
                    <Link href="/academics" className="hover:text-emerald-600">Academic</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">{subject.courseCode}</span>
                </div>
            </header>

            <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
                {/* Left Column: Subject Info */}
                <aside className="lg-col-span-1 lg:sticky lg:top-24 self-start">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <img
                            src={subject.imageUrl}
                            alt={`Image for ${subject.title}`}
                            className="h-auto w-full rounded-lg object-cover"
                        />
                        <div className="mt-5">
                            <p className="text-sm font-semibold text-emerald-600">
                                Year {subject.year} &middot; Semester {subject.semester}
                            </p>
                            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{subject.courseCode}</h1>
                            <h2 className="mt-1 text-lg text-slate-600">{subject.title}</h2>
                            {subject.canvasUrl && (
                                <a
                                    href={subject.canvasUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-slate-900"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.08c-1.47.4-2.98.21-4.22-.55l1.1-1.52c.7.48 1.51.64 2.26.46v1.61zm.04-3.76c-.53.21-1.11.26-1.65.12l.9-1.25c.21.07.43.1.64.1.55 0 1-.45 1-1s-.45-1-1-1c-.21 0-.4.06-.57.15L8.1 8.55c1.2-.62 2.68-.66 3.92.02.2.11.38.24.53.38l-1.49 2.07zm4.04 3.73c-1.24.76-2.75.95-4.22.55v-1.61c.75.18 1.56 0 2.26-.46l1.1 1.52z" /></svg>
                                    Go to Canvas
                                </a>
                            )}
                        </div>
                    </div>
                </aside>

                <section className="lg:col-span-2">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h3 className="text-2xl font-bold text-slate-800 border-b pb-4 mb-6">
                            Course Summary & Materials
                        </h3>
                        <div className="space-y-4">
                            {subject.topics.map(topic => <TopicItem key={topic.id} topic={topic} />)}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default SubjectDetailPage;