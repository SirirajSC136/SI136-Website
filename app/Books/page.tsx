// app/book/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LoginButton from "@/app/components/LoginButton";
import { BookOpen } from "lucide-react";
import Image from "next/image";

const subjects = [
  {
    id: "immunology",
    title: "Immunology",
    description: "Defense mechanisms and immune system textbooks",
    image: "/subjects/immunology.jpg",
    link: "https://drive.google.com/drive/folders/1OJIOfJzYxw9hegBdCJxvPhnEklEjhoOc?usp=drive_link",
  },
  {
    id: "physiology",
    title: "Physiology",
    description: "Explore body functions and systems",
    image: "/subjects/physiology.jpg",
    link: "https://drive.google.com/drive/folders/1UtfB4MwtfwxEruwYQk0Y7ZLE9APe1kS9?usp=drive_link",
  },
  {
    id: "cell-biology",
    title: "Cell Biology",
    description: "Dive into cellular structure and processes",
    image: "/subjects/cell-biology.jpg",
    link: "https://drive.google.com/drive/folders/1IzCsFKO-HnrJ1Ma7CCt5ubcAuvHFhlLS?usp=drive_link",
  },
  {
    id: "anatomy",
    title: "Anatomy",
    description: "Atlases and anatomy references",
    image: "/subjects/anatomy.jpg",
    link: "https://drive.google.com/drive/folders/1MC5dFGWIiHt1X2R1zCnDuektKMlEZ8r9?usp=drive_link",
  },
  {
    id: "biochemistry",
    title: "Biochemistry",
    description: "Molecular foundations of life",
    image: "/subjects/biochemistry.jpg",
    link: "https://drive.google.com/drive/folders/1q-AUNwzl599MRH7cb41cu8vYaD9BwdBi?usp=drive_link",
  },
  {
    id: "histology",
    title: "Histology",
    description: "Microscopic anatomy and tissue structure",
    image: "/subjects/histology.jpg",
    link: "https://drive.google.com/drive/folders/1cVeCmhmiVi1FsSSQvQB2IKP2-igG8nfh?usp=drive_link",
  },
  {
    id: "embryology",
    title: "Embryology",
    description: "Developmental biology and growth",
    image: "/subjects/embryology.jpg",
    link: "https://drive.google.com/drive/folders/1_k8uoweICIsZg34FA35DoiV8gIsde3me?usp=drive_link",
  },
  {
    id: "usmle",
    title: "First Aid for USMLE",
    description: "First Aid for the USMLE Step 1 2024, 34th Edition",
    image: "/subjects/embryology.jpg",
    link: "https://drive.google.com/file/d/11S_jsUwoFASuetGCx30uLpw6S6hA6Vax/view?usp=drive_link",
  },
];

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    {icon}
    <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
  </div>
);

const SubjectCard = ({ subject }: { subject: typeof subjects[number] }) => (
  <a
    href={subject.link}
    target="_blank"
    rel="noopener noreferrer"
    className="group rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition"
  >
    <div className="relative h-40 w-full">
      <Image
        src={subject.image}
        alt={subject.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform"
      />
    </div>
    <div className="p-4 bg-white">
      <h3 className="font-bold text-lg text-slate-800">{subject.title}</h3>
      <p className="text-sm text-gray-600">{subject.description}</p>
    </div>
  </a>
);

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
      <div className="relative overflow-hidden bg-slate-900 py-24 text-center border-b border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <div
            className="absolute h-[500px] w-[500px] rounded-full bg-sky-500/30"
            style={{ animation: "move-light-1 8s ease-in-out infinite", filter: "blur(120px)" }}
          />
          <div
            className="absolute h-[400px] w-[400px] rounded-full bg-sky-400/20"
            style={{
              animation: "move-light-2 8s ease-in-out infinite alternate",
              filter: "blur(100px)",
              right: 0,
              bottom: 0,
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h1
            className="text-5xl font-extrabold text-white tracking-tight sm:text-6xl"
            style={{ textShadow: "0 3px 15px rgba(0, 0, 0, 1)" }}
          >
            {title}
          </h1>
          <p
            className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto"
            style={{ textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </>
  );
};

export default async function BookPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <PageHero title="Book Library" subtitle="Access subject folders and textbooks" />

      <section className="container mx-auto px-4 py-16">
        {session ? (
          <>
            <SectionTitle icon={<BookOpen className="text-emerald-500" />} title="Subjects" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Please log in to access the book library</h2>
            <LoginButton />
          </div>
        )}
      </section>
    </main>
  );
}
