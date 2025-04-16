document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    // API URL
    const API_URL = 'http://localhost:5000/api/users';

    try {
        // Fetch user data
        const response = await fetch(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();

        // Populate user data
        document.getElementById('userFirstName').textContent = userData.firstName;
        document.getElementById('firstName').value = userData.firstName;
        document.getElementById('lastName').value = userData.lastName;
        document.getElementById('email').value = userData.email;

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
                userRole: document.querySelector('input[name="userRole"]:checked')?.value,
                major: selectedMajor,
                coopStatus: document.querySelector('input[name="coopStatus"]:checked')?.value,
                notes: document.querySelector('textarea').value
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
                const response = await fetch(`${API_URL}/details`, {
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

                showSuccess('Details updated successfully!');
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
                const response = await fetch(`${API_URL}/availability`, {
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
