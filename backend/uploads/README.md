# Uploads Directory

This directory stores uploaded images when Cloudinary is not configured.

## How it works:
- When users upload images through the Report Issue form, they are stored here
- Files are named with timestamp and original filename
- Only JPEG, PNG, and WebP files are allowed
- Maximum file size is 5MB
- Maximum 5 files per upload

## Current Status:
✅ Upload directory is properly configured
✅ Middleware is set up for file handling
✅ Backend server can serve static files from this directory

To test uploads:
1. Go to /report-issue page
2. Select images to upload
3. Submit an issue
4. Images will appear in this directory