"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const STAR_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  size = 32,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const activeRating = hovered ?? value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => !disabled && setHovered(star)}
              onMouseLeave={() => !disabled && setHovered(null)}
              className="group p-1 transition-transform active:scale-90 hover:scale-110 disabled:pointer-events-none"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""} - ${STAR_LABELS[star]}`}
            >
              <Star
                style={{ width: size, height: size }}
                className={`transition-colors duration-150 ${
                  isFilled
                    ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_2px_4px_rgba(245,158,11,0.25)]"
                    : "fill-gray-100 text-gray-300 group-hover:text-gray-400"
                }`}
              />
            </button>
          );
        })}
      </div>
      <span className="h-5 text-sm font-semibold text-[#C86A37]">
        {activeRating > 0 ? `${STAR_LABELS[activeRating]} (${activeRating}/5)` : "Select a rating"}
      </span>
    </div>
  );
}

interface StarRatingDisplayProps {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
  showText?: boolean;
}

export function StarRatingDisplay({
  rating,
  max = 5,
  size = 18,
  className = "",
  showText = false,
}: StarRatingDisplayProps) {
  const rounded = Math.round(rating * 10) / 10;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, idx) => {
          const starVal = idx + 1;
          const isFull = starVal <= Math.floor(rounded);
          const isHalf = !isFull && starVal - 0.5 <= rounded;

          return (
            <div key={idx} className="relative">
              <Star
                style={{ width: size, height: size }}
                className={`${
                  isFull
                    ? "fill-[#F59E0B] text-[#F59E0B]"
                    : isHalf
                      ? "fill-[#F59E0B]/50 text-[#F59E0B]"
                      : "fill-gray-100 text-gray-300"
                }`}
              />
            </div>
          );
        })}
      </div>
      {showText ? (
        <span className="text-sm font-bold text-[#0a0f1c]">{rounded.toFixed(1)}</span>
      ) : null}
    </div>
  );
}
