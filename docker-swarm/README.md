# docker swarm

## 准备环境

- 宿主机：ubuntu18.04
  - VirtualBox
  - vagrant
- 虚拟机：ubuntu16.04

### 安装`VirtualBox`及`vagrant`

（略）

```sh
# https://community.oracle.com/docs/DOC-1022800
# https://github.com/oracle/vagrant-boxes/tree/master/Kubernetes
```

### 创建`vagrant`文件

```Vagrantfile
Vagrant.configure("2") do |config|
    config.ssh.insert_key = false
    (0..1).each do |i|
        config.vm.define "node#{i}" do |node|
            node.vm.box = "ubuntu/xenial64"
            node.vm.hostname = "node#{i}"
            node.vm.network "private_network", ip: "192.168.60.#{i + 10}", netmask: "255.255.255.0"
            node.vm.provider "virtualbox" do |v|
                v.name = "node#{i}"
                v.memory = 1024
                v.gui = false
            end
            node.vm.provision :shell, inline: "sed 's/127\.0\.1\.1.*node.*/192\.168\.60\.#{i + 10} node#{i}/' -i /etc/hosts"
        end
    end
end
```

### 提前下载虚拟机镜像文件

```sh
vagrant box add ubuntu/xenial64 \
    https://cloud-images.ubuntu.com/xenial/current/xenial-server-cloudimg-amd64-vagrant.box
```

### 一些有用的命令

```sh
# 启动虚拟机
vagrant up

# 挂起虚拟机
vagrant suspend

# 恢复虚拟机
vagrant resume

# 登录各个虚拟机
vagrant ssh node0
vagrant ssh node1

# 切换root用户
sudo -Es
sudo su -

# 删除网卡
VBoxManage hostonlyif remove vboxnet0
```

### `ubuntu`国内源

```sh
# 备份
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 覆写
cat <<EOF | sudo tee /etc/apt/sources.list
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial-updates main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial-backports main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial-security main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial-security main restricted universe multiverse

# 预发布软件源，不建议启用
# deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial-proposed main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ xenial-proposed main restricted universe multiverse
EOF
```

### 安装`docker`

```sh
# 参考：https://docs.docker.com/install/linux/docker-ce/ubuntu/

# 移除旧版本（如有必要）
sudo apt-get remove docker docker-engine docker.io containerd runc

# 安装docker相关依赖
sudo apt-get update
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common

# 设置国内源
curl -fsSL http://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
  "deb [arch=amd64] http://mirrors.aliyun.com/docker-ce/linux/ubuntu \
  $(lsb_release -cs) \
  stable"

# 更新
sudo apt-get update

# 查看可用版本（可略）
apt-cache madison docker-ce
apt-cache madison docker-ce-cli

# 安装
# sudo apt-get install docker-ce=18.06.2~ce~3-0~ubuntu
# sudo apt-get install -y docker-ce=5:18.09.0~3-0~ubuntu-xenial docker-ce-cli=5:18.09.0~3-0~ubuntu-xenial containerd.io
sudo apt-get install docker-ce docker-ce-cli containerd.io

# 设置daemon
# 备选：http://hub-mirror.c.163.com
cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "registry-mirrors": ["https://registry.docker-cn.com"]
}
EOF

# 重启docker
sudo systemctl daemon-reload && sudo systemctl restart docker

# 测试是否安装成功
sudo docker run hello-world
```

## docker swarm 配置

### 设置 hostname

```sh
export USE_HOSTNAME=dog.example.com

# Set up the server hostname
echo $USE_HOSTNAME > /etc/hostname
hostname -F /etc/hostname
```

### Set up swarm mode

```sh
# 初始化
docker swarm init
# 如果出错
# Error response from daemon: could not choose an IP address
# to advertise since this system has multiple addresses on
# interface eth0 (138.68.58.48 and 10.19.0.5) -
# specify one with --advertise-addr
docker swarm init --advertise-addr 192.168.60.10

# 输出类似
Swarm initialized: current node (c52wz7uabjw5c0ver6xet5rna) is now a manager.
To add a worker to this swarm, run the following command:
    docker swarm join --token SWMTKN-1-4aqipbyi6h1va15no1j4fb58b2glmty7clv4funzu6i50bq248-0rw10ebrl2vwhphagbj6gpe5r 192.168.60.10:2377
To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.

# 查看manager加入连接
docker swarm join-token manager
# 查看worker加入连接
docker swarm join-token worker

# 检查节点
docker node ls
```

