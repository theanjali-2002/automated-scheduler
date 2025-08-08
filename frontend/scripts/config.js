// Determine environment based on the browser hostname
const hostname = window.location.hostname;
console.log('Detected Hostname:', hostname);

let ENV = 'development';
if (hostname.includes('localhost')) {
  ENV = 'development';
} else if (hostname.includes('staging')) {
  ENV = 'staging';
} else {
  ENV = 'production';
}

console.log('Detected Environment:', ENV);

const API_BASE_URL = {
  development: 'http://localhost:5000/api',
  staging: 'https://automated-scheduler-staging.onrender.com/api',
  production: 'https://sssc-automated-scheduler.onrender.com/api'
}[ENV];

console.log('API Base URL:', API_BASE_URL);

export { API_BASE_URL };
