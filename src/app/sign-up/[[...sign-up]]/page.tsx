import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import AuthLayout from "@/components/AuthLayout";
import { authAppearance } from "@/components/authAppearance";

export default function SignUpPage() {
  return (
    <AuthLayout
      switcher={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <SignUp appearance={authAppearance} />
    </AuthLayout>
  );
}
