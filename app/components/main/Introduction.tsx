// app/_components/main/Introduction.tsx

import Image from 'next/image';
import { GraduationCap, BookOpen, Info, MessageSquare } from 'lucide-react';
import heroBackground from '@/app/assets/images/hero-background.jpg';

// Import the CSS module
import styles from './main.module.css';

const Introduction = () => {
    return (
        <div className="relative h-[70vh] w-full overflow-hidden bg-gray-900">
            <Image
                src={heroBackground}
                alt="Cityscape background"
                layout="fill"
                objectFit="cover"
                quality={100}
                priority
                placeholder="blur"
                // Use the imported style class
                className={styles.animateSlowZoom}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
                <h1
                    // Combine Tailwind classes with the module class
                    className={`text-6xl md:text-8xl font-extrabold tracking-wider bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent ${styles.animateFadeInUp}`}
                    style={{ animationDelay: '0.3s' }}
                >
                    SIRIRAJ 136
                </h1>
                <p
                    className={`mt-2 text-xl md:text-2xl font-light text-gray-200 ${styles.animateFadeInUp}`}
                    style={{ animationDelay: '0.5s' }}
                >
                    SI136 Website
                </p>
            </div>

            <div
                className={`absolute bottom-0 left-0 right-0 z-10 ${styles.animateFadeInUp}`}
                style={{ animationDelay: '0.7s' }}
            >
                {/* ... rest of the icon section remains the same ... */}
                <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-6 text-center">
                    {/* Icon with glow, lift, and gradient effects */}
                    <div className="group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-2">
                        <div className="relative rounded-full p-4 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-violet-500/30 group-hover:shadow-lg group-hover:shadow-violet-500/50">
                            <GraduationCap size={40} className="text-emerald-300 transition-colors duration-300 group-hover:text-white" />
                        </div>
                        <span className="mt-3 font-semibold text-gray-200 transition-colors duration-300 group-hover:text-emerald-300">Academic</span>
                    </div>
                    <div className="group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-2">
                        <div className="relative rounded-full p-4 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-amber-500/30 group-hover:shadow-lg group-hover:shadow-amber-500/50">
                            <BookOpen size={40} className="text-emerald-300 transition-colors duration-300 group-hover:text-white" />
                        </div>
                        <span className="mt-3 font-semibold text-gray-200 transition-colors duration-300 group-hover:text-emerald-300">Books</span>
                    </div>
                    <div className="group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-2">
                        <div className="relative rounded-full p-4 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-violet-500/30 group-hover:shadow-lg group-hover:shadow-violet-500/50">
                            <Info size={40} className="text-emerald-300 transition-colors duration-300 group-hover:text-white" />
                        </div>
                        <span className="mt-3 font-semibold text-gray-200 transition-colors duration-300 group-hover:text-emerald-300">Useful Info</span>
                    </div>
                    <div className="group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-2">
                        <div className="relative rounded-full p-4 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-amber-500/30 group-hover:shadow-lg group-hover:shadow-amber-500/50">
                            <MessageSquare size={40} className="text-emerald-300 transition-colors duration-300 group-hover:text-white" />
                        </div>
                        <span className="mt-3 font-semibold text-gray-200 transition-colors duration-300 group-hover:text-emerald-300">Feedback</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Introduction;