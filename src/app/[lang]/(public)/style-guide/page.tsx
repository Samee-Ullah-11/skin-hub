import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, FeaturedBadge, StatusChip } from "@/components/ui/Chip";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { StyleGuideSlots } from "./StyleGuideSlots";

export const metadata: Metadata = { title: "Style guide", robots: { index: false, follow: false } };

const SURFACE_TOKENS = ["page", "surface", "soft", "border", "text", "muted", "primary", "accent"];

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-10 w-10 shrink-0 rounded-md border border-line" style={{ background: `var(--${token})` }} />
      <code className="text-sm text-muted" dir="ltr">
        --{token}
      </code>
    </div>
  );
}

function RolePanel({ role, title, t }: { role: string; title: string; t: ReturnType<typeof getDict> }) {
  return (
    <div data-role={role}>
      <Card className="flex flex-col gap-4 p-5">
        <h3 className="text-lg">{title}</h3>
        <div className="flex flex-wrap gap-2">
          <Button>{t.common.save}</Button>
          <Button variant="secondary">{t.common.cancel}</Button>
          <Button variant="ghost">{t.common.edit}</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip>{t.nav.clinics}</Chip>
          <Chip>{t.nav.treatments}</Chip>
        </div>
        <a href="#" className="link text-[15px]">
          {t.common.viewAll}
        </a>
      </Card>
    </div>
  );
}

export default async function StyleGuidePage({ params }: PageProps<"/[lang]/style-guide">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);

  return (
    <div className="container-page flex flex-col gap-12 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl">Style guide</h1>
        <p className="max-w-2xl text-muted">
          Design tokens and components. Use the theme button in the header to switch between device, light and dark.
          Use the language button to check right-to-left layout.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Typography</h2>
        <Card className="flex flex-col gap-3 p-6">
          <p className="text-4xl font-display">Find a skin clinic in Peshawar</p>
          <p className="text-2xl font-display">Clinics, treatments and open times</p>
          <p className="max-w-2xl text-[17px]">
            Body text and headings use Poppins; body at 16 to 17 pixels with a 1.6 line height. Urdu uses
            Noto Nastaliq Urdu for headings and Noto Naskh Arabic for body text with a taller line height.
          </p>
          <p className="text-sm text-muted">Muted text for hints and metadata.</p>
          <div lang="ur" dir="rtl" className="mt-2 border-t border-line pt-4">
            <p className="text-3xl" style={{ fontFamily: "var(--f-nastaliq)", lineHeight: 2.1 }}>
              پشاور میں جلد کا کلینک تلاش کریں
            </p>
            <p className="text-[17px]" style={{ fontFamily: "var(--f-naskh)", lineHeight: 2 }}>
              کلینک منتخب کریں، ڈاکٹر چنیں اور خالی وقت پر درخواست بھیجیں۔
            </p>
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Colour tokens</h2>
        <Card className="grid gap-4 p-6 sm:grid-cols-2 md:grid-cols-4">
          {SURFACE_TOKENS.map((tk) => (
            <Swatch key={tk} token={tk} />
          ))}
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Role colours</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <RolePanel role="public" title="Patient and public" t={t} />
          <RolePanel role="clinic" title="Clinic dashboard" t={t} />
          <RolePanel role="admin" title="Admin" t={t} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Buttons</h2>
        <Card className="flex flex-wrap items-center gap-3 p-6">
          <Button size="lg">{t.nav.registerClinic}</Button>
          <Button>{t.common.save}</Button>
          <Button size="sm">{t.common.confirm}</Button>
          <Button variant="secondary">{t.common.cancel}</Button>
          <Button variant="ghost">{t.common.viewAll}</Button>
          <Button variant="danger">{t.common.remove}</Button>
          <Button variant="accent">{t.common.featured}</Button>
          <Button disabled>{t.common.submit}</Button>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Status chips and badges</h2>
        <Card className="flex flex-wrap items-center gap-3 p-6">
          <StatusChip tone="pending" label={t.status.pending} />
          <StatusChip tone="approved" label={t.status.approved} />
          <StatusChip tone="rejected" label={t.status.rejected} />
          <StatusChip tone="blocked" label={t.status.blocked} />
          <FeaturedBadge label={t.common.featured} />
          <Chip>{t.common.sample}</Chip>
        </Card>
        <div className="grid gap-3 md:grid-cols-2">
          <Banner tone="pending" title={t.status.pending} />
          <Banner tone="approved" title={t.status.approved} />
          <Banner tone="rejected" title={t.status.rejected}>
            {t.common.reason}: …
          </Banner>
          <Banner tone="info">{t.slots.timesShownIn}</Banner>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Cards</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {["A", "B", "C"].map((k, i) => (
            <Card key={k} className="flex flex-col overflow-hidden">
              <div className="aspect-[4/3] bg-soft" aria-hidden="true" />
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  {i === 0 ? <FeaturedBadge label={t.common.featured} /> : null}
                  <Chip>{t.common.sample}</Chip>
                </div>
                <h3 className="text-lg">SAMPLE Clinic {k}</h3>
                <p className="text-sm text-muted">Hayatabad, Peshawar</p>
                <Button variant="secondary" size="sm" className="mt-2 self-start">
                  {t.common.viewAll}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Form fields</h2>
        <Card className="grid gap-4 p-6 md:grid-cols-2">
          <Field id="sg-name" label={t.common.name}>
            <Input id="sg-name" placeholder="Ayesha Khan" />
          </Field>
          <Field id="sg-phone" label={t.common.phone} error={t.errors.invalidPhone}>
            <Input id="sg-phone" aria-invalid="true" defaultValue="12345" dir="ltr" />
          </Field>
          <Field id="sg-city" label={t.nav.city}>
            <Select id="sg-city" defaultValue="peshawar">
              <option value="peshawar">Peshawar</option>
            </Select>
          </Field>
          <Field id="sg-note" label={t.common.note} optionalLabel={t.common.optional}>
            <Textarea id="sg-note" />
          </Field>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Slot picker</h2>
        <Card className="p-6">
          <StyleGuideSlots labels={t.slots} />
        </Card>
      </section>
    </div>
  );
}
