output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = module.networking.vpc_id
}

output "eks_cluster_endpoint" {
  description = "Kubernetes API server control plane endpoint URL"
  value       = module.kubernetes.cluster_endpoint
}

output "eks_cluster_name" {
  description = "Managed EKS cluster identifier name"
  value       = module.kubernetes.cluster_name
}

output "rds_endpoint" {
  description = "PostgreSQL primary database endpoint URL"
  value       = module.database.db_endpoint
}

output "rds_port" {
  description = "PostgreSQL database port"
  value       = module.database.db_port
}
