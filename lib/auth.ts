import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
// import { compare } from "bcrypt"
import { User } from "@/lib/db/schema"
import connectDB from "@/lib/db/connect"

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error('Please provide ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
    error: "/login", // Redirect back to login page instead of error page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email and password");
        }

        // Check against environment variables
        const isValidEmail = credentials.email === process.env.ADMIN_EMAIL;
        const isValidPassword = credentials.password === process.env.ADMIN_PASSWORD;

        if (isValidEmail && isValidPassword) {
          return {
            id: "1",
            email: credentials.email,
            name: "Admin",
            role: "ADMIN",
            image: null,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
}