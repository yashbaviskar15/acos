variable "aws_region" {
  description = "Target AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "aravanta-cloudos"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "db_instance_class" {
  description = "Database instance compute tier"
  type        = string
  default     = "db.t3.medium"
}

variable "eks_node_count" {
  description = "Initial number of EKS worker nodes"
  type        = number
  default     = 3
}
