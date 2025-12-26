# Deployment Guide for Hetzner Cloud

This guide will help you deploy the GallinaApp to a Hetzner Cloud VPS.

## Prerequisites

1.  **Hetzner Cloud Account**: Create an account and a new project.
2.  **Domain Name (Optional)**: If you want to access the app via a domain (e.g., `app.gallina.com`) instead of an IP address.

## Step 1: Create a Server

1.  Go to the Hetzner Cloud Console.
2.  Click **Add Server**.
3.  **Location**: Choose a location close to your users (e.g., Falkenstein or Nuremberg).
4.  **Image**: Choose **Ubuntu 22.04** or **24.04**.
5.  **Type**: **Standard** -> **CX22** (2 vCPU, 4 GB RAM) is a great starting point.
6.  **SSH Key**: Add your SSH public key for secure access.
7.  **Name**: Give it a name like `gallina-app`.
8.  Click **Create & Buy**.

## Step 2: Connect to your Server

Open your terminal and SSH into the server using the IP address displayed in the console:

```bash
ssh root@<YOUR_SERVER_IP>
```

## Step 3: Install Docker

Run the following commands on your server to install Docker and Docker Compose:

```bash
# Update repositories
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
docker compose version
```

## Step 4: Deploy the Application

You can transfer your files to the server using `git` (recommended) or `scp`.

### Option A: Using Git (Recommended)

1.  Push your code to a repository (GitHub/GitLab).
2.  Clone it on the server:

```bash
git clone <YOUR_REPO_URL> app
cd app
```

### Option B: Manual Upload

If you don't use git, you can copy the files from your local machine:

```bash
# Run this from your local project folder
scp -r . root@<YOUR_SERVER_IP>:/root/app
```

## Step 5: Configure Environment

1.  Enter the app directory on the server:
    ```bash
    cd /root/app
    ```
2.  Create the production environment file:
    ```bash
    cp .env.example .env
    ```
3.  Edit the file with your secure passwords:
    ```bash
    nano .env
    ```
    *Change `DB_PASSWORD`, `JWT_SECRET`, and `DOMAIN_NAME`.*

## Step 6: Start the Application

Run the application in detached mode:

```bash
docker compose up -d --build
```

## Step 7: Verify

Open your browser and visit:
`http://<YOUR_SERVER_IP>`

You should see the GallinaApp login screen!

## Troubleshooting

-   **Check logs**: `docker compose logs -f`
-   **Restart containers**: `docker compose restart`
-   **Rebuild after changes**: `docker compose up -d --build`
