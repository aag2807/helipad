"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";

const userFormSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["admin", "user"]),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  isActive: boolean;
}

interface UserFormProps {
  user?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData & { id?: string }) => void;
  isLoading?: boolean;
}

export function UserForm({
  user,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: UserFormProps) {
  const { t } = useTranslations();
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(
      isEditing
        ? userFormSchema.extend({
            password: z
              .string()
              .optional()
              .refine(
                (val) => !val || val.length >= 8,
                "Password must be at least 8 characters"
              ),
          })
        : userFormSchema.extend({
            password: z.string().min(8, "Password must be at least 8 characters"),
          })
    ),
  });

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (open) {
      reset(
        user
          ? {
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              isActive: user.isActive,
              password: "",
            }
          : {
              username: "",
              email: "",
              firstName: "",
              lastName: "",
              role: "user",
              isActive: true,
              password: "",
            }
      );
    }
  }, [user, open, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    const submitData = isEditing
      ? { ...data, id: user.id, password: data.password || undefined }
      : data;
    onSubmit(submitData as UserFormData & { id?: string });
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t("userForm.editTitle") : t("userForm.createTitle")}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("userForm.editDescription")
              : t("userForm.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogBody className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" required>
                  {t("userForm.firstName")}
                </Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  error={!!errors.firstName}
                  placeholder={t("userForm.placeholders.firstName")}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" required>
                  {t("userForm.lastName")}
                </Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  error={!!errors.lastName}
                  placeholder={t("userForm.placeholders.lastName")}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" required>
                {t("userForm.username")}
              </Label>
              <Input
                id="username"
                {...register("username")}
                error={!!errors.username}
                placeholder={t("userForm.placeholders.username")}
              />
              {errors.username && (
                <p className="text-xs text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" required>
                {t("userForm.email")}
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                error={!!errors.email}
                placeholder={t("userForm.placeholders.email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" required={!isEditing}>
                {isEditing ? t("userForm.passwordKeepCurrent") : t("userForm.password")}
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                error={!!errors.password}
                placeholder={isEditing ? t("userForm.placeholders.passwordEdit") : t("userForm.placeholders.passwordNew")}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Role & Status row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" required>
                  {t("userForm.role")}
                </Label>
                <Select id="role" {...register("role")} error={!!errors.role}>
                  <option value="user">{t("roles.user")}</option>
                  <option value="admin">{t("roles.admin")}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive" required>
                  {t("userForm.status")}
                </Label>
                <Select
                  id="isActive"
                  {...register("isActive", {
                    setValueAs: (v) => v === "true",
                  })}
                >
                  <option value="true">{t("common.active")}</option>
                  <option value="false">{t("common.inactive")}</option>
                </Select>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? t("userForm.updateUser") : t("userForm.createUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

