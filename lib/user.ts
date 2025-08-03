// --- Utility functions for managing the user's name in local storage ---

const USERNAME_KEY = 'pinky-type-username';

export const getUsername = (): string | null => {
    try {
        return localStorage.getItem(USERNAME_KEY);
    } catch (error) {
        console.error("Could not access localStorage:", error);
        return null;
    }
};

export const setUsername = (name: string): void => {
    try {
        localStorage.setItem(USERNAME_KEY, name);
    } catch (error) {
        console.error("Could not access localStorage:", error);
    }
};
