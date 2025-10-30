// app/book/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LoginButton from "@/app/components/LoginButton";
import Image from "next/image";

const subjects = [
  {
    id: "immunology",
    title: "Immunology",
    description: "Defense mechanisms and immune system textbooks",
    image: "/images/subjects/immunology.png",
    link: "https://drive.google.com/drive/folders/1OJIOfJzYxw9hegBdCJxvPhnEklEjhoOc?usp=drive_link",
  },
  {
    id: "physiology",
    title: "Physiology",
    description: "Explore body functions and systems",
    image: "/images/subjects/physiology.png",
    link: "https://drive.google.com/drive/folders/1UtfB4MwtfwxEruwYQk0Y7ZLE9APe1kS9?usp=drive_link",
  },
  {
    id: "cell-biology",
    title: "Cell Biology",
    description: "Dive into cellular structure and processes",
    image: "/images/subjects/cell-biology.png",
    link: "https://drive.google.com/drive/folders/1IzCsFKO-HnrJ1Ma7CCt5ubcAuvHFhlLS?usp=drive_link",
  },
  {
    id: "anatomy",
    title: "Anatomy",
    description: "Atlases and anatomy references",
    image: "/images/subjects/anatomy.png",
    link: "https://drive.google.com/drive/folders/1MC5dFGWIiHt1X2R1zCnDuektKMlEZ8r9?usp=drive_link",
  },
  {
    id: "biochemistry",
    title: "Biochemistry",
    description: "Molecular foundations of life",
    image: "/images/subjects/biochemistry.png",
    link: "https://drive.google.com/drive/folders/1q-AUNwzl599MRH7cb41cu8vYaD9BwdBi?usp=drive_link",
  },
  {
    id: "histology",
    title: "Histology",
    description: "Microscopic anatomy and tissue structure",
    image: "/images/subjects/histology.png",
    link: "https://drive.google.com/drive/folders/1cVeCmhmiVi1FsSSQvQB2IKP2-igG8nfh?usp=drive_link",
  },
  {
    id: "embryology",
    title: "Embryology",
    description: "Developmental biology and growth",
    image: "/images/subjects/embryology.png",
    link: "https://drive.google.com/drive/folders/1_k8uoweICIsZg34FA35DoiV8gIsde3me?usp=drive_link",
  },
  {
    id: "usmle",
    title: "First Aid for USMLE",
    description: "First Aid for the USMLE Step 1 2024, 34th Edition",
    image: "/images/subjects/first-aid-for-usmle.png",
    link: "https://drive.google.com/file/d/11S_jsUwoFASuetGCx30uLpw6S6hA6Vax/view?usp=drive_link",
  },
];

const SubjectCard = ({ subject }: { subject: typeof subjects[number] }) => (
  <a
    href={subject.link}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex flex-col rounded-xl overflow-hidden 
               bg-white border border-gray-200 shadow-sm 
               hover:shadow-md hover:border-emerald-400 
               transition-all duration-300"
  >
    <div className="relative aspect-[16/9] w-full overflow-hidden">
      <Image
        src={subject.image}
        alt={subject.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="p-6 flex flex-col flex-grow">
      <h3 className="font-bold text-xl text-slate-900 group-hover:text-emerald-600 transition-colors">
        {subject.title}
      </h3>
      <p className="text-sm text-slate-600 mt-2 flex-grow">{subject.description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-emerald-600 group-hover:underline">
        Open Folder →
      </span>
    </div>
  </a>
);

const PageHero = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-500 py-24 text-center text-white">
    <div className="container mx-auto px-4 relative z-10">
      <h1 className="text-5xl font-extrabold tracking-tight drop-shadow">
        {title}
      </h1>
      <p className="mt-4 text-lg text-emerald-50 max-w-2xl mx-auto">
        {subtitle}
      </p>
    </div>
  </div>
);

export default async function BookPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-background text-primary">
      {/* Dark banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-black py-28 text-center">
        <div className="absolute inset-0">
          <div className="absolute h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse -top-40 -left-40" />
          <div className="absolute h-[400px] w-[400px] rounded-full bg-cyan-400/20 blur-[100px] animate-pulse delay-1000 bottom-0 right-0" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Book Library
          </h1>
          <p className="mt-6 text-lg text-emerald-100 max-w-2xl mx-auto">
            Access curated subject folders and textbooks
          </p>
        </div>
      </div>

      {/* White content area */}
      <section className="container mx-auto px-4 py-16">
        {session ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => (
              <a
                key={subject.id}
                href={subject.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl overflow-hidden 
                           bg-white border border-gray-200 shadow-sm 
                           hover:shadow-md hover:border-emerald-400 
                           transition-all duration-300"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <Image
                    src={subject.image}
                    alt={subject.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-xl text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {subject.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 flex-grow">
                    {subject.description}
                  </p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-emerald-600 group-hover:underline">
                    Open Folder →
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Please log in to access the book library
            </h2>
            <p className="text-slate-600 mb-6">
              Sign in with your account to unlock subject folders and resources.
            </p>
            <LoginButton />
          </div>
        )}
      </section>
    </main>
  );
}