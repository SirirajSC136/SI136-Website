// /app/UsefulInfo/page.tsx

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// --- Reusable Components (defined in the same file for simplicity) ---

// Component for the main hero banner
const Hero = ({ title, imageUrl }: { title: string; imageUrl: string }) => (
    <div className="relative h-[50vh] w-full">
        <Image
            src={imageUrl}
            alt="Hero background"
            layout="fill"
            objectFit="cover"
            quality={100}
            priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full items-center justify-center">
            <h1 className="text-5xl font-extrabold text-white md:text-7xl">
                {title}
            </h1>
        </div>
    </div>
);

// Component for section titles
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
        {children}
    </h2>
);

// Component for the outlined buttons (Mahidol Classrooms)
const ExternalLinkButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-center font-semibold text-gray-600 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-lg"
    >
        {children}
    </Link>
);

// Component for the image-based cards (Siriraj Departments)
const ImageLinkCard = ({ href, imageUrl, alt }: { href: string; imageUrl: string; alt: string }) => (
    <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-2xl bg-white shadow-md transition-shadow duration-300 hover:shadow-xl"
    >
        <div className="relative aspect-square">
            <Image
                src={imageUrl}
                alt={alt}
                layout="fill"
                objectFit="contain" // Use 'contain' to show the whole logo
                className="p-4 transition-transform duration-500 ease-in-out group-hover:scale-110"
            />
        </div>
    </Link>
);

// Component for the solid green buttons (Travel section)
const InfoButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/80 px-8 py-4 text-center text-xl font-bold text-white shadow-md transition-all duration-300 hover:bg-emerald-500 hover:shadow-lg"
    >
        {children}
    </Link>
);


// --- Main Page Component ---

const UsefulInfoPage = () => {
    // --- Data (replace with your actual links and image paths) ---
    const classroomLinks = [
        { name: 'SmartEdu', href: 'https://smartedu.mahidol.ac.th/' },
        { name: 'MUx', href: 'https://mux.mahidol.ac.th/' },
        { name: 'Canvas', href: 'https://www.sieduit.org/education/sirirajcanvas/' },
        { name: 'MUGE 100', href: 'https://clil.mahidol.ac.th/muge100/' },
        { name: 'LATH 100', href: 'https://sites.google.com/mahidol.edu/lath100/' },
        { name: 'GE PLUS', href: 'https://sites.google.com/view/geplusmahidol/' },
    ];

    const departmentLinks = [
        { alt: 'Siriraj Logo 1', imageUrl: '/path/to/your/logo1.png', href: 'https://sites.google.com/student.mahidol.edu/siirraj135/home' },
        { alt: 'Siriraj Logo 2', imageUrl: '/path/to/your/logo2.png', href: '#' },
        { alt: 'Siriraj Education Logo', imageUrl: '/path/to/your/logo3.png', href: '#' },
        { alt: 'Siriraj Logo 4', imageUrl: '/path/to/your/logo4.png', href: '#' },
    ];

    return (
        <div className="bg-gray-50">
            {/* Hero Section */}
            <Hero title="Useful Info" imageUrl="/path/to/your/hero-background.jpg" />

            <div className="container mx-auto px-4 py-16">
                {/* Section 1: Mahidol Salaya Classrooms */}
                <section className="mb-16">
                    <SectionTitle>ห้องเรียนของมหิดลศาลายา</SectionTitle>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {classroomLinks.map((link) => (
                            <ExternalLinkButton key={link.name} href={link.href}>
                                {link.name}
                            </ExternalLinkButton>
                        ))}
                    </div>
                </section>

                {/* Section 2: Departments within Siriraj */}
                <section className="mb-16">
                    <SectionTitle>หน่วยงานภายในศิริราช</SectionTitle>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        {departmentLinks.map((link) => (
                            <ImageLinkCard key={link.alt} {...link} />
                        ))}
                    </div>
                </section>

                {/* Section 3: Travel (Salaya) */}
                <section className="mb-16">
                    <SectionTitle>การเดินทาง (ศาลายา)</SectionTitle>
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <InfoButton href="https://op.mahidol.ac.th/ga/shuttle-bus/">ตารางรถ Shuttle Bus</InfoButton>
                        <InfoButton href="https://mustudent.mahidol.ac.th/2022/08/28281/">การเดินทางในศาลายา</InfoButton>
                    </div>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Replace with your schedule images */}
                        <Image src="/images/directions/salaya-to-siriraj.jpg" alt="Salaya to Siriraj Schedule" width={800} height={1200} className="rounded-xl shadow-lg" />
                        <Image src="/images/directions/siriraj-to-salaya.jpg" alt="Siriraj to Salaya Schedule" width={800} height={1200} className="rounded-xl shadow-lg" />
                    </div>
                </section>

                {/* Section 4: Travel (Siriraj) */}
                <section>
                    <SectionTitle>การเดินทาง (ศิริราช)</SectionTitle>
                    <div className="flex justify-center">
                        <InfoButton href="https://www2.si.mahidol.ac.th/en/wp-content/uploads/2016/12/MAP-UPDATED-18-01-2017-1.pdf">ไฟล์แผนที่ศิริราชฉบับเต็ม</InfoButton>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default UsefulInfoPage;