import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, UserPlus, TriangleAlert, ClipboardCheck, Info, ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';
import monke from '@/app/assets/images/monke.jpg'
// --- Reusable Sub-Component for the Action Cards ---
const ActionCard = ({ icon, title, href }: { icon: ReactNode; title: string; href: string }) => (
    <Link
        href={href}
        className="group relative flex flex-col items-center justify-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-300"
    >
        {/* The large icon */}
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 transition-all duration-300 group-hover:bg-emerald-100">
            <div className="text-slate-400 transition-colors duration-300 group-hover:text-emerald-600">
                {icon}
            </div>
        </div>
        {/* The title text */}
        <h3 className="text-lg font-semibold text-slate-700 transition-colors duration-300 group-hover:text-emerald-800">
            {title}
        </h3>
        {/* A subtle arrow that appears on hover for extra flair */}
        <div className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110">
            <ArrowRight size={20} />
        </div>
    </Link>
);

// --- The Main Page Component ---
const StudentImpactPage = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Section 1: The Hero */}
            <section className="relative flex h-72 w-full items-center justify-center text-center">
                <Image
                    src={monke} // Make sure you have an image at this path
                    alt="Students celebrating graduation"
                    layout="fill"
                    objectFit="cover"
                    quality={80}
                    className="brightness-[.60]"
                />
                <div className="relative z-10">
                    <h1 className="text-6xl font-extrabold text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        Student Impact
                    </h1>
                </div>
            </section>

            {/* Section 2: Themed Banner */}
            <section className="bg-gradient-to-r from-emerald-600 to-teal-500 py-4 text-center text-white shadow-md">
                <h2 className="text-xl font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    ช่องทางการติดต่อสอบถาม & แจ้งเรื่องโดยตรง
                </h2>
            </section>

            {/* Section 3: Official Channel Card */}
            <section className="py-16 px-4">
                <div className="mx-auto max-w-md">
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                        <Image
                            src={monke} // Using your main site logo
                            alt="SISC136 Official Logo"
                            width={100}
                            height={100}
                            className="rounded-full"
                        />
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-7 w-7 text-emerald-500" />
                            <h3 className="text-3xl font-bold text-slate-800">SISC136 Official</h3>
                        </div>
                        <p className="text-slate-500">ช่องทางสื่อสารหลักของคณะกรรมการนักศึกษาแพทย์</p>
                        <a
                            href="#" // Replace with your actual link (e.g., LINE, Facebook)
                            className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-105 hover:bg-emerald-600"
                        >
                            <UserPlus size={20} />
                            เพิ่มเพื่อน / ติดตาม
                        </a>
                    </div>
                </div>
            </section>

            {/* Section 4: Anonymous Feedback */}
            <section className="bg-white py-16 px-4">
                <div className="container mx-auto">
                    <div className="mb-12 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 py-4 text-center text-white shadow-md">
                        <h2 className="text-xl font-semibold">
                            ร้องเรียนปัญหา (แบบไม่ระบุตัวตน)
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        <ActionCard
                            href="https://script.google.com/macros/s/AKfycbyeavzUz9-IIOMIJads5NzpPRr3qwt2x5n6WKPjg06GG3fJlOJgTS8uAoSDu6M_BvnT/exec " // Link to the complaint form
                            icon={<TriangleAlert size={80} strokeWidth={1.5} />}
                            title="ฟอร์มรับเรื่องร้องเรียนปัญหา SI136"
                        />
                    </div>
                </div>
            </section>

            {/* Section 5: Footer Information Banner */}
            <section className="bg-amber-50 py-8 px-4">
                <div className="container mx-auto flex items-start gap-4 rounded-lg border border-amber-200 bg-white p-6">
                    <div className="flex-shrink-0">
                        <Info className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-amber-900">
                            เว็บไซต์นักศึกษาแพทย์ศิริราชรุ่นที่ 136
                        </h4>
                        <p className="mt-1 text-slate-600">
                            จัดทำโดย คณะกรรมการนักศึกษาแพทย์ศิริราชรุ่นที่ 136 (SISC136) ชั้นปีที่ 1
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StudentImpactPage;