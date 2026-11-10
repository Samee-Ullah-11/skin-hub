import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { getDict } from "@/i18n";
import { isLang } from "@/i18n/config";
import { notFound } from "next/navigation";

export default async function PublicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  return (
    <div data-role="public" className="flex flex-1 flex-col">
      <AnnouncementBar messages={t.showcase.announcements} hideLabel={t.showcase.hideAnnouncement} />
      <Header lang={lang} />
      <main id="main" className="flex-1 overflow-x-clip pt-20">
        {children}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
