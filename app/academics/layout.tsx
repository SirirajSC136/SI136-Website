// app/academics/layout.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LoginButton from "@/app/components/LoginButton";
import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export default async function AcademicsLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await getServerSession(authOptions);

    // Check if the user is logged in
    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-secondary-background">
                <div className="text-center p-8 bg-background rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-primary mb-4">
                        Please log in to continue
                    </h2>
                    <p className="text-secondary mb-6">
                        You need to be logged in to access this section.
                    </p>
                    <LoginButton />
                </div>
            </div>
        );
    }

    // Check if the user's email is a valid Mahidol student email
    const userEmail = session.user?.email;
    const isMahidolStudent =
        userEmail &&
        (userEmail.endsWith("@student.mahidol.ac.th") ||
            userEmail.endsWith("@student.mahidol.edu"));

    if (!isMahidolStudent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-slate-800">
                        Access Denied
                    </h2>
                    <p className="mt-2 text-slate-600">
                        This section is restricted to Mahidol University students only. Please
                        log in with a valid student account (`@student.mahidol.ac.th` or `@student.mahidol.edu`).
                    </p>
                </div>
            </div>
        );
    }

    // If the user is a logged-in Mahidol student, render the page content
    return <>{children}</>;
}