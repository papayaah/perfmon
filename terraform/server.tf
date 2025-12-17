# Server provisioning using cloud-init
# Run once on a fresh server: cloud-init clean && cloud-init init

resource "null_resource" "cloud_init" {
  # Triggers re-provisioning when cloud-init config changes
  triggers = {
    cloud_init_hash = filemd5("${path.module}/cloud-init.yaml")
  }

  connection {
    type        = "ssh"
    host        = var.server_ip
    user        = "root"
    private_key = file(var.ssh_private_key_path)
    timeout     = "5m"
  }

  # Copy cloud-init config to server
  provisioner "file" {
    source      = "${path.module}/cloud-init.yaml"
    destination = "/etc/cloud/cloud.cfg.d/99-perfmon.cfg"
  }

  # Run cloud-init
  provisioner "remote-exec" {
    inline = [
      "echo 'Running cloud-init...'",
      "cloud-init clean",
      "cloud-init init",
      "cloud-init modules --mode=config",
      "cloud-init modules --mode=final",
      "echo 'Cloud-init complete!'"
    ]
  }
}

# Configure nginx virtual host for perfmon
resource "null_resource" "nginx_vhost" {
  depends_on = [null_resource.cloud_init]

  # Triggers re-deployment when template or domain changes
  triggers = {
    template_hash = filemd5("${path.module}/templates/nginx-vhost.conf.tpl")
    domain        = var.domain
  }

  connection {
    type        = "ssh"
    host        = var.server_ip
    user        = "root"
    private_key = file(var.ssh_private_key_path)
    timeout     = "2m"
  }

  # Copy rendered nginx vhost configuration
  provisioner "file" {
    content     = templatefile("${path.module}/templates/nginx-vhost.conf.tpl", {
      domain = var.domain
    })
    destination = "/etc/nginx/sites-available/perfmon.conf"
  }

  # Enable site and reload nginx
  provisioner "remote-exec" {
    inline = [
      "ln -sf /etc/nginx/sites-available/perfmon.conf /etc/nginx/sites-enabled/perfmon.conf",
      "nginx -t",
      "systemctl reload nginx",
      "echo 'Nginx vhost configured for ${var.domain}'"
    ]
  }
}
