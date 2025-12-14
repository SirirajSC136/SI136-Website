import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            authorization: {
                params: {  prompt: "select_account", hd: "student.mahidol.edu" },
            },
        }),
    ],

  session: {
    strategy: "jwt",
    maxAge: 604800, 
  },

  callbacks: {
    async signIn({ user }) {
      const email = user.email || "";
      if (
        email.endsWith("@student.mahidol.edu") ||
        email.endsWith("@student.mahidol.ac.th")
      ) {
        return true;
      }
      return false;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
