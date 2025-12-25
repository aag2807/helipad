"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteUserDialogProps) {
  const { t } = useTranslations();
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {t("deleteUserDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("deleteUserDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-sm text-red-800">
              {t("deleteUserDialog.aboutToDelete")}{" "}
              <span className="font-semibold">
                {user.firstName} {user.lastName}
              </span>{" "}
              (<span className="font-mono text-xs">@{user.username}</span>).
            </p>
            <p className="text-sm text-red-600 mt-2">
              {t("deleteUserDialog.bookingsWillBeDeleted")}
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("deleteUserDialog.deleteUser")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

