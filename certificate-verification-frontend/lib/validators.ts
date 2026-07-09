// Strict Structural Input Validation Rules

export const validators = {
  // National ID must contain exactly 16 numeric digits
  nationalId: (value: string): { valid: boolean; error?: string } => {
    const cleanValue = value.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanValue)) {
      return { valid: false, error: 'National ID must be exactly 16 numeric digits' };
    }
    return { valid: true };
  },

  // Graduation Year must be 4-digit integer between 2000 and current year
  graduationYear: (value: string | number): { valid: boolean; error?: string } => {
    const year = typeof value === 'string' ? parseInt(value, 10) : value;
    const currentYear = new Date().getFullYear();
    
    if (isNaN(year) || year < 2000 || year > currentYear) {
      return { 
        valid: false, 
        error: `Graduation year must be between 2000 and ${currentYear}` 
      };
    }
    return { valid: true };
  },

  // Email must match RFC 2822 formatting
  email: (value: string): { valid: boolean; error?: string } => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true };
  },

  // Student ID validation (basic check)
  studentId: (value: string): { valid: boolean; error?: string } => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Student ID is required' };
    }
    return { valid: true };
  },

  // Phone number validation (basic check)
  phone: (value: string): { valid: boolean; error?: string } => {
    const cleanValue = value.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleanValue)) {
      return { valid: false, error: 'Invalid phone number format' };
    }
    return { valid: true };
  },

  // OTP validation (6 digits)
  otp: (value: string): { valid: boolean; error?: string } => {
    if (!/^\d{6}$/.test(value)) {
      return { valid: false, error: 'OTP must be exactly 6 digits' };
    }
    return { valid: true };
  },
};

export default validators;
