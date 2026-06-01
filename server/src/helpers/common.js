export const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isPasswordValid = (password) => {
    if (!password) return false;

    const passwordRegex =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    return passwordRegex.test(password);
};

export const isPhoneValid = (phone) => {
    if (!phone) return false;
    return /^\+[1-9]\d{6,14}$/.test(phone.trim());
};

export const PASSWORD_VALIDATION_MESSAGE =
    "Password must be at least 8 characters and include an uppercase letter, a number, and a special character";