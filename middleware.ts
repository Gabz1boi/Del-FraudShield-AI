import { withAuth } from "next-auth/middleware";

const LOCAL_DEV_AUTH_SECRET =
  "del-fraudshield-ai-local-development-secret-please-change-in-production";

const resolvedSecret =
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "production" ? undefined : LOCAL_DEV_AUTH_SECRET);

export default withAuth({
  pages: {
    signIn: "/login"
  },
  secret: resolvedSecret,
  callbacks: {
    authorized({ token, req }) {
      if (!token) return false;
      const pathname = req.nextUrl.pathname;
      if (pathname.startsWith("/admin") || pathname.startsWith("/trends")) {
        return token.role === "admin";
      }
      return true;
    }
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checker/:path*",
    "/analyzer/:path*",
    "/chatbot/:path*",
    "/admin/:path*",
    "/report/:path*",
    "/trends/:path*"
  ]
};
