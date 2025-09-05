import React from "react";
import { CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export function showSaveSuccessToast(templateName: string = "New Template") {
  // Do NOT use React hooks here — this is a plain utility function.
  let lastToastId: string | null = null;

  const toastIdRaw = toast.custom(
    (id: string | number) => {
      const idStr = String(id);

      return (
        <div
          data-toast-id={idStr}
          className="flex w-[540px] p-6 items-start gap-4 rounded-lg bg-white shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
        >
          <div className="flex w-12 h-12 p-3 justify-center items-center flex-shrink-0 rounded-[28px] border-[8px] border-[#ECFDF3] bg-[#D1FADF]">
            <CheckCircle className="w-6 h-6 text-[#039855]" />
          </div>
          <div className="flex flex-col items-start gap-7 flex-1">
            <div className="flex flex-col items-start gap-2 self-stretch">
              <div className="self-stretch text-[#323238] font-figtree text-base font-bold leading-[26px]">
                "{templateName}" has been saved successfully.
              </div>
              <div className="self-stretch text-[#676879] font-figtree text-[13px] font-normal leading-5">
                Congratulations! 
              </div>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(idStr)}
            className="flex w-8 h-8 justify-center items-center gap-[10px] flex-shrink-0 rounded-[50px] bg-white"
          >
            <X className="w-5 h-5 text-[#676879]" />
          </button>
        </div>
      );
    },
    {
      duration: 4000,
      position: "top-center",
    },
  );

  // store id so outside click handler can dismiss immediately
  const toastId = String(toastIdRaw);
  lastToastId = toastId;

  // Dismiss the toast when clicking/touching anywhere outside it
  const onDocInteract = (e: Event) => {
    const id = lastToastId;
    if (!id) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const inside = target.closest && target.closest(`[data-toast-id="${id}"]`);
    if (!inside) {
      toast.dismiss(id);
    }
  };

  document.addEventListener("mousedown", onDocInteract);
  document.addEventListener("touchstart", onDocInteract);

  // Cleanup listener after toast duration + small buffer
  setTimeout(() => {
    document.removeEventListener("mousedown", onDocInteract);
    document.removeEventListener("touchstart", onDocInteract);
    lastToastId = null;
  }, 4200);
}
