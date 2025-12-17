# Variables for Perfmon Terraform configuration
# All values must be provided via terraform.tfvars

variable "server_ip" {
  description = "IP address of the target server"
  type        = string
}

variable "ssh_private_key_path" {
  description = "Path to SSH private key for server access"
  type        = string
  default     = "~/.ssh/id_rsa"
}

variable "domain" {
  description = "Full domain name for the service, e.g., 'perfmon.example.com'"
  type        = string
}

# Cloudflare settings (optional - set enable_cloudflare_dns = false to skip)
variable "enable_cloudflare_dns" {
  description = "Whether to create Cloudflare DNS record"
  type        = bool
  default     = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions (required if enable_cloudflare_dns = true)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_proxy_enabled" {
  description = "Whether to proxy traffic through Cloudflare (enables DDoS protection, hides origin IP)"
  type        = bool
  default     = true
}

# Computed values
locals {
  # Extract zone from domain (e.g., "perfmon.example.com" -> "example.com")
  domain_parts    = split(".", var.domain)
  cloudflare_zone = join(".", slice(local.domain_parts, length(local.domain_parts) - 2, length(local.domain_parts)))
  subdomain       = join(".", slice(local.domain_parts, 0, length(local.domain_parts) - 2))
}
