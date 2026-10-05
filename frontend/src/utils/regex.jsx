export const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export const nameRegex =
  /^[A-Za-z]+(?:\s[A-Za-z]+)*$/

export const phoneRegex =
  /^[6-9]\d{9}$/

export const addressRegex =
  /^[A-Za-z0-9\s,.'#/-]{5,250}$/