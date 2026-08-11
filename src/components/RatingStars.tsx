import { Star } from "lucide-react";

export interface RatingStarsProps {
  rating: number;
}

export function RatingStars({ rating }: RatingStarsProps) {
  const filled = Math.max(0, Math.min(5, Math.floor(rating)));
  const label = rating.toFixed(1) + " out of 5";
  return (
    <span className="inline-flex items-center gap-2 align-middle" aria-label={label}>
      <span className="inline-flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={i < filled ? "h-6 w-6 text-warning" : "h-6 w-6 text-muted-foreground"}
            fill={i < filled ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        ))}
      </span>
      <span className="text-2xl font-bold text-warning">{rating.toFixed(1) + "/5"}</span>
    </span>
  );
}
