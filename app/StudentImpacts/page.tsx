'use client';

import { ShieldCheck, UserPlus, TriangleAlert, Info, ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

const PageHero = ({ title, subtitle }: { title: string; subtitle: string }) => {
    const keyframes = `
        @keyframes move-light-1 {
            0% { transform: translate(-20%, -20%); opacity: 1; }
            50% { transform: translate(20%, 10%); opacity: 1; }
            100% { transform: translate(-20%, -20%); opacity: 1; }
        }
        @keyframes move-light-2 {
            0% { transform: translate(10%, 20%); opacity: 1; }
            50% { transform: translate(-10%, -20%); opacity: 1; }
            100% { transform: translate(10%, 20%); opacity: 1; }
        }
    `;

    return (
        <>
            <style>{keyframes}</style>
            <div className="relative overflow-hidden bg-slate-800 py-24 text-center border-b border-slate-800">
                <div className="absolute top-0 left-0 w-full h-full z-0">
                    <div 
                        className="absolute h-[500px] w-[500px] rounded-full bg-sky-500/30"
                        style={{ animation: 'move-light-1 8s ease-in-out infinite', filter: 'blur(120px)'}}
                    />
                    <div 
                        className="absolute h-[400px] w-[400px] rounded-full bg-sky-400/20"
                        style={{ animation: 'move-light-2 8s ease-in-out infinite alternate', filter: 'blur(100px)', right: 0, bottom: 0 }}
                    />
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 relative z-10">
                    <h1
                        className="text-5xl font-extrabold text-white tracking-tight sm:text-6xl"
                        style={{ textShadow: '0 3px 15px rgba(0, 0, 0, 1)' }}
                    >
                        {title}
                    </h1>
                    <p
                        className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto"
                        style={{ textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}
                    >
                        {subtitle}
                    </p>
                </div>
            </div>
        </>
    );
};


const ActionCard = ({ icon, title, href, description }: { icon: ReactNode; title: string; href: string; description: string; }) => (
    <a
        href={href}
        className="group relative flex flex-col items-start overflow-hidden rounded-xl border border-border bg-background p-8 text-left shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:border-emerald-300"
    >
        {/* Decorative element that animates on hover */}
        <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-50 dark:bg-emerald-800 rounded-bl-full opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150"></div>

        <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-secondary transition-colors duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
            {icon}
        </div>
        <div className="relative z-10 mt-6">
            <h3 className="text-xl font-bold text-primary">
                {title}
            </h3>
            <p className="mt-2 text-slate-500">{description}</p>
        </div>
        <div className="relative z-10 mt-auto pt-6 flex items-center gap-2 text-md font-bold text-emerald-600 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-3">
            Proceed <ArrowRight size={20} />
        </div>
    </a>
);

// --- The Main Page Component ---
const StudentImpactPage = () => {
    return (
        <div className="min-h-screen bg-secondary-background">
            <PageHero
                title="Student Impact"
                subtitle="ช่องทางการติดต่อสอบถาม, แจ้งเรื่อง และร้องเรียนปัญหาโดยตรงถึงคณะกรรมการนักศึกษา"
            />

            <main className="container mx-auto px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    
                    {/* Main Official Channel Card */}
                    <div className="lg:col-span-3 flex flex-col justify-between rounded-xl border border-border bg-background p-8 shadow-md">
                        <div>
                            <div className="flex items-center gap-4">
                                <img
                                    src="https://placehold.co/80x80/e2e8f0/475569?text=Logo"
                                    alt="SISC136 Official Logo"
                                    width={80}
                                    height={80}
                                    className="rounded-full"
                                />
                                <div>
                                    <h3 className="text-3xl font-bold text-primary">SISC136 Official</h3>
                                    <p className="mt-1 text-secondary">ช่องทางสื่อสารหลักของคณะกรรมการนักศึกษาแพทย์</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <a
                                href="#" // Replace with your actual link
                                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-lg bg-emerald-500 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:bg-emerald-600 hover:shadow-xl hover:scale-105"
                            >
                                <span className="absolute left-0 top-0 h-0 w-0 border-t-2 border-emerald-300 transition-all duration-300 group-hover:w-full"></span>
                                <span className="absolute right-0 top-0 h-0 w-0 border-r-2 border-emerald-300 transition-all duration-300 group-hover:h-full"></span>
                                <span className="absolute bottom-0 right-0 h-0 w-0 border-b-2 border-emerald-300 transition-all duration-300 group-hover:w-full"></span>
                                <span className="absolute bottom-0 left-0 h-0 w-0 border-l-2 border-emerald-300 transition-all duration-300 group-hover:h-full"></span>
                                <UserPlus size={20} />
                                <span>เพิ่มเพื่อน / ติดตาม</span>
                            </a>
                        </div>
                    </div>

                    {/* Anonymous Feedback Card */}
                    <div className="lg:col-span-2">
                        <ActionCard
                            href="https://script.google.com/macros/s/AKfycbyeavzUz9-IIOMIJads5NzpPRr3qwt2x5n6WKPjg06GG3fJlOJgTS8uAoSDu6M_BvnT/exec"
                            icon={<TriangleAlert size={28} />}
                            title="ฟอร์มรับเรื่องร้องเรียน"
                            description="แจ้งปัญหาหรือเรื่องร้องเรียนต่างๆ แบบไม่ระบุตัวตนถึงคณะกรรมการโดยตรง"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentImpactPage;

