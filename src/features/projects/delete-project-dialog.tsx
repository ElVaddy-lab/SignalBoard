"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import styles from "./projects.module.css";

type DeleteProjectDialogProps = {
  open: boolean;
  projectTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function DeleteProjectDialog({ open, projectTitle, onClose, onConfirm }: DeleteProjectDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("projects");
  const common = useTranslations("common");

  const confirm = async () => {
    setError("");
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setError(t("deleteFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !pending) onClose(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content className={styles.deleteDialog} onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}>
          <AlertDialog.Cancel asChild><button aria-label={t("closeDeleteConfirmation")} className={styles.dialogClose} disabled={pending} type="button"><X aria-hidden="true" size={19} /></button></AlertDialog.Cancel>
          <AlertTriangle aria-hidden="true" className={styles.dangerIcon} size={32} />
          <AlertDialog.Title asChild><h2>{t("deleteTitle", { title: projectTitle })}</h2></AlertDialog.Title>
          <AlertDialog.Description asChild><p>{t("deleteDescription")}</p></AlertDialog.Description>
          <p className={styles.deleteWarning}><AlertTriangle aria-hidden="true" size={17} />{t("deleteWarning")}</p>
          {error ? <p className={styles.formAlert} role="alert">{error}</p> : null}
          <footer className={styles.dialogFooter}>
            <AlertDialog.Cancel asChild><Button disabled={pending} type="button" variant="secondary">{common("cancel")}</Button></AlertDialog.Cancel>
            <Button loading={pending} onClick={confirm} type="button" variant="danger">{t("deleteProject")}</Button>
          </footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
