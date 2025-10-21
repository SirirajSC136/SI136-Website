// /app/UsefulInfo/absent.tsx

import Image from 'next/image';
import Link from 'next/link';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
        {children}
    </h2>
);

const absentPage = () => {
    return(
        <div className="container mx-auto my-12 px-4">
            <div className="relative w-full h-auto rounded-lg overflow-hidden shadow-lg">
                <Image
                    src="/images/UsefulInfo/siriraj_absent.jpg" 
                    alt="absent"
                    width={1920}
                    height={1920}
                    layout="responsive"
                    objectFit="contain"
                />
            </div>
        </div>
    );
};

export default absentPage;