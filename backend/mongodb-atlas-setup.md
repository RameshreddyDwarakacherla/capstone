# MongoDB Atlas Setup Guide

## Steps to Set Up MongoDB Atlas:

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Sign up/Log in** with your account
3. **Create a New Project** (if needed)
4. **Build a Database** (Free tier is fine for development)
5. **Choose AWS/Google Cloud/Azure** (any region close to you)
6. **Create a Database User**:
   - Username: `ramesh` (or any username you prefer)
   - Password: Generate a secure password
7. **Add IP Address**: 
   - Click "Add IP Address"
   - Choose "Add My Current IP Address" or "Allow Access from Anywhere" (0.0.0.0/0) for development
8. **Get Connection String**:
   - Go to your cluster
   - Click "Connect"
   - Choose "Connect your application"
   - Select "Node.js" as driver
   - Copy the connection string
   - It should look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/civic-reporter?retryWrites=true&w=majority`

## Update Your .env File:

Replace the MONGODB_URI in your .env file with the new connection string:

```
MONGODB_URI=mongodb+srv://ramesh:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/civic-reporter?retryWrites=true&w=majority
```

Remember to replace:
- `YOUR_PASSWORD` with your actual password
- `YOUR_CLUSTER` with your actual cluster name