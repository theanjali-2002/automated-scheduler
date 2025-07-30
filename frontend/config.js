// Determine environment based on the browser hostname
const hostname = window.location.hostname;

let ENV;
if (hostname.includes('localhost')) {
  ENV = 'development';
} else if (hostname.includes('staging')) {
  ENV = 'staging';
} else {
  ENV = 'production';
}

const API_BASE_URL = {
  development: 'http://localhost:5000/api',
  staging: 'https://automated-scheduler-staging.onrender.com/api',
  production: 'https://sssc-automated-scheduler.onrender.com/api'
}[ENV];

export { API_BASE_URL };
