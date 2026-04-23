import { notFound } from "next/navigation";
import { MacroForm } from "@/components/MacroForm";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Macro } from "@/lib/types";
import { updateMacroAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditMacroPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("macros")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <>
      <h1 className="mb-6 text-lg uppercase tracking-widest">
        // edit_macro &mdash;{" "}
        <span className="text-lime-dim">{(data as Macro).slug}</span>
      </h1>
      <MacroForm mode="edit" initial={data as Macro} action={updateMacroAction} />
    </>
  );
}
