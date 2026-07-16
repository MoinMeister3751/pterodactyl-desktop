import { useConfirmStore } from "@/store/useConfirmStore";
import { Modal } from "./Modal";
import { Button } from "./Button";

/** Einmal in App.tsx eingebunden; wird durch useConfirm() aus jeder Komponente ausgelöst. */
export function ConfirmDialogHost() {
  const pending = useConfirmStore((s) => s.pending);
  const resolve = useConfirmStore((s) => s.resolve);

  return (
    <Modal
      open={!!pending}
      onClose={() => resolve(false)}
      title={pending?.title ?? ""}
      description={pending?.description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => resolve(false)}>
            {pending?.cancelLabel ?? "Abbrechen"}
          </Button>
          <Button
            variant={pending?.destructive ? "danger" : "primary"}
            onClick={() => resolve(true)}
            autoFocus
          >
            {pending?.confirmLabel ?? "Bestätigen"}
          </Button>
        </>
      }
    />
  );
}
