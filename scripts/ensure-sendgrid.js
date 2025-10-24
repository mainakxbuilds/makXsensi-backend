const { execSync } = require('child_process');
const fs = require('fs');

function ensureSendGrid() {
  try {
    require.resolve('@sendgrid/mail');
    console.log('@sendgrid/mail already installed');
    return;
  } catch (err) {
    console.warn('@sendgrid/mail not found. Attempting to install...');
  }

  try {
    // Install @sendgrid/mail synchronously. Use --prefer-offline to reduce network hits where possible.
    execSync('npm install @sendgrid/mail --no-audit --no-fund --silent', { stdio: 'inherit' });
    console.log('@sendgrid/mail installed successfully');
  } catch (installErr) {
    console.error('Failed to auto-install @sendgrid/mail during postinstall:', installErr && installErr.message ? installErr.message : installErr);
    // Do not throw — fail softly so postinstall doesn't break deploy completely.
  }
}

// Run when invoked
ensureSendGrid();
