# Perfmon Terraform Configuration

This Terraform configuration provisions an Ubuntu 24.04 server and optionally sets up Cloudflare DNS for the Perfmon Lighthouse performance monitor.

## What This Does

1. **Server Provisioning** (via cloud-init) - Installs and configures:
   - Docker & Docker Compose
   - Nginx (host-level reverse proxy)
   - UFW firewall (ports 22, 80, 443)
   - Fail2ban for SSH protection
   - System optimizations for Docker/Chrome

2. **Cloudflare DNS** (optional) - Creates:
   - A record pointing your domain to the server

## Prerequisites

1. **Terraform** - Install from https://terraform.io
   ```bash
   # macOS
   brew install terraform
   ```

2. **SSH Access** - Ensure you can SSH to your server:
   ```bash
   ssh root@<your-server-ip>
   ```
   If you haven't added your SSH key yet:
   ```bash
   ssh-copy-id root@<your-server-ip>
   ```

3. **Cloudflare API Token** (optional) - Create at https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit zone DNS" template
   - Select your zone
   - Copy the generated token

## Quick Start

```bash
cd terraform

# 1. Create your variables file
cp terraform.tfvars.example terraform.tfvars

# 2. Edit terraform.tfvars with your values
#    - server_ip: your server's IP address
#    - domain: your full domain (e.g., perfmon.example.com)
#    - cloudflare_api_token: your Cloudflare token (if using Cloudflare)

# 3. Initialize Terraform
terraform init

# 4. Preview changes
terraform plan

# 5. Apply configuration (provisions server + creates DNS)
terraform apply

# 6. Deploy the application
cd ..
./deploy.sh
```

## Files

```
terraform/
├── main.tf                  # Provider configuration
├── variables.tf             # Variable definitions
├── terraform.tfvars.example # Example variables (copy to terraform.tfvars)
├── server.tf                # Server provisioning resources
├── cloudflare.tf            # Cloudflare DNS configuration (optional)
├── outputs.tf               # Output values
├── cloud-init.yaml          # Server setup configuration
└── templates/
    └── nginx-vhost.conf.tpl # Nginx virtual host template
```

## Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `server_ip` | Target server IP address | Yes |
| `domain` | Full domain name (e.g., `perfmon.example.com`) | Yes |
| `ssh_private_key_path` | Path to SSH private key | No (default: `~/.ssh/id_rsa`) |
| `enable_cloudflare_dns` | Create Cloudflare DNS record | No (default: `true`) |
| `cloudflare_api_token` | Cloudflare API token | If using Cloudflare |
| `cloudflare_proxy_enabled` | Enable Cloudflare proxy (orange cloud) | No (default: `true`) |

## Commands

```bash
# Initialize (first time only)
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# Re-run cloud-init (if cloud-init.yaml changes)
terraform apply -replace="null_resource.cloud_init"

# Destroy all resources (careful!)
terraform destroy

# Show current state
terraform show

# Show outputs
terraform output
```

## After Terraform Apply

Once Terraform completes:

1. DNS propagation takes a few minutes (if using Cloudflare)
2. Test DNS: `dig <your-domain>`
3. Deploy the app: `./deploy.sh`
4. Access at: `http://<your-domain>`

## Troubleshooting

### SSH Connection Refused
```bash
# Check if server is reachable
ping <your-server-ip>

# Try SSH with verbose output
ssh -v root@<your-server-ip>
```

### Terraform State Issues
```bash
# If state is corrupted, you can import existing resources
terraform import cloudflare_record.perfmon <zone_id>/<record_id>
```

### DNS Not Resolving
```bash
# Check Cloudflare record was created
dig @1.1.1.1 <your-domain>

# Wait for propagation (up to 5 minutes with TTL 300)
```

## Without Cloudflare

If you manage DNS elsewhere, set in your `terraform.tfvars`:

```hcl
enable_cloudflare_dns = false
```

Then manually create an A record pointing your domain to your server IP.
