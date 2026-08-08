variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "instance_type" { type = string; default = "t3.medium" }
variable "min_size" { type = number; default = 1 }
variable "max_size" { type = number; default = 5 }

resource "aws_security_group" "compute_sg" {
  name        = "${var.project_name}-compute-sg"
  description = "Security group for ArvCompute instances"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_launch_template" "arv_template" {
  name_prefix   = "${var.project_name}-template-"
  image_id      = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS
  instance_type = var.instance_type

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.compute_sg.id]
  }

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${var.project_name}-compute-instance" }
  }
}

resource "aws_autoscaling_group" "arv_asg" {
  name                = "${var.project_name}-asg"
  vpc_zone_identifier = var.private_subnet_ids
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.min_size

  launch_template {
    id      = aws_launch_template.arv_template.id
    version = "$Latest"
  }
}

output "asg_name" { value = aws_autoscaling_group.arv_asg.name }
