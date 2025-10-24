const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running postinstall checks for required dependencies...');

const requiredDependencies = [
    '@getbrevo/brevo',
    '@sendgrid/mail',  // keeping for backward compatibility during transition
    'razorpay',
    'mongoose'
];

function checkAndInstallDependency(packageName) {
    try {
        require.resolve(packageName);
        console.log(`✓ ${packageName} is installed`);
        return true;
    } catch (err) {
        console.log(`! ${packageName} is missing, attempting to install...`);
        try {
            execSync(`npm install ${packageName} --save`, { stdio: 'inherit' });
            console.log(`✓ ${packageName} installed successfully`);
            return true;
        } catch (installErr) {
            console.error(`✗ Failed to install ${packageName}:`, installErr.message);
            return false;
        }
    }
}

// Ensure all required dependencies are installed
const results = requiredDependencies.map(dep => ({
    name: dep,
    installed: checkAndInstallDependency(dep)
}));

const allInstalled = results.every(r => r.installed);
if (allInstalled) {
    console.log('✓ All required dependencies are installed');
} else {
    console.warn('! Some dependencies could not be installed. The application may not function correctly.');
    console.log('Missing packages:', results.filter(r => !r.installed).map(r => r.name).join(', '));
}

// Create directories if they don't exist
const requiredDirs = ['logs', 'temp'];
requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
});