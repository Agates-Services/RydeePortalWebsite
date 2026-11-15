import { Star } from "lucide-react";

export interface RatingStarsProps {
  rating: number;
}

export function RatingStars({ rating }: RatingStarsProps) {
  const filled = Math.max(0, Math.min(5, Math.floor(rating)));
  const label = rating.toFixed(1) + " out of 5";
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 align-middle" aria-label={label}>
      <span>
        {rating.toFixed(1)}
        <span className="text-base font-normal text-muted-foreground">/5</span>
      </span>
      <span className="inline-flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={i < filled ? "size-4 text-warning" : "size-4 text-muted-foreground/50"}
            fill={i < filled ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        ))}
      </span>
    </span>
  );
}
