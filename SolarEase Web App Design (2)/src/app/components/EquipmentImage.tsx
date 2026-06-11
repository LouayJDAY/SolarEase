import React, { useState } from "react";
import { ImageOff } from "lucide-react";
import { AuthenticatedImage } from "./AuthenticatedImage";
import {
  isAuthenticatedEquipmentImage,
  resolveEquipmentImageUrl,
} from "../utils/equipmentImage";

interface EquipmentImageProps {
  imageUrl?: string | null;
  type?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  enlargeOnClick?: boolean;
}

export function EquipmentImage({
  imageUrl,
  type,
  alt,
  className = "w-full h-full object-contain",
  containerClassName = "",
  enlargeOnClick = false,
}: EquipmentImageProps) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveEquipmentImageUrl(imageUrl, type);

  if (!resolved || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 ${containerClassName}`}
        aria-label={alt}
      >
        <ImageOff className="w-10 h-10 text-gray-300" />
      </div>
    );
  }

  if (isAuthenticatedEquipmentImage(resolved)) {
    return (
      <div className={containerClassName}>
        <AuthenticatedImage
          src={resolved}
          alt={alt}
          className={className}
          enlargeOnClick={enlargeOnClick}
        />
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <AuthenticatedImage
        src={resolved}
        alt={alt}
        className={className}
        enlargeOnClick={enlargeOnClick}
      />
    </div>
  );
}
