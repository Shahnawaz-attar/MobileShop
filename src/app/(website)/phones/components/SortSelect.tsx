"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/shared/CustomSelect";

export function SortSelect({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(pathname + "?" + params.toString());
  };

  const sortOptions = [
    { label: "Newest Arrivals", value: "NEWEST" },
    { label: "Price: Low to High", value: "PRICE_ASC" },
    { label: "Price: High to Low", value: "PRICE_DESC" },
  ];

  return (
    <CustomSelect
      options={sortOptions}
      value={defaultValue || "NEWEST"}
      onChange={handleSortChange}
    />
  );
}
