# vagrant + docker

## 准备环境

- 宿主机：ubuntu18.04
  - VirtualBox
  - vagrant
- 虚拟机：ubuntu16.04

## 安装`VirtualBox`及`vagrant`

（略）

```sh
# https://community.oracle.com/docs/DOC-1022800
# https://github.com/oracle/vagrant-boxes/tree/master/Kubernetes
```

## 创建`vagrant`文件

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

## 提前下载虚拟机镜像文件

```sh
vagrant box add ubuntu/xenial64 \
    https://cloud-images.ubuntu.com/xenial/current/xenial-server-cloudimg-amd64-vagrant.box
```

## 一些有用的命令

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

## `ubuntu`国内源

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

## 安装`docker`

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
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# 设置daemon
# 备选：
# https://hub-mirror.c.163.com
# https://docker.mirrors.ustc.edu.cn
# https://dockerhub.azk8s.cn
# https://reg-mirror.qiniu.com
# https://mirror.ccs.tencentyun.com
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

## 安装 docker-compose （可选）

```sh
# sudo curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo curl -L https://get.daocloud.io/docker/compose/releases/download/1.23.2/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Test the installation.
docker-compose --version

# 可选操作
# If the command docker-compose fails after installation,
# check your path. You can also create a symbolic link to /usr/bin or any other directory in your path.
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 部署测试
docker-compose -f docker-compose-whoami.yaml up --scale whoami=2
```
