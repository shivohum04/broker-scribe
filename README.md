# BrokerScribe - Property Management System

A modern property management application for real estate brokers to organize and manage their property portfolios with media storage and hybrid video handling.

## Project info

**URL**: https://lovable.dev/projects/5d5bd479-68f5-4c7e-9ef6-7d376350b152
**Live Preview**: https://brokerlog.netlify.app

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5d5bd479-68f5-4c7e-9ef6-7d376350b152) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Features

### Core Functionality

- **Property Management**: Create, edit, and organize property listings
- **Media Storage**: Hybrid storage strategy for optimal performance and cost
- **Cover Thumbnails**: Automatic cover image selection and promotion
- **Local Video Storage**: Videos stored locally for cost efficiency
- **Image Compression**: Client-side compression with 50% quality and size caps
- **Responsive Design**: Mobile-first approach for broker field work

### Hybrid Storage Strategy

- **Images**: Compressed and stored in cloud storage (Supabase)
- **Videos**: Stored locally using IndexedDB/localforage
- **Thumbnails**: Generated and stored in cloud for fast loading
- **Cost Optimization**: Minimal cloud storage costs while maintaining performance

### iOS Considerations

⚠️ **Important**: On iOS devices, local video storage may be unreliable due to:

- Limited storage quotas
- Aggressive eviction policies
- Background processing restrictions

**Recommendations for iOS users**:

- Use desktop browsers for large video uploads
- Compress videos before uploading
- Consider cloud storage for critical videos

## What technologies are used for this project?

This project is built with:

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **Media Processing**: browser-image-compression, FFmpeg.wasm
- **Local Storage**: localforage (IndexedDB wrapper)
- **Authentication**: Supabase Auth
- **Deployment**: Netlify

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5d5bd479-68f5-4c7e-9ef6-7d376350b152) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
