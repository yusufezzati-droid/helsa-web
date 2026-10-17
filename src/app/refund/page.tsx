import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/refund" }, openGraph: { url: "/refund" }, title: "مرجوعی کالا", description: "شرایط و روند مرجوعی کالا در هلسا مارکت." };
export default function RefundPage() {
  return <LegalPage slug="refund" />;
}
