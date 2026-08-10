# =====================================================================
# Aravanta CloudOS — Terraform Infrastructure as Code (IaC) Architecture
# =====================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Remote backend configuration stub
  # backend "s3" {
  #   bucket         = "aravanta-tf-state"
  #   key            = "cloudos/production/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "aravanta-tf-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Aravanta-CloudOS-IaC"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# Module 1: Networking (VPC, Subnets, Gateways, Route Tables)
module "networking" {
  source       = "./modules/networking"
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = "10.0.0.0/16"
}

# Module 2: Compute Engine (Auto Scaling Group, EC2 Launch Template)
module "compute" {
  source             = "./modules/compute"
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  instance_type      = "t3.medium"
  min_size           = 1
  max_size           = 5
}

# Module 3: Managed Kubernetes Engine (EKS Cluster & Worker Nodes)
module "kubernetes" {
  source             = "./modules/kubernetes"
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  cluster_version    = "1.30"
  node_count         = var.eks_node_count
}

# Module 4: Managed Database Engine (RDS PostgreSQL)
module "database" {
  source             = "./modules/database"
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  instance_class     = var.db_instance_class
  allocated_storage  = 100
}
