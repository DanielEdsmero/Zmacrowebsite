import { MacroForm } from "@/components/MacroForm";
import { createMacroAction } from "../actions";

export default function NewMacroPage() {
  return (
    <>
      <h1 className="mb-6 text-lg uppercase tracking-widest">
        // new_macro
      </h1>
      <MacroForm mode="create" action={createMacroAction} />
    </>
  );
}
