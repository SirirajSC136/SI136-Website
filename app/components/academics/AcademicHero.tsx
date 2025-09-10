import { BookHeart } from 'lucide-react';

const AcademicHero = () => (
    <div className="w-full bg-gradient-to-b from-emerald-50 via-gray-50 to-white py-16 md:py-24">
        <div className="container mx-auto text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
                Academic Resources
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
                A comprehensive collection of course materials, lecture notes, and resources.
            </p>
            <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-emerald-700">
                <BookHeart size={20} />
                Donate Resource
            </button>
        </div>
    </div>
);

export default AcademicHero;