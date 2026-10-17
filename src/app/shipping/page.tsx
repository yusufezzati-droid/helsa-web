import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/shipping" }, openGraph: { url: "/shipping" }, title: "شرایط ارسال", description: "روش‌ها، هزینه و زمان‌بندی ارسال سفارش‌های هلسا مارکت." };
export default function ShippingPage() {
  return <LegalPage slug="shipping" />;
}
