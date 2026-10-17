import type { Metadata } from "next";
import { getProducts } from "@/services/catalog";
import { WishlistClient } from "@/components/account/WishlistClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/wishlist" }, title: "علاقه‌مندی‌ها", description: "لیست محصولات مورد علاقه شما در هلسا مارکت." };

export default async function WishlistPage() {
  const products = await getProducts();
  return <WishlistClient products={products} />;
}
