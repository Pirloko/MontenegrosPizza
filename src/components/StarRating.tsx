import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  showValue = false,
  interactive = false,
  onChange
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="d-flex align-items-center gap-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;
        const isPartial = !isFilled && starValue - 0.5 <= displayRating;

        return (
          <Star
            key={index}
            size={size}
            fill={isFilled ? '#ffc107' : isPartial ? '#ffc107' : 'none'}
            stroke={isFilled || isPartial ? '#ffc107' : '#dee2e6'}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              transition: 'all 0.2s',
              opacity: isPartial ? 0.5 : 1
            }}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
      {showValue && (
        <span className="ms-2 text-muted" style={{ fontSize: size * 0.8 }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

