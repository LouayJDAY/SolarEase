import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../services/api";

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  /** Ouvre la photo en plein écran au clic */
  enlargeOnClick?: boolean;
}

function apiPathFromSrc(src: string): string | null {
  if (src.startsWith("/api/")) {
    return src.replace(/^\/api/, "");
  }
  if (src.startsWith("/files/")) {
    return src;
  }
  return null;
}

export function AuthenticatedImage({
  src,
  alt,
  className,
  enlargeOnClick = false,
  onClick,
  ...rest
}: AuthenticatedImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!src) {
      setBlobUrl(null);
      setFailed(false);
      return;
    }

    const apiPath = apiPathFromSrc(src);
    if (!apiPath) {
      setBlobUrl(src);
      setFailed(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    api
      .get(apiPath, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data as Blob);
        setBlobUrl(objectUrl);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  if (!src || failed) {
    return null;
  }

  if (!blobUrl) {
    return (
      <div
        className={`animate-pulse bg-gray-100 ${className ?? ""}`}
        aria-label={alt}
      />
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    onClick?.(e);
    if (enlargeOnClick && !e.defaultPrevented) {
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <img
        src={blobUrl}
        alt={alt}
        className={`${className ?? ""}${enlargeOnClick ? " cursor-zoom-in" : ""}`}
        onClick={handleClick}
        {...rest}
      />
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={blobUrl}
            alt={alt}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
