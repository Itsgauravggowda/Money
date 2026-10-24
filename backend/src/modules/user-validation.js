
export function validateRegistration({
    name,
    email,
    password
}) {
    if (
        typeof name !== 'string' ||
        name.trim().length < 2
    ) {
        throw new Error(
            'Name must contain at least 2 characters'
        );
    }

    if (
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        throw new Error('A valid email address is required');
    }

    if (
        typeof password !== 'string' ||
        password.length < 8
    ) {
        throw new Error(
            'Password must contain at least 8 characters'
        );
    }

    return {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
    };
}
