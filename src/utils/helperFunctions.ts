export function isValidPassword(password: string) {
    // Regular expressions for each requirement
    const hasLetter = /[a-zA-Z]/; // At least one letter
    const hasNumber = /\d/; // At least one number
    const hasSpecialChar = /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/; // At least one special character from the list
    const minLength = 8; // Minimum length of 8 characters

    // Check each condition and return an appropriate message if not met
    if (password.length <= minLength) {
        return {
            isValid: false,
            message: "Password must be more than 8 characters long."
        };
    }
    if (!hasLetter.test(password)) {
        return {
            isValid: false,
            message: "Password must contain at least one letter."
        };
    }
    if (!hasNumber.test(password)) {
        return {
            isValid: false,
            message: "Password must contain at least one number."
        };
    }
    if (!hasSpecialChar.test(password)) {
        return {
            isValid: false,
            message: "Password must contain at least one special character."
        };
    }

    // If all conditions are met
    return {
        isValid: true,
        message: "Password is valid."
    };
}
