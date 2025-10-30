import { ReactNode } from 'react';
import { Laptop, Library, Users, ArrowUpRight, University } from 'lucide-react';

// A redesigned, more interactive LinkButton component
const LinkButton = ({ href, children }: { href: string; children: ReactNode }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-4 rounded-lg bg-emerald-50 dark:bg-input px-4 py-2 text-sm font-medium text-chart-2 ring-1 ring-inset ring-emerald-200 dark:ring-border transition-all duration-200 hover:bg-emerald-100 hover:ring-emerald-300 hover:shadow-sm"
    >
        {children}
        <ArrowUpRight className="h-4 w-4 text-chart-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </a>
);

// A component for the styled card sections
const ResourceCard = ({ icon, title, links }: { icon: ReactNode; title: string; links: { name: string; href: string }[] }) => (
    <div className="flex flex-col rounded-xl bg-background border border-border p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5">
        {/* Card Header */}
        <div className="flex items-center gap-4 border-b border-border pb-4 mb-4">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-primary">{title}</h3>
        </div>
        {/* Links Container */}
        <div className="flex flex-wrap gap-3">
            {links.map(link => <LinkButton key={link.name} href={link.href}>{link.name}</LinkButton>)}
        </div>
    </div>
);

const Materials = () => {
    // A cleaner data structure for easier mapping
    const resourceSections = [
        {
            title: 'Learning System & Portal',
            icon: <Laptop size={24} />,
            links: [
                { name: 'Canvas', href: 'https://www.sieduit.org/education/sirirajcanvas/' },
                { name: 'SELECx', href: 'https://selecx-new.si.mahidol.ac.th/' },
                { name: 'SmartEDU', href: 'https://smartedu.mahidol.ac.th/' },
                { name: 'Siriraj SSO', href: 'https://si-eservice3.si.mahidol.ac.th/selfservice/' },
                { name: 'MU Life Pass', href: 'https://mustudent.mahidol.ac.th/' },
            ],
        },
        {
            title: 'Academic Sites',
            icon: <Library size={24} />,
            links: [
                { name: 'SI135', href: 'https://sites.google.com/student.mahidol.edu/siriraj135/' }, { name: 'SI134', href: 'https://siriraj134.com/' }, { name: 'SI133', href: 'https://sites.google.com/view/siriraj133official/' }, 
                { name: 'SI132', href: 'https://sites.google.com/view/siriraj132/' }, { name: 'SI131', href: 'https://sites.google.com/view/siriraj131official/' }, { name: 'SI130', href: 'https://sites.google.com/view/siriraj130/' }, 
            ],
        },
        {
            title: 'SMSU (สพศ.)',
            icon: <Users size={24} />,
            links: [
                { name: 'SMSU One Stop Guide', href: 'https://guide.smsu.in.th/?fbclid=PAZXh0bgNhZW0CMTEAAad6Ris-c2JEvZ0ZJIgGcKk6iBY6nH5KC7v8-NdPcKPOyl847_0pUXESTSwXTA_aem_SC3yrdWx8Tle9h4rTyN_nw' }, { name: 'IG SMSU', href: 'https://www.instagram.com/smsusiriraj/' },
                { name: 'IG PD (Personal Development)', href: 'https://www.instagram.com/pdsiriraj/' }, { name: '101 Research Guidebook', href: 'https://drive.google.com/drive/folders/1-FcrdoYpiVwZCKjlQvcamLto4BTvLPhT' },
            ],
        },
        {
            title: 'SI136',
            icon: <University size={24} />,
            links: [
                { name: 'IG SI136', href: '#' }, { name: 'LineOA', href: '#/' },
                { name: 'บริจาคงบทำเว็บ', href: '#' },
            ],
        },
    ];

    return (
        <div className="w-full bg-secondary-background py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold text-emerald-900 dark:text-emerald-600">Material & Useful Links</h2>
                    <p className="mt-2 text-lg text-secondary">A centralized hub for all your essential resources.</p>
                </div>

                {/* Grid layout for the resource cards */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {resourceSections.map((section) => (
                        <ResourceCard
                            key={section.title}
                            icon={section.icon}
                            title={section.title}
                            links={section.links}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Materials;