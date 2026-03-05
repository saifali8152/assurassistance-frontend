// Date utility functions for consistent date/time formatting across the application

export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Format based on how recent the date is
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}w ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months}mo ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years}y ago`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatFullDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting full date:', error);
    return 'Invalid Date';
  }
};

export const formatDateOnly = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date only:', error);
    return 'Invalid Date';
  }
};

export const getPasswordChangeStatus = (forcePasswordChange: boolean | number | null | undefined): {
  status: 'changed' | 'pending' | 'unknown';
  text: string;
  color: string;
  bgColor: string;
} => {
  // Convert to boolean if it's a number (1 = true, 0 = false)
  const needsChange = typeof forcePasswordChange === 'number' ? forcePasswordChange === 1 : Boolean(forcePasswordChange);
  
  if (needsChange) {
    return {
      status: 'pending',
      text: 'Needs Change',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    };
  } else {
    return {
      status: 'changed',
      text: 'Changed',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    };
  }
};
