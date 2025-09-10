import { ReactNode } from 'react';
import { Laptop, Library, Users, ArrowUpRight } from 'lucide-react';

// A redesigned, more interactive LinkButton component
const LinkButton = ({ href, children }: { href: string; children: ReactNode }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200 transition-all duration-200 hover:bg-emerald-100 hover:ring-emerald-300 hover:shadow-sm"
    >
        {children}
        <ArrowUpRight className="h-4 w-4 text-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </a>
);

// A component for the styled card sections
const ResourceCard = ({ icon, title, links }: { icon: ReactNode; title: string; links: { name: string; href: string }[] }) => (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5">
        {/* Card Header */}
        <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-4">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
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
                { name: 'Canvas', href: '#' },
                { name: 'SELECx', href: '#' },
                { name: 'SmartEDU', href: '#' },
            ],
        },
        {
            title: 'Academic Sites',
            icon: <Library size={24} />,
            links: [
                { name: 'SI133', href: '#' }, { name: 'SI132', href: '#' }, { name: 'SI131', href: '#' },
                { name: 'SI130', href: '#' }, { name: 'SI129', href: '#' }, { name: 'SI128', href: '#' },
                { name: 'SI127', href: '#' }, { name: 'SI126', href: '#' },
            ],
        },
        {
            title: 'SMSU (สพศ.)',
            icon: <Users size={24} />,
            links: [
                { name: 'Linktree SMSU', href: '#' }, { name: 'IG SMSU', href: '#' },
                { name: 'IG PD (Personal Development)', href: '#' }, { name: '101 Research Guidebook', href: '#' },
                { name: 'บริจาคงบทำเว็บ', href: '#' },
            ],
        },
    ];

    return (
        <div className="w-full bg-gray-50 py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold text-emerald-900">Material & Useful Links</h2>
                    <p className="mt-2 text-lg text-gray-600">A centralized hub for all your essential resources.</p>
                </div>

                {/* Grid layout for the resource cards */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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