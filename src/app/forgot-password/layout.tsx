import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بازیابی رمز عبور | هلسا",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
