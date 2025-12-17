# Cloudflare DNS configuration (optional)
# Set enable_cloudflare_dns = false in terraform.tfvars to skip

# Data source to get the zone ID
data "cloudflare_zone" "main" {
  count = var.enable_cloudflare_dns ? 1 : 0
  name  = local.cloudflare_zone
}

# DNS A record pointing to the server
resource "cloudflare_record" "perfmon" {
  count   = var.enable_cloudflare_dns ? 1 : 0
  zone_id = data.cloudflare_zone.main[0].id
  name    = local.subdomain
  content = var.server_ip
  type    = "A"
  ttl     = var.cloudflare_proxy_enabled ? 1 : 300  # 1 = automatic when proxied
  proxied = var.cloudflare_proxy_enabled

  comment = "Perfmon Lighthouse performance monitor"
}
