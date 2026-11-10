import { cookies } from "next/headers";
import { LinkButton } from "@/components/ui/Button";
import { isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";

export default async function NotFound() {
  const value = (await cookies()).get("lang")?.value;
  const lang = isLang(value) ? value : "en";
  const t = getDict(lang).errors;
  return (
    <main id="main" data-role="public" className="container-page flex flex-1 flex-col items-start justify-center gap-4 py-20">
      <h1 className="text-3xl md:text-4xl">{t.notFoundTitle}</h1>
      <p className="text-muted">{t.notFoundBody}</p>
      <LinkButton href={localePath(lang, "/")}>{t.goHome}</LinkButton>
    </main>
  );
}
