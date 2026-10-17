import type { Metadata } from "next";
import FaqClient from "./FaqClient";

export const metadata: Metadata = {
  title: "سوالات متداول هلسا | پاسخ به پرسش‌های خرید، ارسال و مرجوعی",
  description: "پاسخ رسمی هلسا به پرسش‌های پرتکرار دربارهٔ سفارش، پرداخت امن، ارسال، مرجوعی و حساب کاربری — قبل از خرید بخوانید.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "سوالات متداول هلسا | پاسخ به پرسش‌های خرید، ارسال و مرجوعی",
    description: "پاسخ رسمی هلسا به پرسش‌های پرتکرار دربارهٔ سفارش، پرداخت امن، ارسال، مرجوعی و حساب کاربری — قبل از خرید بخوانید.",
    url: "/faq",
    type: "website",
  },
};

export default function Page() {
  return <FaqClient />;
}
