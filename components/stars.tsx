// Five stars, filled by a clipped overlay so 4.3 really looks like 4.3.
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(5, value)) * 20;
  return (
    <span className="stars" style={{ fontSize: size }} aria-hidden="true">
      <span className="stars-bg">★★★★★</span>
      <span className="stars-fg" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

// Stars plus the numbers, the way a product shows its score in a list.
export function Score({ rating, reviews, size = 14 }: { rating: number; reviews: number; size?: number }) {
  if (!reviews) return <span className="score score-none">no reviews yet</span>;
  return (
    <span className="score" aria-label={`${rating.toFixed(1)} out of 5 from ${reviews} review${reviews === 1 ? "" : "s"}`}>
      <Stars value={rating} size={size} />
      <b>{rating.toFixed(1)}</b>
      <small>({reviews})</small>
    </span>
  );
}
