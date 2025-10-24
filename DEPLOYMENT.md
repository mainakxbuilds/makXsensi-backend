# Deployment Guide for makxsensi-backend

## Environment Variables
Make sure to set these environment variables in your deployment platform:

```
PORT=3000
MONGODB_URI=your_mongodb_uri
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
FRONTEND_URL=your_frontend_url
NODE_ENV=production
BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=iammak.contact@gmail.com
```

## Deployment Steps

1. Install Dependencies
   ```bash
   npm install
   ```
   - The postinstall script will automatically check and install required dependencies
   - Required directories (logs, temp) will be created automatically

2. Environment Setup
   - Set the environment variables listed above in your deployment platform
   - For Netlify: Set in Site settings → Build & deploy → Environment variables
   - For other platforms: Follow their respective environment variable configuration guides

3. Build Configuration
   - The project uses Node.js
   - Minimum Node.js version: 14.x (recommended: 18.x or higher for better performance)
   - Start command: `npm start`

4. Health Checks
   - GET `/api/health` - Returns server status
   - GET `/api/debug/test-email` - Tests email functionality (protected route)

## Email Service (Brevo/Sendinblue)
1. Verify sender email (iammak.contact@gmail.com) in Brevo dashboard
2. Set BREVO_API_KEY in environment variables
3. Test email sending after deployment

## Troubleshooting
1. If emails fail to send:
   - Check BREVO_API_KEY is set correctly
   - Verify sender email is verified in Brevo
   - Check server logs for detailed error messages

2. If MongoDB fails to connect:
   - Verify MONGODB_URI is correct
   - Check IP whitelist in MongoDB Atlas

3. For other issues:
   - Check application logs
   - Verify all environment variables are set
   - Ensure dependencies are installed (npm install)