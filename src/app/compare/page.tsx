import type { Metadata } from "next";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "مقایسه محصولات هلسا | وزن، قیمت و امتیاز کنار هم",
  description: "محصولات انتخابی هلسا را کنار هم مقایسه کنید: وزن، قیمت، تخفیف، دسته و امتیاز واقعی مشتریان.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "مقایسه محصولات هلسا | وزن، قیمت و امتیاز کنار هم",
    description: "محصولات انتخابی هلسا را کنار هم مقایسه کنید: وزن، قیمت، تخفیف، دسته و امتیاز واقعی مشتریان.",
    url: "/compare",
    type: "website",
  },
};

export default function Page() {
  return <CompareClient />;
}
