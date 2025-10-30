'use client';

import { ArrowRight, CalendarMinus, Heart, School, ExternalLink, Lock, FileText, Send} from 'lucide-react';
import React from 'react';

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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="relative text-center mb-12 flex items-center justify-center">
        <hr className=' w-full border border-primary' />
        <h2 className="inline-block text-nowrap px-6 text-2xl sm:text-3xl font-bold text-primary relative z-10">{children}</h2>
        <hr className=' w-full border border-primary' />
    </div>
);

const ActionCard = ({ href, IconComponent, title }: { href: string; IconComponent: React.ElementType; title: string; }) => {
    
    const handleClick = (e: React.MouseEvent) => {
        if (href.startsWith('mailto:')) {
            e.preventDefault();
            window.location.href = href; // this will open default email client
        }
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            target={href.startsWith('http') ||  href.startsWith('/file') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-xl border border-border bg-background p-8 text-center shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:border-emerald-300"
        >
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-50 dark:bg-input rounded-bl-full opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150"></div>
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-300 text-slate-500 transition-colors duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                <IconComponent className="h-8 w-8 dark:text-slate-800" />
            </div>
            <span className="relative z-10 font-semibold text-primary mt-4">
                {title}
            </span>
            <div className="relative z-10 mt-auto flex items-center gap-2 text-sm font-bold text-emerald-600 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-3">
                Visit <ArrowRight size={16} />
            </div>
        </a>
    );
};


const ExternalLinkButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-border bg-background px-6 py-2.5 text-center font-semibold text-primary shadow-sm transition-all duration-300 ease-in-out hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 hover:shadow-md"
    >
        <span className="transition-transform duration-300 group-hover:-translate-x-1">{children}</span>
        <ArrowRight className="ml-2 h-4 w-4 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
    </a>
);

// --- Main Page Component ---
const UsefulInfoPage = () => {

    const subject = encodeURIComponent(
    'เขียน Subject ตาม Format COOR ความเร่งด่วน-ชื่อกิจกรรมหรือโครงการ-ฝ่ายประสานงานที่รับผิดชอบ-เรื่องที่ต้องการประสานติดต่อ เช่น COOR ด่วน-HailNight2026-ศิข-ติดต่อสอบถามสถานที่มหิดลสิทธาคาร'
  );

  const body = encodeURIComponent(
    'ระบุรายละเอียดการติดต่อกลับผู้ส่งเบื้องต้นภายในเนื้อความ เช่น จาก แซนดี้ ฝ่ายบริหาร (โทร.02 4197000)'
  );
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const mailtoLink = `mailto:chulathep.sil@student.mahidol.edu,Sikhada.wai@student.mahidol.edu,krittipat.let@student.mahidol.edu?subject=${subject}&body=${body}`;
    const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=chulathep.sil@student.mahidol.edu,Sikhada.wai@student.mahidol.edu,krittipat.let@student.mahidol.edu&su=${subject}&body=${body}`;

    const emailLink = isMobile ? mailtoLink : gmailHref;
    
    const classroomLinks = [
        { name: 'SmartEdu', href: 'https://smartedu.mahidol.ac.th/' },
        { name: 'MUx', href: 'https://mux.mahidol.ac.th/' },
        { name: 'Canvas', href: 'https://www.sieduit.org/education/sirirajcanvas/' },
        { name: 'MUGE 100', href: 'https://clil.mahidol.ac.th/muge100/' },
        { name: 'LATH 100', href: 'https://sites.google.com/mahidol.edu/lath100/' },
        { name: 'GE PLUS', href: 'https://sites.google.com/view/geplusmahidol/' },
    ];

    const departmentLinks = [
        { IconComponent: CalendarMinus, href: './UsefulInfo/absent', title: 'การลานักศึกษา' },
        { IconComponent: Lock, href: 'https://si-eservice3.si.mahidol.ac.th/selfservice/', title: 'แก้ไขรหัส CANVAS' },
        { IconComponent: Heart, href: 'https://www.sieduit.org/education/health-service-for-student', title: 'บริการสุขภาพ' },
        { IconComponent: School, href: 'https://mustudent.mahidol.ac.th/2022/07/25376', title: 'MU One Stop Service' }
    ];

    const CoordinatorLinks = [ 
        { IconComponent: FileText, href: '/file/รายงานการประสานงานตามคำขอ.pdf', title: 'เอกสาร รายงานการประสานงานตามคำขอ' },
        { IconComponent: Send, href: emailLink, title: ' ส่งอีเมลถึงฝ่ายประสานงาน' }
    ]

    return (
        <div className="bg-secondary-background">
            <PageHero
                title="Useful Info"
                subtitle="ข้อมูลที่เป็นประโยชน์และลิงก์สำคัญสำหรับนักศึกษาแพทย์ศิริราช"
            />
            <main className="container mx-auto px-4 py-20">
                <div className="space-y-20">
                    
                    <section>
                        <SectionTitle>บริการนักศึกษา</SectionTitle>
                        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                            {departmentLinks.map((link) => (
                                <ActionCard key={link.title} {...link} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <SectionTitle>ห้องเรียนของมหิดลศาลายา</SectionTitle>
                        <div className="mx-auto max-w-5xl">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex items-center justify-center gap-5">
                                {classroomLinks.map((link) => (
                                    <ExternalLinkButton key={link.name} href={link.href}>
                                        {link.name}
                                    </ExternalLinkButton>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section>
                        <SectionTitle>ติดต่อฝ่ายประสานงาน</SectionTitle>
                        <div className="grid grid-cols-2 gap-8 ">
                            {CoordinatorLinks.map((link) => (
                                <ActionCard key={link.title} {...link} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <SectionTitle>การเดินทาง</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                <img src="./images/directions/salaya-to-siriraj.jpg" alt="Salaya to Siriraj Schedule" className="w-full h-auto " />
                           </div>
                           <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                <img src="./images/directions/siriraj-to-salaya.jpg" alt="Siriraj to Salaya Schedule" className="w-full h-auto " />
                           </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default UsefulInfoPage;

