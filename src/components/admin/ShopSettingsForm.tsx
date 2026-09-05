"use client";

import { useState, useTransition } from "react";
import { updateShopAction } from "@/server/modules/shop/actions";
import type { Shop } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/ui/time-picker";
import { Building2, Phone, MapPin, Clock, ShieldCheck, Mail, Instagram, Facebook, Link as LinkIcon, ImageIcon } from "lucide-react";
import { ShopLogoUpload } from "@/components/admin/ShopLogoUpload";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface ShopSettingsFormProps {
  shop: Shop;
}

type HoursMap = Record<string, string>;

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function parseRange(val: string): { openTime: string; closeTime: string; isHoliday: boolean } {
  const isHoliday = val.includes("Holiday");
  const timeStr = val.replace("Holiday", "").replace("|", "").trim();
  if (!timeStr || !timeStr.includes(" - ")) return { openTime: "10:00 AM", closeTime: "08:00 PM", isHoliday };
  const [o, c] = timeStr.split(" - ");
  return { openTime: o?.trim() || "10:00 AM", closeTime: c?.trim() || "08:00 PM", isHoliday };
}

export function ShopSettingsForm({ shop }: ShopSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState(shop.name);
  const [tagline, setTagline] = useState(shop.tagline || "");
  const [about, setAbout] = useState(shop.about || "");
  const [phone, setPhone] = useState(shop.phone);
  const [whatsapp, setWhatsapp] = useState(shop.whatsapp);
  const [email, setEmail] = useState(shop.email || "");
  const [addressLine1, setAddressLine1] = useState(shop.addressLine1);
  const [addressLine2, setAddressLine2] = useState(shop.addressLine2 || "");
  const [city, setCity] = useState(shop.city);
  const [state, setState] = useState(shop.state);
  const [pincode, setPincode] = useState(shop.pincode);
  const [mapsUrl, setMapsUrl] = useState(shop.mapsUrl || "");
  const [instagram, setInstagram] = useState(shop.instagram || "");
  const [facebook, setFacebook] = useState(shop.facebook || "");
  const [yearsInBiz, setYearsInBiz] = useState(shop.yearsInBiz?.toString() || "");
  const [hours, setHours] = useState<HoursMap>(() => {
    const h = (shop.hours ?? {}) as HoursMap;
    return DAYS.reduce<HoursMap>((acc, day) => {
      acc[day] = h[day] || "";
      return acc;
    }, {});
  });
  const [trustBadgesText, setTrustBadgesText] = useState(() => {
    const badges = (shop.trustBadges ?? []) as string[];
    return badges.join("\n");
  });
  const [warrantyPolicy, setWarrantyPolicy] = useState(() => {
    const p = (shop.policies ?? {}) as Record<string, string>;
    return p.warranty || "";
  });
  const [exchangePolicy, setExchangePolicy] = useState(() => {
    const p = (shop.policies ?? {}) as Record<string, string>;
    return p.exchange || "";
  });
  const [returnPolicy, setReturnPolicy] = useState(() => {
    const p = (shop.policies ?? {}) as Record<string, string>;
    return p.return || "";
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateShopAction({
        name,
        tagline: tagline || null,
        about: about || null,
        phone,
        whatsapp,
        email: email || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        pincode,
        mapsUrl: mapsUrl || null,
        instagram: instagram || null,
        facebook: facebook || null,
        yearsInBiz: yearsInBiz ? parseInt(yearsInBiz, 10) : null,
        hours: Object.fromEntries(Object.entries(hours).filter(([, v]) => v)),
        trustBadges: trustBadgesText.split("\n").map(s => s.trim()).filter(Boolean),
        policies: {
          ...(warrantyPolicy ? { warranty: warrantyPolicy } : {}),
          ...(exchangePolicy ? { exchange: exchangePolicy } : {}),
          ...(returnPolicy ? { return: returnPolicy } : {}),
        },
      });

      if (result.success) {
        toast.success("Shop settings updated successfully!");
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-input/50 bg-background/50 px-4 py-3.5 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-input focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10";
  const labelClass = "block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2";
  const sectionHeaderClass = "flex items-center gap-3 mb-6";
  const sectionIconClass = "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary";
  const sectionTitleClass = "text-xl font-bold text-foreground tracking-tight";
  const cardClass = "relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 p-6 sm:p-8 shadow-sm backdrop-blur-xl transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-10">
      
      {/* Brand Logos Widget */}
      <section className={cardClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionIconClass}><ImageIcon className="h-5 w-5" /></div>
          <div>
            <h2 className={sectionTitleClass}>Brand Logos</h2>
            <p className="text-sm text-muted-foreground">Upload separate logos for different areas of your site. Max 2MB each.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ShopLogoUpload
            logoType="header"
            label="Header Logo"
            description="Shown in website navbar"
            currentUrl={shop.logoUrl}
          />
          <ShopLogoUpload
            logoType="footer"
            label="Footer Logo"
            description="Shown in website footer"
            currentUrl={shop.footerLogoUrl}
          />
          <ShopLogoUpload
            logoType="dashboard"
            label="Dashboard Logo"
            description="Shown in admin panel"
            currentUrl={shop.dashboardLogoUrl}
          />
        </div>
      </section>

      {/* Basic Info Widget */}
      <section className={cardClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionIconClass}><Building2 className="h-5 w-5" /></div>
          <div>
            <h2 className={sectionTitleClass}>Shop Identity</h2>
            <p className="text-sm text-muted-foreground">Your brand presence on the website.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="shop-name" className={labelClass}>Shop Name *</label>
            <input id="shop-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Shree Mobiles" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="shop-tagline" className={labelClass}>Tagline</label>
            <input id="shop-tagline" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClass} placeholder="Trusted Pre-Owned Phones Since 2018" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="shop-about" className={labelClass}>About Us</label>
            <textarea id="shop-about" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} className={inputClass} placeholder="Tell customers about your shop's history and values..." />
          </div>

          <div>
            <label htmlFor="shop-years" className={labelClass}>Years in Business</label>
            <input id="shop-years" type="number" min={0} max={100} value={yearsInBiz} onChange={(e) => setYearsInBiz(e.target.value)} className={inputClass} placeholder="6" />
          </div>
        </div>
      </section>

      {/* Contact & Social Combined Widget */}
      <section className={cardClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionIconClass}><Phone className="h-5 w-5" /></div>
          <div>
            <h2 className={sectionTitleClass}>Connect & Social</h2>
            <p className="text-sm text-muted-foreground">How customers reach you.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="relative">
            <label htmlFor="shop-phone" className={labelClass}>Phone *</label>
            <Phone className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
            <input id="shop-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} pl-11`} placeholder="+919876543210" />
          </div>
          
          <div className="relative">
            <label htmlFor="shop-whatsapp" className={labelClass}>WhatsApp *</label>
            <LinkIcon className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
            <input id="shop-whatsapp" type="tel" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={`${inputClass} pl-11`} placeholder="+919876543210" />
            <a
              href={buildWhatsAppLink(whatsapp, "Test from my shop website. If you received this, WhatsApp is set correctly.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
            >
              Send yourself a WhatsApp test
            </a>
          </div>

          <div className="relative sm:col-span-2">
            <label htmlFor="shop-email" className={labelClass}>Email</label>
            <Mail className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
            <input id="shop-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-11`} placeholder="contact@shreemobiles.com" />
          </div>

          <div className="relative">
            <label htmlFor="shop-ig" className={labelClass}>Instagram</label>
            <Instagram className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
            <input id="shop-ig" type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={`${inputClass} pl-11`} placeholder="shreemobiles" />
          </div>
          
          <div className="relative">
            <label htmlFor="shop-fb" className={labelClass}>Facebook</label>
            <Facebook className="absolute left-4 top-[38px] h-4 w-4 text-muted-foreground" />
            <input id="shop-fb" type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} className={`${inputClass} pl-11`} placeholder="shreemobiles" />
          </div>
        </div>
      </section>

      {/* Opening Hours Widget - iOS Grouped Style */}
      <section className={cardClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionIconClass}><Clock className="h-5 w-5" /></div>
          <div>
            <h2 className={sectionTitleClass}>Opening Hours</h2>
            <p className="text-sm text-muted-foreground">Set your daily store schedule.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/50 divide-y divide-border/40 overflow-hidden">
          {DAYS.map((day) => {
            const val = hours[day] || "";
            const isClosed = val.trim() === "";
            const { openTime, closeTime, isHoliday } = parseRange(val);
            const isOpen = !isClosed;

            return (
              <div 
                key={day} 
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 gap-2 sm:gap-4 hover:bg-muted/20 transition-colors"
              >
                {/* Row 1 / Left side: Day Name + iOS Switch */}
                <div className="flex items-center justify-between sm:justify-start gap-3 sm:w-36 shrink-0">
                  <span className={`text-sm font-bold capitalize ${
                    !isOpen ? 'text-muted-foreground/60' : 'text-foreground'
                  }`}>
                    {day}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOpen}
                    onClick={() => {
                      if (isOpen) setHours(p => ({ ...p, [day]: "" }));
                      else setHours(p => ({ ...p, [day]: "10:00 AM - 08:00 PM" }));
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isOpen ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out ${
                        isOpen ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Row 2 / Right side: Time Selector or Closed label */}
                {!isOpen ? (
                  <span className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest self-start sm:self-auto py-1">
                    Closed
                  </span>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto mt-1 sm:mt-0">
                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                      <TimePicker
                        id={`hour-${day}-open`}
                        value={openTime}
                        onChange={(newOpen) => setHours(prev => ({ ...prev, [day]: `${isHoliday ? "Holiday|" : ""}${newOpen} - ${closeTime}` }))}
                      />
                      <span className="text-[11px] font-bold text-muted-foreground/60 shrink-0">to</span>
                      <TimePicker
                        value={closeTime}
                        onChange={(newClose) => setHours(prev => ({ ...prev, [day]: `${isHoliday ? "Holiday|" : ""}${openTime} - ${newClose}` }))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setHours(prev => ({ ...prev, [day]: isHoliday ? `${openTime} - ${closeTime}` : `Holiday|${openTime} - ${closeTime}` }))}
                      className={`w-full sm:w-auto sm:ml-1 text-[11px] font-bold px-3 py-2 sm:py-1.5 rounded-lg transition-colors border ${
                        isHoliday
                          ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      }`}
                    >
                      {isHoliday ? "Holiday (On)" : "Set as Holiday"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Location Widget */}
      <section className={cardClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionIconClass}><MapPin className="h-5 w-5" /></div>
          <div>
            <h2 className={sectionTitleClass}>Store Location</h2>
            <p className="text-sm text-muted-foreground">Address and map details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
          <div className="sm:col-span-6">
            <label htmlFor="shop-addr1" className={labelClass}>Address Line 1 *</label>
            <input id="shop-addr1" type="text" required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className={inputClass} placeholder="Shop No. 12, Main Road" />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="shop-addr2" className={labelClass}>Address Line 2</label>
            <input id="shop-addr2" type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className={inputClass} placeholder="Near Bus Stand" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="shop-city" className={labelClass}>City *</label>
            <input id="shop-city" type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="shop-state" className={labelClass}>State *</label>
            <input id="shop-state" type="text" required value={state} onChange={(e) => setState(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="shop-pincode" className={labelClass}>Pincode *</label>
            <input id="shop-pincode" type="text" required value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputClass} />
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="shop-maps" className={labelClass}>Google Maps URL</label>
            <input id="shop-maps" type="url" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} className={inputClass} placeholder="https://maps.google.com/?q=..." />
          </div>
        </div>
      </section>

      {/* Trust & Policies Widget */}
      <section className={cardClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionIconClass}><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h2 className={sectionTitleClass}>Trust & Policies</h2>
            <p className="text-sm text-muted-foreground">Build confidence with clear rules.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="shop-badges" className={labelClass}>Trust Badges (One per line)</label>
            <textarea
              id="shop-badges"
              rows={3}
              value={trustBadgesText}
              onChange={(e) => setTrustBadgesText(e.target.value)}
              className={inputClass}
              placeholder={"Personally Inspected\nHonest Condition\nWarranty Available"}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="shop-warranty" className={labelClass}>Warranty Policy</label>
            <input id="shop-warranty" type="text" value={warrantyPolicy} onChange={(e) => setWarrantyPolicy(e.target.value)} className={inputClass} placeholder="7-day replacement warranty" />
          </div>

          <div>
            <label htmlFor="shop-exchange" className={labelClass}>Exchange Policy</label>
            <input id="shop-exchange" type="text" value={exchangePolicy} onChange={(e) => setExchangePolicy(e.target.value)} className={inputClass} placeholder="Exchange available" />
          </div>

          <div>
            <label htmlFor="shop-return" className={labelClass}>Return Policy</label>
            <input id="shop-return" type="text" value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} className={inputClass} placeholder="No returns after 7 days" />
          </div>
        </div>
      </section>

      {/* Floating Save Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] sm:w-auto">
        <div className="flex items-center gap-4 rounded-full border border-border/50 bg-background/80 px-2 py-2 pr-4 pl-6 shadow-2xl backdrop-blur-2xl">
          <p className="hidden sm:block text-sm font-medium text-foreground">
            You have unsaved changes.
          </p>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto h-12 rounded-full px-8 text-sm font-bold shadow-lg shadow-primary/25"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}
