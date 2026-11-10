import { notFound } from "next/navigation";
import { LocalizedRowForm } from "@/components/admin/LocalizedRowForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { isLang, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { listCategories, listTreatments } from "@/services/catalog";

export default async function CatalogPage({ params }: PageProps<"/[lang]/admin/catalog">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const a = t.admin;
  const [categories, treatments] = await Promise.all([listCategories(), listTreatments()]);
  const labels = { en: a.nameEn, ur: a.nameUr, active: a.active, save: t.common.save };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={a.navCatalog} />
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{a.categories}</h2>
        {categories.map((c) => (
          <LocalizedRowForm key={String(c._id)} op="category.save" lang={lang} labels={labels} values={{ id: String(c._id), en: c.name.en, ur: c.name.ur ?? "", active: c.active }} />
        ))}
        <h3 className="mt-2 text-base font-semibold">{a.addCategory}</h3>
        <LocalizedRowForm op="category.save" lang={lang} labels={labels} />
      </Card>

      {categories.map((cat) => (
        <Card key={String(cat._id)} className="flex flex-col gap-3 p-5">
          <h2 className="text-lg">
            {a.treatments}: {pick(cat.name, lang)}
          </h2>
          {treatments
            .filter((tr) => String(tr.categoryId) === String(cat._id))
            .map((tr) => (
              <LocalizedRowForm
                key={String(tr._id)}
                op="treatment.save"
                lang={lang}
                labels={labels}
                values={{ id: String(tr._id), en: tr.name.en, ur: tr.name.ur ?? "", active: tr.active }}
                hidden={{ categoryId: String(cat._id) }}
              />
            ))}
          <h3 className="mt-2 text-base font-semibold">{a.addTreatment}</h3>
          <LocalizedRowForm op="treatment.save" lang={lang} labels={labels} hidden={{ categoryId: String(cat._id) }} />
        </Card>
      ))}
    </div>
  );
}
