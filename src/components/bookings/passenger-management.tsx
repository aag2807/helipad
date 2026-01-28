"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, UploadCloud, User, IdCard, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import Image from "next/image";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface PassengerFormData {
  id?: string; // For existing passengers
  name: string;
  identificationType: "cedula" | "passport" | "other";
  identificationNumber: string;
  idPhotoBase64?: string;
}

interface PassengerManagementProps {
  bookingId?: string; // Optional if creating a new booking
  initialPassengers?: PassengerFormData[];
  onPassengersChange: (passengers: PassengerFormData[]) => void;
  isSubmitting?: boolean;
  error?: string;
}

export function PassengerManagement({
  bookingId,
  initialPassengers = [],
  onPassengersChange,
  isSubmitting,
  error,
}: PassengerManagementProps) {
  const { t } = useTranslations();
  const [passengers, setPassengers] = useState<PassengerFormData[]>(
    initialPassengers.length > 0
      ? initialPassengers
      : [
          {
            name: "",
            identificationType: "cedula",
            identificationNumber: "",
            idPhotoBase64: undefined,
          },
        ]
  );
  const [errors, setErrors] = useState<{ [key: number]: Partial<Record<keyof PassengerFormData, string>> }>({});
  const [photoErrors, setPhotoErrors] = useState<{ [key: number]: string }>({});

  const validatePassenger = (passenger: PassengerFormData, index: number) => {
    const passengerErrors: Partial<Record<keyof PassengerFormData, string>> = {};

    if (!passenger.name || passenger.name.trim() === "") {
      passengerErrors.name = t("validations.passengerNameRequired");
    }
    if (!passenger.identificationType) {
      passengerErrors.identificationType = t("validations.identificationTypeRequired");
    }
    if (!passenger.identificationNumber || passenger.identificationNumber.trim() === "") {
      passengerErrors.identificationNumber = t("validations.identificationNumberRequired");
    }

    setErrors((prev) => ({
      ...prev,
      [index]: passengerErrors,
    }));

    return Object.keys(passengerErrors).length === 0;
  };

  const handleFieldChange = (index: number, field: keyof PassengerFormData, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    };
    setPassengers(updatedPassengers);
    onPassengersChange(updatedPassengers);

    // Clear error for this field
    if (errors[index]?.[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const handleAddPassenger = useCallback(() => {
    const newPassenger: PassengerFormData = {
      name: "",
      identificationType: "cedula",
      identificationNumber: "",
      idPhotoBase64: undefined,
    };
    const updatedPassengers = [...passengers, newPassenger];
    setPassengers(updatedPassengers);
    onPassengersChange(updatedPassengers);
  }, [passengers, onPassengersChange]);

  const handleRemovePassenger = useCallback(
    (index: number) => {
      const updatedPassengers = passengers.filter((_, i) => i !== index);
      setPassengers(updatedPassengers);
      onPassengersChange(updatedPassengers);

      // Clear errors for removed passenger
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        // Reindex errors
        const reindexedErrors: typeof newErrors = {};
        Object.keys(newErrors).forEach((key) => {
          const numKey = parseInt(key);
          if (numKey > index) {
            reindexedErrors[numKey - 1] = newErrors[numKey];
          } else {
            reindexedErrors[numKey] = newErrors[numKey];
          }
        });
        return reindexedErrors;
      });

      // Clear photo errors
      setPhotoErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        const reindexedErrors: typeof newErrors = {};
        Object.keys(newErrors).forEach((key) => {
          const numKey = parseInt(key);
          if (numKey > index) {
            reindexedErrors[numKey - 1] = newErrors[numKey];
          } else {
            reindexedErrors[numKey] = newErrors[numKey];
          }
        });
        return reindexedErrors;
      });
    },
    [passengers, onPassengersChange]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = event.target.files?.[0];
      if (file) {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          setPhotoErrors((prev) => ({
            ...prev,
            [index]: t("passengers.photoSizeError"),
          }));
          return;
        }

        // Check file type
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
          setPhotoErrors((prev) => ({
            ...prev,
            [index]: t("passengers.photoTypeError"),
          }));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const updatedPassengers = [...passengers];
          updatedPassengers[index] = {
            ...updatedPassengers[index],
            idPhotoBase64: reader.result as string,
          };
          setPassengers(updatedPassengers);
          onPassengersChange(updatedPassengers);

          // Clear photo error
          setPhotoErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [passengers, onPassengersChange, t]
  );

  const handleRemovePhoto = useCallback(
    (index: number) => {
      const updatedPassengers = [...passengers];
      updatedPassengers[index] = {
        ...updatedPassengers[index],
        idPhotoBase64: undefined,
      };
      setPassengers(updatedPassengers);
      onPassengersChange(updatedPassengers);
    },
    [passengers, onPassengersChange]
  );

  return (
    <div className="space-y-4 border-t border-zinc-200 pt-4">
      <div>
        <Label className="text-base font-semibold" required>
          {t("passengers.title")}
        </Label>
        <p className="text-xs text-zinc-500 mt-1">{t("passengers.description")}</p>
      </div>

      {passengers.map((passenger, index) => (
        <div
          key={index}
          className="p-4 border border-zinc-200 rounded-xl space-y-3 relative bg-white"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-zinc-700">
              {t("passengers.passenger")} {index + 1}
            </h4>
            {passengers.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-red-500 h-8 w-8"
                onClick={() => handleRemovePassenger(index)}
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Name */}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor={`passenger-name-${index}`} required>
                {t("passengers.name")}
              </Label>
              <Input
                id={`passenger-name-${index}`}
                value={passenger.name}
                onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                error={!!errors[index]?.name}
                placeholder={t("passengers.namePlaceholder")}
                disabled={isSubmitting}
              />
              {errors[index]?.name && (
                <p className="text-xs text-red-600">{errors[index].name}</p>
              )}
            </div>

            {/* Identification Type */}
            <div className="space-y-1">
              <Label htmlFor={`passenger-id-type-${index}`} required>
                {t("passengers.identificationType")}
              </Label>
              <Select
                id={`passenger-id-type-${index}`}
                value={passenger.identificationType}
                onChange={(e) =>
                  handleFieldChange(
                    index,
                    "identificationType",
                    e.target.value as "cedula" | "passport" | "other"
                  )
                }
                error={!!errors[index]?.identificationType}
                disabled={isSubmitting}
              >
                <option value="cedula">{t("passengers.cedula")}</option>
                <option value="passport">{t("passengers.passport")}</option>
                <option value="other">{t("passengers.other")}</option>
              </Select>
              {errors[index]?.identificationType && (
                <p className="text-xs text-red-600">
                  {errors[index].identificationType}
                </p>
              )}
            </div>

            {/* Identification Number */}
            <div className="space-y-1">
              <Label htmlFor={`passenger-id-number-${index}`} required>
                {t("passengers.identificationNumber")}
              </Label>
              <Input
                id={`passenger-id-number-${index}`}
                value={passenger.identificationNumber}
                onChange={(e) =>
                  handleFieldChange(index, "identificationNumber", e.target.value)
                }
                error={!!errors[index]?.identificationNumber}
                placeholder={t("passengers.identificationPlaceholder")}
                disabled={isSubmitting}
              />
              {errors[index]?.identificationNumber && (
                <p className="text-xs text-red-600">
                  {errors[index].identificationNumber}
                </p>
              )}
            </div>

            {/* ID Photo Upload */}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor={`passenger-photo-${index}`}>
                {t("passengers.idPhoto")}
              </Label>
              <div
                className={cn(
                  "flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors relative overflow-hidden",
                  photoErrors[index] && "border-red-500",
                  isSubmitting && "opacity-50 pointer-events-none"
                )}
              >
                {passenger.idPhotoBase64 ? (
                  <>
                    <div className="relative w-full h-full">
                      <Image
                        src={passenger.idPhotoBase64}
                        alt="ID Photo Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 bg-white rounded-full text-red-500 hover:bg-red-50 h-8 w-8 shadow-md"
                      onClick={() => handleRemovePhoto(index)}
                      disabled={isSubmitting}
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <input
                      id={`passenger-photo-${index}`}
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, index)}
                      disabled={isSubmitting}
                    />
                    <div className="flex flex-col items-center text-zinc-500 pointer-events-none">
                      <UploadCloud className="w-6 h-6" />
                      <p className="text-sm mt-1">{t("passengers.uploadPhoto")}</p>
                      <p className="text-xs">{t("passengers.photoFormat")}</p>
                    </div>
                  </>
                )}
              </div>
              {photoErrors[index] && (
                <p className="text-xs text-red-600">{photoErrors[index]}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="button"
        variant="outline"
        onClick={handleAddPassenger}
        className="w-full"
        disabled={isSubmitting}
      >
        <Plus className="w-4 h-4 mr-2" />
        {t("passengers.addPassenger")}
      </Button>

      {passengers.length > 0 && (
        <p className="text-xs text-zinc-500 text-center">
          {passengers.length} {t("passengers.added")}
        </p>
      )}
    </div>
  );
}
