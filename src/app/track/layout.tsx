import type { Metadata } from "next";

/** عنوان یکتا (بریف 4.6) — پیش‌تر عنوان پیش‌فرض سایت تکرار می‌شد. */
export const metadata: Metadata = {
  title: "پیگیری سفارش",
  description: "وضعیت لحظه‌ای سفارش خود را با کد سفارش پیگیری کنید.",
};
export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
