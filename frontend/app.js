// Handle both login and signup functionality
document.addEventListener('DOMContentLoaded', function () {
    // Get the forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    const API_URL = window.location.hostname.includes('localhost')
        ? 'http://localhost:5000/api/users'
        : 'https://automated-scheduler.onrender.com/api/users';

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: document.getElementById('email-login').value,
                        password: document.getElementById('password-login').value
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                // Store the token in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.user.role);

                // Redirect based on user role
                if (data.user.role === 'admin') {
                    window.location.href = 'admin_board.html';
                } else {
                    window.location.href = 'user_board.html';
                }

            } catch (error) {
                showError(error.message);
            }
        });
    }

    // Handle Signup
    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form values
            const formData = {
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                email: document.getElementById('email-signup').value,
                password: document.getElementById('password-signup').value,
                signupCode: document.getElementById('signup-code').value,
                role: 'user' // Default role
            };

            // Validate password match
            const retypePassword = document.getElementById('retype-password').value;
            if (formData.password !== retypePassword) {
                showError('Passwords do not match');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Signup failed');
                }

                // Show success message
                showSuccess('Account created successfully! Redirecting to login...');

                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);

            } catch (error) {
                showError(error.message);
            }
        });
    }

    // Utility function to show error messages
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4';
        errorDiv.role = 'alert';
        errorDiv.innerHTML = message;

        // Remove any existing error messages
        const existingError = document.querySelector('[role="alert"]');
        if (existingError) {
            existingError.remove();
        }

        // Insert error message after the form
        const form = document.querySelector('form');
        form.parentNode.insertBefore(errorDiv, form.nextSibling);

        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Utility function to show success messages
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4';
        successDiv.role = 'alert';
        successDiv.innerHTML = message;

        // Remove any existing messages
        const existingMessage = document.querySelector('[role="alert"]');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Insert success message after the form
        const form = document.querySelector('form');
        form.parentNode.insertBefore(successDiv, form.nextSibling);

        // Remove success message after 5 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}); 