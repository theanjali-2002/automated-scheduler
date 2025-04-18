document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    const API_URL = 'http://localhost:5000/api/users';

    try {
        const response = await fetch(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const adminData = await safeJsonResponse(response);
        if (!adminData) throw new Error('Failed to fetch admin data');

        // Populate admin data
        document.getElementById('adminFirstName').value = adminData.firstName;
        document.getElementById('adminLastName').value = adminData.lastName;
        document.getElementById('adminEmail').value = adminData.email;


        // Handle form submission
        const detailsForm = document.querySelector('form');
        detailsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!confirm("Are you sure you want to make this change? The change will be logged.")) {
                return;
            }

            const firstName = document.querySelector('input[name="adminFirstName"]')?.value.trim();
            const lastName = document.querySelector('input[name="adminLastName"]')?.value.trim();
            const email = document.querySelector('input[name="adminEmail"]')?.value.trim();

            // Validate required fields
            if (!firstName || !lastName || !email) {
                showError('All fields are required!');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/profile`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ firstName, lastName, email })
                });

                const result = await safeJsonResponse(response);
                console.log('DEBUG: Profile POST result:', result);
                if (!response.ok) {
                    throw new Error(result?.error || 'Failed to update details');
                }

                showSuccess('Details updated successfully!');
            } catch (error) {
                showError(error.message);
            }
        });

    } catch (error) {
        console.error(error);
        alert('Error loading admin data. Please try again.');
    }
});

/**
 * Utility to safely handle fetch response as JSON.
 * If the response is HTML, it avoids the "Unexpected token '<'" error.
 */
async function safeJsonResponse(response) {
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    } else {
        const raw = await response.text();
        console.warn('Expected JSON, received:', raw.slice(0, 100));
        return null;
    }
}

// Utility function to show error messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
    errorDiv.role = 'alert';
    errorDiv.innerHTML = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Utility function to show success messages
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
    successDiv.role = 'alert';
    successDiv.innerHTML = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}
