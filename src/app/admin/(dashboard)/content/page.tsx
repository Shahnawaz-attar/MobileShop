import { listAnnouncements, listTestimonials } from "@/server/modules/content";
import { listBrands } from "@/server/modules/catalog";
import { ContentManager } from "@/components/admin/ContentManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Content | Admin" };

export default async function ContentPage() {
  const [announcements, testimonials, brands] = await Promise.all([
    listAnnouncements(),
    listTestimonials(),
    listBrands(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="typography-h2">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage announcements and customer testimonials.
        </p>
      </div>

      <ContentManager
        announcements={JSON.parse(JSON.stringify(announcements))}
        testimonials={JSON.parse(JSON.stringify(testimonials))}
        brands={brands}
      />
    </div>
  );
}
