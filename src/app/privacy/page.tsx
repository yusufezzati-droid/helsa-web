import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" }, openGraph: { url: "/privacy" }, title: "حریم خصوصی", description: "سیاست حریم خصوصی هلسا مارکت؛ نحوه نگهداری و حفاظت از داده‌های شما." };
export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
