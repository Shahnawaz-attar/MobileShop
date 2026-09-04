/**
 * Utility for generating WhatsApp click-to-chat links.
 */

export function buildWhatsAppLink(phone: string, text: string) {
  // Remove any non-numeric characters from the phone number
  const numericPhone = phone.replace(/\D/g, "");
  
  // If the number doesn't have a country code, assume India (+91)
  const finalPhone = numericPhone.length === 10 ? `91${numericPhone}` : numericPhone;
  
  const encodedText = encodeURIComponent(text);
  
  return `https://wa.me/${finalPhone}?text=${encodedText}`;
}

export function generateProductEnquiryText(product: {
  title: string;
  storageGb?: number | null;
  colour?: string | null;
  pricePaise: number;
}, url: string) {
  const price = (product.pricePaise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const variantStr = [
    product.storageGb ? `${product.storageGb}GB` : null,
    product.colour,
  ].filter(Boolean).join(" ");

  const fullName = variantStr ? `${product.title} (${variantStr})` : product.title;

  return `Hi, I saw the ${fullName} for ${price} on your website. Is it still available?\n\n${url}`;
}
