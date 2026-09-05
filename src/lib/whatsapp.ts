/**
 * Utility for generating WhatsApp click-to-chat links.
 */

export function buildWhatsAppLink(phone: string, text: string) {
  const numericPhone = phone.replace(/\D/g, "");
  const finalPhone = numericPhone.length === 10 ? `91${numericPhone}` : numericPhone;
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${finalPhone}?text=${encodedText}`;
}

/** Opens WhatsApp share sheet — user picks a contact (Status, groups, friends). */
export function buildWhatsAppShareLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function generateProductEnquiryText(product: {
  title: string;
  storageGb?: number | null;
  colour?: string | null;
  pricePaise: number;
}, url: string) {
  const price = formatProductPrice(product.pricePaise);
  const fullName = productDisplayName(product);
  return `Hi, I saw the ${fullName} for ${price} on your website. Is it still available?\n\n${url}`;
}

/** Short marketing copy for owner/buyer “Share on WhatsApp” (spec §19A). */
export function generateProductShareText(
  product: {
    title: string;
    storageGb?: number | null;
    colour?: string | null;
    pricePaise: number;
    condition?: string;
  },
  url: string,
  shopName: string
) {
  const price = formatProductPrice(product.pricePaise);
  const fullName = productDisplayName(product);
  const conditionLine = product.condition ? `\n${product.condition} condition` : "";
  return `📱 ${fullName}\n${price}${conditionLine}\n\nSee photos & details:\n${url}\n\nAvailable at ${shopName}`;
}

function formatProductPrice(pricePaise: number) {
  return (pricePaise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function productDisplayName(product: {
  title: string;
  storageGb?: number | null;
  colour?: string | null;
}) {
  const variantStr = [product.storageGb ? `${product.storageGb}GB` : null, product.colour]
    .filter(Boolean)
    .join(" ");
  return variantStr ? `${product.title} (${variantStr})` : product.title;
}
