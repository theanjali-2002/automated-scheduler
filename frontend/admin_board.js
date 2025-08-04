import { API_BASE_URL } from './config.js';
document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const viewedUserId = urlParams.get('userId');
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    const API_URL = `${API_BASE_URL}/users`;
    const SCHEDULE_API_URL = `${API_BASE_URL}/schedule`;

    try {
        const endpoint = viewedUserId
            ? `${API_URL}/admin/profile/${viewedUserId}`
            : `${API_URL}/profile`;

        const response = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const adminData = await safeJsonResponse(response);
        if (!adminData) throw new Error('Failed to fetch admin data');

        // Populate admin data
        document.getElementById('adminFirstName').value = adminData.firstName;
        document.getElementById('adminLastName').value = adminData.lastName;
        document.getElementById('adminEmail').value = adminData.email;

        // Fetch current admin’s ID
        const selfRes = await fetch(`${API_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const selfData = await safeJsonResponse(selfRes);
        const currentUserId = selfData?._id;

        const isViewingAnotherAdmin = viewedUserId && viewedUserId !== currentUserId;

        if (isViewingAnotherAdmin) {
            // Hide dashboard
            document.getElementById('dashboardSection').classList.add('hidden');
            document.getElementById('adminControls')?.classList.add('hidden');
            document.getElementById('auditLogBtn')?.classList.add('hidden');

            // Show notice
            const noticeDiv = document.createElement('div');
            noticeDiv.className = 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded';
            noticeDiv.innerHTML = `
        <p class="font-semibold">Note:</p>
        <p>You are viewing another admin's profile.</p>
        <a href="/admin_board.html" class="mt-2 inline-block text-blue-600 underline hover:text-blue-800">Click here to return to your own profile</a>
    `;
            const container = document.querySelector('.max-w-6xl');
            container.insertBefore(noticeDiv, container.firstChild);
        }

        // Load mentor list 
        await loadMentorList(API_URL, token);
        await loadDashboardMetrics(API_URL, token);

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
                const endpoint = isViewingAnotherAdmin
                    ? `${API_URL}/admin/details/${viewedUserId}`
                    : `${API_URL}/profile`;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ firstName, lastName, email })
                });

                const result = await safeJsonResponse(response);

                if (!response.ok) {
                    throw new Error(result?.error || 'Failed to update details');
                }

                showSuccess('Details updated successfully!');
            } catch (error) {
                showError(error.message);
            }
        });

        // Add event listener for Generate Schedule button
        const generateBtn = document.getElementById('generateScheduleBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                if (!confirm("Are you sure you want to generate the schedule?")) {
                    return;
                }
                try {
                    const res = await fetch(`${SCHEDULE_API_URL}/generate`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData?.error || 'Failed to generate schedule');
                    }
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);

                    // Get filename from Content-Disposition header
                    const disposition = res.headers.get('Content-Disposition');
                    let fileName = 'schedule.xlsx';
                    if (disposition && disposition.includes('filename=')) {
                        fileName = disposition
                            .split('filename=')[1]
                            .replace(/["']/g, '')
                            .trim();
                    }

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    showSuccess('Schedule downloaded successfully!');
                } catch (err) {
                    showError(err.message);
                }
            });
        }

        const downloadBtn = document.getElementById('downloadAvailabilityBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                try {
                    const res = await fetch(`${SCHEDULE_API_URL}/availability-export`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err?.error || 'Failed to download availability');
                    }

                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const disposition = res.headers.get('Content-Disposition');
                    let fileName = 'availability.xlsx';
                    if (disposition && disposition.includes('filename=')) {
                        fileName = disposition.split('filename=')[1].replace(/["']/g, '');
                    }

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    showSuccess('Availability downloaded!');
                } catch (error) {
                    showError(error.message);
                }
            });
        }

        const exportMentorBtn = document.getElementById('exportMentorBtn');
        if (exportMentorBtn) {
            exportMentorBtn.addEventListener('click', async () => {
                if (!confirm("Are you sure you want to export mentor details?")) {
                    return;
                }
                try {
                    const res = await fetch(`${SCHEDULE_API_URL}/mentors-export`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err?.error || 'Failed to export mentor details');
                    }

                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);

                    const disposition = res.headers.get('Content-Disposition');
                    let fileName = 'mentors_export.xlsx';
                    if (disposition && disposition.includes('filename=')) {
                        fileName = disposition
                            .split('filename=')[1]
                            .replace(/["']/g, '')
                            .trim();
                    }

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    showSuccess('Mentor details exported successfully!');
                } catch (error) {
                    showError(error.message);
                }
            });
        }


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

// Fetch and render mentor list
async function loadMentorList(API_URL, token) {
    try {
        const res = await fetch(`${API_URL}/admin/data`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const users = await safeJsonResponse(res);
        if (!res.ok || !users) throw new Error('Failed to fetch mentor list');

        // Sort: admins first
        users.sort((a, b) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;
            return 0;
        });

        const tbody = document.querySelector('#mentorListSection tbody');
        tbody.innerHTML = ''; // Clear existing rows

        users.forEach(user => {
            const tr = document.createElement('tr');

            // Highlight admins with light red background
            tr.className = `border-t hover:bg-gray-50 transition ${user.role === 'admin' ? 'bg-red-100' : ''
                }`;

            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap">${user.firstName} ${user.lastName}</td>
                <td class="px-4 py-3 whitespace-nowrap">${user.email}</td>
                <td class="px-4 py-3">
                    <span class="text-sm font-medium text-white ${user.role === 'admin' ? 'bg-red-600' : 'bg-blue-500'
                } rounded px-2 py-1">${user.role}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm font-medium text-white rounded px-2 py-1 ${user.isComplete
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }">
                        ${user.isComplete ? 'Complete' : 'Incomplete'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <a href="${user.role === 'admin' ? `/admin_board.html?userId=${user._id}` : `/user_board.html?userId=${user._id}`}" class="text-red-600 hover:underline">View</a>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Mentor list error:', err);
        showError('Failed to load mentor list.');
    }
}

async function loadDashboardMetrics(API_URL, token) {
    try {
        const res = await fetch(`${API_URL}/admin/metrics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard metrics');

        document.querySelector('#dashboardSection').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="bg-white p-6 rounded shadow">
            <h3 class="font-semibold text-gray-700 mb-2">Total Mentors</h3>
            <p class="text-xl">${data.totalMentors}</p>
          </div>
          <div class="bg-white p-6 rounded shadow">
            <h3 class="font-semibold text-gray-700 mb-2">Team Leads</h3>
            <p class="text-xl">${data.teamLeads}</p>
          </div>
          <div class="bg-white p-6 rounded shadow">
            <h3 class="font-semibold text-gray-700 mb-2">On Co-op</h3>
            <p class="text-xl">${data.onCoop}</p>
          </div>
          <div class="bg-white p-6 rounded shadow">
            <h3 class="font-semibold text-gray-700 mb-2">Incomplete Profiles</h3>
            <p class="text-xl">${data.incompleteProfiles}</p>
          </div>
          <div class="bg-white p-6 rounded shadow col-span-2">
            <h3 class="font-semibold text-gray-700 mb-2">Majors Distribution</h3>
            <div class="text-sm space-y-1">
              ${Object.entries(data.majorsDistribution).map(([major, count]) => (
            `<p><strong>${major}</strong>: ${count}</p>`
        )).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
        console.error(err);
        showError('Failed to load dashboard metrics.');
    }
}


document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/index.html';
});
