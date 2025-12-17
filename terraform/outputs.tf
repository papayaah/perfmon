# Outputs for Perfmon Terraform configuration

output "server_ip" {
  description = "The IP address of the provisioned server"
  value       = var.server_ip
}

output "domain" {
  description = "The full domain name for the perfmon service"
  value       = var.domain
}

output "dns_record_id" {
  description = "The Cloudflare DNS record ID"
  value       = var.enable_cloudflare_dns ? cloudflare_record.perfmon[0].id : null
}

output "dns_record_hostname" {
  description = "The full hostname of the DNS record"
  value       = var.enable_cloudflare_dns ? cloudflare_record.perfmon[0].hostname : null
}

output "api_endpoint" {
  description = "The API endpoint URL"
  value       = "http://${var.domain}/api"
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh root@${var.server_ip}"
}

output "deploy_command" {
  description = "Command to deploy the application"
  value       = "./deploy.sh"
}
