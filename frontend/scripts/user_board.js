import { API_BASE_URL } from '/scripts/config.js';
document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    const isAdminView = !!userIdParam;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    // API URL
    const API_URL = `${API_BASE_URL}/users`;

    try {
        // Fetch user data
        const response = await fetch(
            isAdminView ? `${API_URL}/admin/profile/${userIdParam}` : `${API_URL}/profile`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();

        // Populate user data
        document.getElementById('userFirstName').textContent = userData.firstName;
        document.getElementById('firstName').value = userData.firstName;
        document.getElementById('lastName').value = userData.lastName;
        document.getElementById('email').value = userData.email;

        if (isAdminView) {
            const pageLabel = document.getElementById('pageModeLabel');
            if (pageLabel) {
                pageLabel.textContent = 'Admin is editing this user profile';
                pageLabel.classList.remove('hidden');
                pageLabel.classList.add('text-red-600');
            }
            // Update page heading
            document.getElementById('pageModeLabel').textContent = 'Admin is editing this user profile';

            // Hide original greeting
            const greeting = document.getElementById('userGreeting');
            if (greeting) greeting.classList.add('hidden');

            // Hide logout button (optional for admin editing mode)
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) logoutBtn.classList.add('hidden');

            // Add red admin banner
            const adminBanner = document.createElement('h1');
            adminBanner.textContent = "Admin is editing this user's profile";
            adminBanner.className = "text-2xl font-bold text-red-600 mb-4";
            document.querySelector('main')?.prepend(adminBanner);

            // Show back-to-admin link
            document.getElementById('adminBack').classList.remove('hidden');

            // Enable inputs for admin editing
            document.getElementById('firstName')?.removeAttribute('disabled');
            document.getElementById('lastName')?.removeAttribute('disabled');
            document.getElementById('email')?.removeAttribute('disabled');
            document.querySelector('input[type="text"][value="user"]')?.removeAttribute('disabled');
            document.querySelectorAll('input[disabled], textarea[disabled]').forEach(el => el.removeAttribute('disabled'));
            ['firstName', 'lastName', 'email'].forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.removeAttribute('disabled');
                    input.classList.remove('bg-gray-100');
                    input.classList.add('bg-white');
                }
            });
            // Explicitly keep userrole disabled
            const userroleInput = document.getElementById('userrole');
            if (userroleInput) {
                userroleInput.setAttribute('disabled', 'true');
                userroleInput.classList.add('bg-gray-100');
                userroleInput.classList.remove('bg-white');
            }
        }

        // Set major if exists
        if (userData.major) {
            const majorSelect = document.getElementById('majorDropdown');
            const majorOption = Array.from(majorSelect.options).find(option => option.value === userData.major);
            if (majorOption) {
                majorOption.selected = true;
                // Hide custom major input if visible
                const customMajorInput = document.getElementById('customMajor');
                customMajorInput.value = '';
                customMajorInput.classList.add('hidden');
            } else {
                // If major is not in dropdown, it might be a custom one
                const customMajorInput = document.getElementById('customMajor');
                customMajorInput.value = userData.major;
                majorSelect.value = 'Other (enter manually below)';
                customMajorInput.classList.remove('hidden');
            }
        }

        // Set user role if exists
        if (userData.userRole) {
            const roleRadio = document.querySelector(`input[name="userRole"][value="${userData.userRole}"]`);
            if (roleRadio) {
                roleRadio.checked = true;
            }
        }

        // Set co-op status if exists
        if (userData.coopStatus) {
            const coopRadio = document.querySelector(`input[name="coopStatus"][value="${userData.coopStatus}"]`);
            if (coopRadio) {
                coopRadio.checked = true;
                // Trigger change handler to disable availability if needed
                coopRadio.dispatchEvent(new Event('change'));
            }
        }

        // Set notes if exists
        if (userData.notes) {
            const notesTextarea = document.querySelector('textarea');
            if (notesTextarea) {
                notesTextarea.value = userData.notes;
            }
        }

        // Set availability if exists
        if (userData.availability) {
            userData.availability.forEach(day => {
                day.slots.forEach(slot => {
                    const checkbox = document.querySelector(`input[name="availability-${day.day}-${slot}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            });
        }

        // Handle form submission
        const detailsForm = document.querySelector('form');
        detailsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!confirm("Are you sure you want to make this change? Admins will be notified of the change made.")) {
                return;
            }

            const majorDropdown = document.getElementById('majorDropdown');
            const customMajor = document.getElementById('customMajor');
            let selectedMajor;

            if (majorDropdown.value === 'Other') {
                if (!customMajor.value.trim()) {
                    showError('Please enter your major');
                    return;
                }
                selectedMajor = customMajor.value.trim();
            } else {
                if (!majorDropdown.value) {
                    showError('Please select your major');
                    return;
                }
                selectedMajor = majorDropdown.value;
            }

            const formData = {
                firstName: document.getElementById('firstName')?.value.trim(),
                lastName: document.getElementById('lastName')?.value.trim(),
                email: document.getElementById('email')?.value.trim(),
                userRole: document.querySelector('input[name="userRole"]:checked')?.value,
                major: selectedMajor,
                coopStatus: document.querySelector('input[name="coopStatus"]:checked')?.value,
                notes: document.querySelector('textarea')?.value
            };

            // Validate required fields
            if (!formData.userRole) {
                showError('Please select your role (Peer Mentor or Team Lead & Peer Mentor)');
                return;
            }

            if (!formData.coopStatus) {
                showError('Please indicate your co-op status');
                return;
            }

            try {
                const response = await fetch(
                    isAdminView ? `${API_URL}/admin/details/${userIdParam}` : `${API_URL}/details`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(formData)
                    });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to update details');
                }

                showSuccess(isAdminView ? 'User profile updated successfully!' : 'Details updated successfully!');
            } catch (error) {
                showError(error.message);
            }
        });

        // Handle availability submission
        document.getElementById('availabilitySubmit').addEventListener('click', async () => {
            if (!confirm("Are you sure you want to make this change? Admins will be notified of the change made.")) {
                return;
            }

            const availability = [];
            days.forEach(day => {
                const slots = [];
                document.querySelectorAll(`input[data-day="${day}"]:checked`).forEach(checkbox => {
                    slots.push(checkbox.dataset.slot);
                });
                if (slots.length > 0) {
                    availability.push({ day, slots });
                }
            });

            try {
                const endpoint = isAdminView
                    ? `${API_URL}/admin/availability/${userIdParam}`
                    : `${API_URL}/availability`;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ availability })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to update availability');
                }

                showSuccess('Availability updated successfully!');
            } catch (error) {
                showError(error.message);
            }
        });

    } catch (error) {
        showError('Failed to load user data. Please try logging in again.');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 3000);
    }

    // Tooltip logic for disabled fields and info icons
    const tooltip = document.getElementById('tooltip');
    const tooltipMessage = "You can't modify this. If you have issues, reach out to the admin.";

    function showTooltip(e) {
        tooltip.textContent = tooltipMessage;
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY + 10 + 'px';
        tooltip.classList.remove('hidden');
    }

    function moveTooltip(e) {
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY + 10 + 'px';
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
    }

    // Select disabled inputs and info icons
    const disabledInputs = document.querySelectorAll('input[disabled]');
    const infoIcons = document.querySelectorAll('.info-icon');

    disabledInputs.forEach(input => {
        input.addEventListener('mouseenter', showTooltip);
        input.addEventListener('mousemove', moveTooltip);
        input.addEventListener('mouseleave', hideTooltip);
    });

    infoIcons.forEach(icon => {
        icon.addEventListener('mouseenter', showTooltip);
        icon.addEventListener('mousemove', moveTooltip);
        icon.addEventListener('mouseleave', hideTooltip);
    });
});

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

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/index.html';
});