## Traefik && Consul

参考：https://dockerswarm.rocks/traefik/

### Preparation

```sh
# Create a network that will be shared with Traefik and the containers
# that should be accessible from the outside, with:
docker network create --driver=overlay traefik-public
# ivr72vnkhsejaguf212ei51uk

# Create an environment variable with your email,
# to be used for the generation of Let's Encrypt certificates:
export EMAIL=admin@example.com

# Create an environment variable with the domain you want to use
# for the Traefik UI (user interface) and the Consul UI of the host, e.g.:
export DOMAIN=sys.example.com
# You will access the Traefik UI at traefik.<your domain>, e.g. traefik.sys.example.com
# and the Consul UI at consul.<your domain>, e.g. consul.sys.example.com.
# So, make sure that your DNS records point traefik.<your domain>
# and consul.<your domain> to one of the IPs of the cluster.

# If you have several nodes (several IP addresses),
# you might want to create the DNS records for multiple of those IP addresses.

# Create an environment variable with a username
# (you will use it for the HTTP Basic Auth for Traefik and Consul UIs), for example:
export USERNAME=admin
# Create an environment variable with the password, e.g.:
export PASSWORD=123456
# Use openssl to generate the "hashed" version
# of the password and store it in an environment variable:
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
# You can check the contents with:
echo $HASHED_PASSWORD

# Create an environment variable with the number of replicas
# for the Consul service (if you don't set it, by default it will be 3):
export CONSUL_REPLICAS=2
# If you have a single node, you can set CONSUL_REPLICAS to 0,
# that way you will only have the Consul "leader",
# you don't need the replicas if you don't have other nodes yet:
export CONSUL_REPLICAS=0

# Create an environment variable with the number of replicas
# for the Traefik service (if you don't set it, by default it will be 3):
export TRAEFIK_REPLICAS=1
# if you want to have one replica per node in your cluster, you can set it like this:
export TRAEFIK_REPLICAS=$(docker node ls -q | wc -l)
# if you have a single node, you can set TRAEFIK_REPLICAS to 1:
export TRAEFIK_REPLICAS=1
```

### 部署 traefik-consul

```sh
# 下载模板文件
curl -L dockerswarm.rocks/traefik.yml -o traefik.yml

# docker stack deploy -c traefik.yml traefik-consul
docker stack deploy -c traefik.yml traefik-consul

# Check if the stack was deployed with:
docker stack ps traefik-consul

# You can check the Traefik logs with:
docker service logs traefik-consul_traefik

# Check the user interfaces
# https://traefik.<your domain>
# https://consul.<your domain>
```

### 其他

If you need to read the client IP in your applications/stacks
using the X-Forwarded-For or X-Real-IP headers provided by Traefik,
you need to make Traefik listen directly,
not through Docker Swarm mode,
even while being deployed with Docker Swarm mode.

```yaml
ports:
  - 80:80
  - 443:443
```

修改配置文件修改为

```yaml
ports:
  - target: 80
    published: 80
    mode: host
  - target: 443
    published: 443
    mode: host
```

```sh
# 或者下载修改好的文件
curl -L dockerswarm.rocks/traefik-host.yml -o traefik-host.yml

# 然后部署
docker stack deploy -c traefik-host.yml traefik-consul
```

## 部署一个服务

### 安装 docker-compose

```sh
sudo curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# If the command docker-compose fails after installation, 
# check your path. You can also create a symbolic link to /usr/bin or any other directory in your path.
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Test the installation.
docker-compose --version
```

### 创建 `docker-compose-whoami.yaml` 文件

```yml
version: "3"

services:
  whoami:
    # A container that exposes an API to show its IP address
    image: containous/whoami
    labels:
      - "traefik.enable=true"
      - "traefik.frontend.rule=Host(`whoami.localhost`)"
```

### 部署服务

```sh
# docker-compose -f docker-compose-whoami.yaml up --scale whoami=2
docker stack deploy -c docker-compose-whoami.yml traefik-consul

# 本机测试
curl -H Host:whoami.localhost http://127.0.0.1
```
