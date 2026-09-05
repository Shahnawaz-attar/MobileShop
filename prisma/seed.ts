import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load env for seed script (Next.js doesn't load .env.local for scripts)
config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (process.env.ALLOW_SEED !== "true") {
    throw new Error("Seed refused: set ALLOW_SEED=true in environment.");
  }

  console.log("🌱 Seeding MobileShop database...\n");

  // --- Shop ---
  const shop = await prisma.shop.upsert({
    where: { slug: "shree-mobiles" },
    update: {},
    create: {
      slug: "shree-mobiles",
      name: "Shree Mobiles",
      tagline: "Trusted Pre-Owned Phones Since 2018",
      about: "Shree Mobiles has been serving Ranibennur with quality pre-owned smartphones for over 6 years. Every phone is personally inspected and comes with our honest condition guarantee.",
      phone: "+919876543210",
      whatsapp: "+919876543210",
      email: "shreemobiles@example.com",
      addressLine1: "Shop No. 12, Main Road",
      addressLine2: "Near Bus Stand",
      city: "Ranibennur",
      state: "Karnataka",
      pincode: "581115",
      lat: 14.6234,
      lng: 75.6345,
      mapsUrl: "https://maps.google.com/?q=14.6234,75.6345",
      instagram: "shreemobiles",
      hours: {
        monday: "10:00 AM - 8:00 PM",
        tuesday: "10:00 AM - 8:00 PM",
        wednesday: "10:00 AM - 8:00 PM",
        thursday: "10:00 AM - 8:00 PM",
        friday: "10:00 AM - 8:00 PM",
        saturday: "10:00 AM - 9:00 PM",
        sunday: "11:00 AM - 6:00 PM",
      },
      yearsInBiz: 6,
      trustBadges: ["Personally Inspected", "Honest Condition", "Warranty Available"],
      policies: {
        warranty: "7-day replacement warranty on all phones",
        exchange: "Exchange available on select models",
        return: "No returns after 7 days",
      },
    },
  });
  console.log(`✅ Shop: ${shop.name}`);

  // --- Owner (demo: owner@shreemobiles.com / Admin@123456) ---
  const hashedPassword = await bcrypt.hash("Admin@123456", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@shreemobiles.com" },
    update: {},
    create: {
      email: "owner@shreemobiles.com",
      passwordHash: hashedPassword,
      name: "Demo Owner",
      role: "OWNER",
    },
  });
  console.log(`✅ Owner: ${owner.email} (password: Admin@123456)`);

  // --- Brands ---
  const brandsData = [
    { name: "Apple", slug: "apple", sortOrder: 1 },
    { name: "Samsung", slug: "samsung", sortOrder: 2 },
    { name: "OnePlus", slug: "oneplus", sortOrder: 3 },
    { name: "Xiaomi", slug: "xiaomi", sortOrder: 4 },
    { name: "Vivo", slug: "vivo", sortOrder: 5 },
    { name: "Oppo", slug: "oppo", sortOrder: 6 },
    { name: "Realme", slug: "realme", sortOrder: 7 },
    { name: "Motorola", slug: "motorola", sortOrder: 8 },
    { name: "Google", slug: "google", sortOrder: 9 },
  ];

  const brands: Record<string, string> = {};
  for (const b of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
    brands[b.slug] = brand.id;
  }
  console.log(`✅ Brands: ${brandsData.length}`);

  // --- Phone Models ---
  const modelsData = [
    { brandSlug: "apple", name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", releaseYear: 2024 },
    { brandSlug: "apple", name: "iPhone 16 Pro", slug: "iphone-16-pro", releaseYear: 2024 },
    { brandSlug: "apple", name: "iPhone 15", slug: "iphone-15", releaseYear: 2023 },
    { brandSlug: "apple", name: "iPhone 14", slug: "iphone-14", releaseYear: 2022 },
    { brandSlug: "apple", name: "iPhone 13", slug: "iphone-13", releaseYear: 2021 },
    { brandSlug: "apple", name: "iPhone 12", slug: "iphone-12", releaseYear: 2020 },
    { brandSlug: "samsung", name: "Galaxy S24 Ultra", slug: "galaxy-s24-ultra", releaseYear: 2024 },
    { brandSlug: "samsung", name: "Galaxy S24", slug: "galaxy-s24", releaseYear: 2024 },
    { brandSlug: "samsung", name: "Galaxy S23", slug: "galaxy-s23", releaseYear: 2023 },
    { brandSlug: "samsung", name: "Galaxy A55", slug: "galaxy-a55", releaseYear: 2024 },
    { brandSlug: "samsung", name: "Galaxy A34", slug: "galaxy-a34", releaseYear: 2023 },
    { brandSlug: "samsung", name: "Galaxy M34", slug: "galaxy-m34", releaseYear: 2023 },
    { brandSlug: "oneplus", name: "OnePlus 12", slug: "oneplus-12", releaseYear: 2024 },
    { brandSlug: "oneplus", name: "OnePlus 12R", slug: "oneplus-12r", releaseYear: 2024 },
    { brandSlug: "oneplus", name: "OnePlus Nord 4", slug: "oneplus-nord-4", releaseYear: 2024 },
    { brandSlug: "oneplus", name: "OnePlus Nord CE 4", slug: "oneplus-nord-ce-4", releaseYear: 2024 },
    { brandSlug: "xiaomi", name: "Xiaomi 14", slug: "xiaomi-14", releaseYear: 2024 },
    { brandSlug: "xiaomi", name: "Redmi Note 13 Pro+", slug: "redmi-note-13-pro-plus", releaseYear: 2024 },
    { brandSlug: "xiaomi", name: "Redmi Note 13", slug: "redmi-note-13", releaseYear: 2024 },
    { brandSlug: "xiaomi", name: "POCO F6", slug: "poco-f6", releaseYear: 2024 },
    { brandSlug: "vivo", name: "Vivo V30 Pro", slug: "vivo-v30-pro", releaseYear: 2024 },
    { brandSlug: "vivo", name: "Vivo T3", slug: "vivo-t3", releaseYear: 2024 },
    { brandSlug: "oppo", name: "OPPO Reno 11", slug: "oppo-reno-11", releaseYear: 2024 },
    { brandSlug: "oppo", name: "OPPO A79", slug: "oppo-a79", releaseYear: 2023 },
    { brandSlug: "realme", name: "Realme GT 6T", slug: "realme-gt-6t", releaseYear: 2024 },
    { brandSlug: "realme", name: "Realme Narzo 70 Pro", slug: "realme-narzo-70-pro", releaseYear: 2024 },
    { brandSlug: "motorola", name: "Motorola Edge 50 Pro", slug: "motorola-edge-50-pro", releaseYear: 2024 },
    { brandSlug: "motorola", name: "Moto G84", slug: "moto-g84", releaseYear: 2023 },
    { brandSlug: "google", name: "Pixel 8 Pro", slug: "pixel-8-pro", releaseYear: 2023 },
    { brandSlug: "google", name: "Pixel 8a", slug: "pixel-8a", releaseYear: 2024 },
    { brandSlug: "apple", name: "iPad 10th Gen", slug: "ipad-10th-gen", releaseYear: 2022, deviceType: "TABLET" as const },
    { brandSlug: "apple", name: "iPad Air 5", slug: "ipad-air-5", releaseYear: 2022, deviceType: "TABLET" as const },
    { brandSlug: "samsung", name: "Galaxy Tab S9", slug: "galaxy-tab-s9", releaseYear: 2023, deviceType: "TABLET" as const },
    { brandSlug: "samsung", name: "Galaxy Tab A9+", slug: "galaxy-tab-a9-plus", releaseYear: 2023, deviceType: "TABLET" as const },
  ];

  const models: Record<string, string> = {};
  for (const m of modelsData) {
    const brandId = brands[m.brandSlug];
    if (!brandId) continue;
    const deviceType = "deviceType" in m ? m.deviceType : "PHONE";
    const model = await prisma.phoneModel.upsert({
      where: { brandId_slug: { brandId, slug: m.slug } },
      update: { deviceType },
      create: { brandId, name: m.name, slug: m.slug, releaseYear: m.releaseYear, deviceType },
    });
    models[m.slug] = model.id;
  }
  console.log(`✅ Phone Models: ${modelsData.length}`);

  // --- Products (20 demo listings) ---
  const productsData = [
    { slug: "iphone-15-128gb-blue-a1b2", brandSlug: "apple", modelSlug: "iphone-15", title: "iPhone 15", storageGb: 128, ramGb: 6, colour: "Blue", pricePaise: 5499900, mrpPaise: 7999900, condition: "EXCELLENT" as const, batteryType: "PERCENTAGE" as const, batteryPct: 94, availability: "AVAILABLE" as const, isFeatured: true, hasBox: true, hasCharger: true, hasCable: true, warrantyMonths: 3, description: "Well maintained iPhone 15 in Blue. Battery health 94%." },
    { slug: "iphone-13-128gb-midnight-c3d4", brandSlug: "apple", modelSlug: "iphone-13", title: "iPhone 13", storageGb: 128, ramGb: 4, colour: "Midnight", pricePaise: 3299900, mrpPaise: 5999900, condition: "GOOD" as const, batteryType: "PERCENTAGE" as const, batteryPct: 86, availability: "AVAILABLE" as const, isFeatured: true, hasBox: false, hasCharger: true, hasCable: true, warrantyMonths: 1, description: "iPhone 13 in good condition." },
    { slug: "galaxy-s24-ultra-256gb-titanium-e5f6", brandSlug: "samsung", modelSlug: "galaxy-s24-ultra", title: "Galaxy S24 Ultra", storageGb: 256, ramGb: 12, colour: "Titanium Gray", pricePaise: 8999900, mrpPaise: 13499900, condition: "LIKE_NEW" as const, batteryType: "RATED" as const, batteryRating: "GOOD" as const, availability: "AVAILABLE" as const, isFeatured: true, hasBox: true, hasCharger: true, hasCable: true, warrantyMonths: 6, description: "Almost new Galaxy S24 Ultra with S Pen." },
    { slug: "galaxy-a55-128gb-navy-g7h8", brandSlug: "samsung", modelSlug: "galaxy-a55", title: "Galaxy A55", storageGb: 128, ramGb: 8, colour: "Awesome Navy", pricePaise: 2199900, mrpPaise: 3999900, condition: "GOOD" as const, batteryType: "RATED" as const, batteryRating: "GOOD" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: false, description: "Reliable Galaxy A55." },
    { slug: "oneplus-12-256gb-green-i9j0", brandSlug: "oneplus", modelSlug: "oneplus-12", title: "OnePlus 12", storageGb: 256, ramGb: 12, colour: "Flowy Emerald", pricePaise: 4499900, mrpPaise: 6999900, condition: "EXCELLENT" as const, batteryType: "PERCENTAGE" as const, batteryPct: 97, availability: "AVAILABLE" as const, isFeatured: true, hasBox: true, hasCharger: true, hasCable: true, warrantyMonths: 4, description: "OnePlus 12 with 100W charging." },
    { slug: "oneplus-nord-4-128gb-silver-k1l2", brandSlug: "oneplus", modelSlug: "oneplus-nord-4", title: "OnePlus Nord 4", storageGb: 128, ramGb: 8, colour: "Mercurial Silver", pricePaise: 1999900, mrpPaise: 2999900, condition: "GOOD" as const, batteryType: "UNKNOWN" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: false, hasCharger: true, hasCable: true, description: "Metal unibody design." },
    { slug: "redmi-note-13-pro-plus-256gb-purple-m3n4", brandSlug: "xiaomi", modelSlug: "redmi-note-13-pro-plus", title: "Redmi Note 13 Pro+", storageGb: 256, ramGb: 8, colour: "Fusion Purple", pricePaise: 1899900, mrpPaise: 3299900, condition: "EXCELLENT" as const, batteryType: "RATED" as const, batteryRating: "GOOD" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true, warrantyMonths: 2, description: "200MP camera phone." },
    { slug: "poco-f6-256gb-black-o5p6", brandSlug: "xiaomi", modelSlug: "poco-f6", title: "POCO F6", storageGb: 256, ramGb: 8, colour: "Black", pricePaise: 1799900, mrpPaise: 2999900, condition: "LIKE_NEW" as const, batteryType: "RATED" as const, batteryRating: "GOOD" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true, warrantyMonths: 5, description: "Snapdragon 8s Gen 3 powerhouse." },
    { slug: "vivo-v30-pro-256gb-brown-q7r8", brandSlug: "vivo", modelSlug: "vivo-v30-pro", title: "Vivo V30 Pro", storageGb: 256, ramGb: 12, colour: "Classic Brown", pricePaise: 2999900, mrpPaise: 4699900, condition: "GOOD" as const, batteryType: "UNKNOWN" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: false, hasCharger: true, hasCable: false, description: "Zeiss camera with excellent portrait mode." },
    { slug: "oppo-reno-11-256gb-green-s9t0", brandSlug: "oppo", modelSlug: "oppo-reno-11", title: "OPPO Reno 11", storageGb: 256, ramGb: 8, colour: "Rock Grey", pricePaise: 2099900, mrpPaise: 3499900, condition: "EXCELLENT" as const, batteryType: "RATED" as const, batteryRating: "GOOD" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true, description: "Sleek design with Dimensity 7050." },
    { slug: "realme-gt-6t-128gb-green-u1v2", brandSlug: "realme", modelSlug: "realme-gt-6t", title: "Realme GT 6T", storageGb: 128, ramGb: 8, colour: "Razor Green", pricePaise: 1599900, mrpPaise: 2199900, condition: "GOOD" as const, batteryType: "UNKNOWN" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true, description: "Great value flagship-killer." },
    { slug: "pixel-8-pro-128gb-bay-w3x4", brandSlug: "google", modelSlug: "pixel-8-pro", title: "Pixel 8 Pro", storageGb: 128, ramGb: 12, colour: "Bay", pricePaise: 4999900, mrpPaise: 8999900, condition: "EXCELLENT" as const, batteryType: "PERCENTAGE" as const, batteryPct: 91, availability: "AVAILABLE" as const, isFeatured: true, hasBox: true, hasCharger: false, hasCable: true, warrantyMonths: 3, description: "Best camera phone with Tensor G3." },
    { slug: "iphone-14-128gb-purple-y5z6", brandSlug: "apple", modelSlug: "iphone-14", title: "iPhone 14", storageGb: 128, ramGb: 6, colour: "Purple", pricePaise: 4299900, mrpPaise: 6999900, condition: "GOOD" as const, batteryType: "PERCENTAGE" as const, batteryPct: 89, availability: "SOLD" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true },
    { slug: "galaxy-s23-256gb-green-a7b8", brandSlug: "samsung", modelSlug: "galaxy-s23", title: "Galaxy S23", storageGb: 256, ramGb: 8, colour: "Green", pricePaise: 3999900, mrpPaise: 7999900, condition: "EXCELLENT" as const, batteryType: "RATED" as const, batteryRating: "GOOD" as const, availability: "SOLD" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true },
    { slug: "iphone-12-64gb-black-c9d0", brandSlug: "apple", modelSlug: "iphone-12", title: "iPhone 12", storageGb: 64, ramGb: 4, colour: "Black", pricePaise: 2199900, mrpPaise: 4999900, condition: "FAIR" as const, batteryType: "PERCENTAGE" as const, batteryPct: 79, availability: "SOLD" as const, isFeatured: false, hasBox: false, hasCharger: false, hasCable: true, conditionNotes: "Screen has minor scratches." },
    { slug: "motorola-edge-50-pro-256gb-black-e1f2", brandSlug: "motorola", modelSlug: "motorola-edge-50-pro", title: "Motorola Edge 50 Pro", storageGb: 256, ramGb: 12, colour: "Black Beauty", pricePaise: 2499900, mrpPaise: 3499900, condition: "LIKE_NEW" as const, batteryType: "RATED" as const, batteryRating: "GOOD" as const, availability: "RESERVED" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true, warrantyMonths: 8 },
    { slug: "galaxy-m34-128gb-blue-g3h4", brandSlug: "samsung", modelSlug: "galaxy-m34", title: "Galaxy M34", storageGb: 128, ramGb: 6, colour: "Waterfall Blue", pricePaise: 1099900, mrpPaise: 1899900, condition: "GOOD" as const, batteryType: "UNKNOWN" as const, availability: "DRAFT" as const, isFeatured: false, hasBox: false, hasCharger: true, hasCable: false },
    { slug: "vivo-t3-128gb-green-i5j6", brandSlug: "vivo", modelSlug: "vivo-t3", title: "Vivo T3", storageGb: 128, ramGb: 8, colour: "Crystal Flake", pricePaise: 1299900, mrpPaise: 1999900, condition: "GOOD" as const, batteryType: "UNKNOWN" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true, description: "Great mid-range with Dimensity 7200." },
    { slug: "pixel-8a-128gb-aloe-k7l8", brandSlug: "google", modelSlug: "pixel-8a", title: "Pixel 8a", storageGb: 128, ramGb: 8, colour: "Aloe", pricePaise: 2999900, mrpPaise: 5299900, condition: "EXCELLENT" as const, batteryType: "PERCENTAGE" as const, batteryPct: 96, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: false, hasCable: true, warrantyMonths: 2, description: "Compact Pixel with Tensor G3." },
    { slug: "moto-g84-256gb-green-m9n0", brandSlug: "motorola", modelSlug: "moto-g84", title: "Moto G84", storageGb: 256, ramGb: 8, colour: "Viva Magenta", pricePaise: 1099900, mrpPaise: 1999900, condition: "FAIR" as const, batteryType: "RATED" as const, batteryRating: "AVERAGE" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: false, hasCharger: true, hasCable: false, conditionNotes: "Minor dent on the side frame.", description: "Clean Android experience." },
    // --- Tablets ---
    { slug: "ipad-10th-gen-64gb-silver-t1u2", brandSlug: "apple", modelSlug: "ipad-10th-gen", title: "iPad 10th Gen", deviceType: "TABLET" as const, storageGb: 64, ramGb: 4, colour: "Silver", pricePaise: 2499900, mrpPaise: 3999900, condition: "EXCELLENT" as const, batteryType: "PERCENTAGE" as const, batteryPct: 95, availability: "AVAILABLE" as const, isFeatured: true, hasBox: true, hasCharger: true, hasCable: true, warrantyMonths: 3, description: "iPad 10th Gen in Silver. Great for study and media." },
    { slug: "galaxy-tab-s9-128gb-graphite-v3w4", brandSlug: "samsung", modelSlug: "galaxy-tab-s9", title: "Galaxy Tab S9", deviceType: "TABLET" as const, storageGb: 128, ramGb: 8, colour: "Graphite", pricePaise: 4499900, mrpPaise: 7299900, condition: "GOOD" as const, batteryType: "RATED" as const, batteryRating: "GOOD" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true, warrantyMonths: 4, description: "Galaxy Tab S9 with S Pen support." },
    { slug: "ipad-air-5-64gb-blue-x5y6", brandSlug: "apple", modelSlug: "ipad-air-5", title: "iPad Air 5", deviceType: "TABLET" as const, storageGb: 64, ramGb: 8, colour: "Blue", pricePaise: 3299900, mrpPaise: 5999900, condition: "EXCELLENT" as const, batteryType: "PERCENTAGE" as const, batteryPct: 92, availability: "SOLD" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: true },
    // --- Other devices ---
    { slug: "apple-watch-se-40mm-midnight-z7a8", brandSlug: "apple", modelSlug: undefined, title: "Apple Watch SE", deviceType: "OTHER" as const, colour: "Midnight", pricePaise: 1499900, mrpPaise: 2999900, condition: "GOOD" as const, batteryType: "UNKNOWN" as const, availability: "AVAILABLE" as const, isFeatured: false, hasBox: true, hasCharger: true, hasCable: false, description: "Apple Watch SE 40mm, Midnight. Fully working." },
  ];

  let productCount = 0;
  const now = new Date();
  for (let i = 0; i < productsData.length; i++) {
    const p = productsData[i];
    if (!p) continue;
    const brandId = brands[p.brandSlug];
    const modelId = p.modelSlug ? models[p.modelSlug] : undefined;
    if (!brandId) continue;

    const daysAgo = productsData.length - i;
    const publishedAt = p.availability !== "DRAFT" ? new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000) : null;
    const soldAt = p.availability === "SOLD" ? new Date(now.getTime() - (daysAgo - 2) * 24 * 60 * 60 * 1000) : null;
    const deviceType = p.deviceType ?? "PHONE";
    const searchText = [p.title, deviceType.toLowerCase(), p.storageGb ? `${p.storageGb}GB` : "", p.colour, p.condition].filter(Boolean).join(" ");

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        brandId,
        modelId,
        title: p.title,
        deviceType,
        storageGb: p.storageGb,
        ramGb: p.ramGb,
        colour: p.colour,
        pricePaise: p.pricePaise,
        mrpPaise: p.mrpPaise,
        condition: p.condition,
        conditionNotes: p.conditionNotes ?? null,
        batteryType: p.batteryType,
        batteryPct: p.batteryPct ?? null,
        batteryRating: p.batteryRating ?? null,
        warrantyMonths: p.warrantyMonths ?? null,
        hasBox: p.hasBox,
        hasCharger: p.hasCharger,
        hasCable: p.hasCable,
        availability: p.availability,
        isFeatured: p.isFeatured,
        publishedAt,
        soldAt,
        description: p.description ?? null,
        searchText,
      },
    });
    productCount++;
  }
  console.log(`✅ Products: ${productCount}`);

  // --- Testimonials ---
  const testimonials = [
    { customerName: "Rajesh K.", text: "Bought an iPhone 13 from Shree Mobiles. The condition was exactly as described.", sortOrder: 1 },
    { customerName: "Priya M.", text: "Best place to buy second-hand phones in Ranibennur. Very honest about condition.", sortOrder: 2 },
    { customerName: "Amir S.", text: "Got a great deal on Samsung S23. Working perfectly after 3 months.", sortOrder: 3 },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t });
  }
  console.log(`✅ Testimonials: ${testimonials.length} (demo)`);

  // --- Announcement ---
  await prisma.announcement.create({
    data: {
      title: "🎉 Grand Sale — Up to 40% off on select iPhones!",
      body: "Visit our shop this weekend for exclusive deals.",
      ctaLabel: "Browse iPhones",
      ctaHref: "/phones?brandSlug=apple",
      isActive: true,
    },
  });
  console.log("✅ Announcement: 1 (demo)");

  console.log("\n✨ Seed complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
