import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import AuthLayout from "@/components/AuthLayout";
import { authAppearance } from "@/components/authAppearance";

export default function SignInPage() {
  return (
    <AuthLayout
      switcher={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-brand-600 hover:text-brand-700">
            Sign up
          </Link>
        </>
      }
    >
      <SignIn appearance={authAppearance} />
    </AuthLayout>
  );
}
