// Authentication service for backend API calls

// Store token in memory and localStorage
let authToken = localStorage.getItem('authToken');

export function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
}

export function getAuthToken() {
    return authToken;
}

export function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('authToken');
}

export async function register(email, password) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'Registration failed');
        }

        const user = await response.json();
        return user;
    } catch (error) {
        throw error;
    }
}

export async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'Login failed');
        }

        const user = await response.json();
        return user;
    } catch (error) {
        throw error;
    }
}

export async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }
    } catch (error) {
        throw error;
    }
}

export async function getCurrentUser() {
    try {
        const headers = {};

        // Add Authorization header if we have a token
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch('/api/user', {
            credentials: 'include',
            headers: headers
        });

        if (!response.ok) {
            return null;
        }

        const user = await response.json();
        return user;
    } catch (error) {
        return null;
    }
}
