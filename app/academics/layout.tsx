import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust the import path if necessary
import LoginButton from "@/app/components/LoginButton"; // Adjust the import path if necessary

export default async function AcademicsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    // If the user is not logged in, show a login prompt.
    if (!session) {
        return (
            <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div
                    className="w-full max-w-md mx-auto 
          rounded-2xl border border-gray-200/80 dark:border-gray-700/80
          bg-white/50 dark:bg-gray-800/50
          shadow-lg backdrop-blur-lg 
          p-8 text-center 
          transition-all duration-300 ease-in-out"
                >
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Access Restricted
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Please sign in with your{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                            @student.mahidol.edu
                        </strong>{" "}
                        account to view academic resources.
                    </p>
                    <LoginButton />
                </div>
            </div>
        );
    }

    // If the user is logged in, render the page content.
    return <>{children}</>;
}