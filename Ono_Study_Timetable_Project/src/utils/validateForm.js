// utils/validateForm.js

export const validateStudentForm = (formData, existingStudents = [], options = {}) => {
  const errors = {};

  // בדיקת ID
  if (!formData.id) {
    errors.id = "ID is required";
  } else if (existingStudents.some((s) => s.id === formData.id)) {
    errors.id = "ID already exists";
  }

  // שם פרטי ומשפחה
  if (!formData.firstName?.trim()) {
    errors.firstName = "First name is required";
  }

  if (!formData.lastName?.trim()) {
    errors.lastName = "Last name is required";
  }

  // אימייל
  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
    errors.email = "Invalid email address";
  }

  // שם משתמש
  if (!formData.username) {
    errors.username = "Username is required";
  } else if (formData.username.length < 6) {
    errors.username = "Username must be at least 6 characters";
  }

  // סיסמה (אם לא מדלגים עליה)
  if (!options.skipPassword) {
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  return errors;
};
