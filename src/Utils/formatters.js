/**
 * Format price with Vietnamese currency
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  if (!price || price === 0) return 'Miễn phí';
  try {
    return `${price.toLocaleString('vi-VN')}₫`;
  } catch {
    return 'Miễn phí';
  }
};

/**
 * Get difficulty badge configuration
 * @param {string} difficulty - Difficulty level
 * @param {boolean} isNew - Whether course is new
 * @returns {object} Badge configuration with label and color
 */
export const getDifficultyBadge = (difficulty, isNew = false) => {
  if (isNew) return { label: 'MỚI', color: '#3B82F6' };
  
  const diff = difficulty ? String(difficulty).toLowerCase() : '';
  switch (diff) {
    case 'easy':
      return { label: 'DỄ', color: '#10B981' };
    case 'medium':
      return { label: 'VỪA', color: '#F59E0B' };
    case 'hard':
      return { label: 'KHÓ', color: '#EF4444' };
    default:
      return { label: 'DỄ', color: '#10B981' };
  }
};

/**
 * Calculate progress percentage
 * @param {number} completedLessons - Number of completed lessons
 * @param {number} totalLessons - Total number of lessons
 * @param {number} progressPercentage - Direct progress percentage (if available)
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (completedLessons, totalLessons, progressPercentage = 0) => {
  if (progressPercentage > 0) return progressPercentage;
  if (totalLessons > 0) return (completedLessons / totalLessons) * 100;
  return 0;
};
