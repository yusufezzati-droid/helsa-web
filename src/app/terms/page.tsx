import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" }, openGraph: { url: "/terms" }, title: "قوانین و مقررات", description: "قوانین و مقررات استفاده از فروشگاه هلسا مارکت." };
export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
