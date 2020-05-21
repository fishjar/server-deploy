# docker swarm

## 设置 hostname (可略)

```sh
export USE_HOSTNAME=dog.example.com

# Set up the server hostname
echo $USE_HOSTNAME > /etc/hostname
hostname -F /etc/hostname
```

## 设置 swarm

```sh
# 初始化
docker swarm init
# 如果出错
# Error response from daemon: could not choose an IP address
# to advertise since this system has multiple addresses on
# interface eth0 (138.68.58.48 and 10.19.0.5) -
# specify one with --advertise-addr
docker swarm init --advertise-addr 192.168.60.10

# 查看manager加入连接
docker swarm join-token manager
# 查看worker加入连接
docker swarm join-token worker

# 检查节点
docker node ls
# Run docker info to view the current state of the swarm:
docker info


# 部署集群服务
docker stack deploy -c bb-stack.yaml demo
# 查看集群服务
docker stack ls
# 移除集群服务
docker stack rm demo
```

## 配置 Traefik && Consul

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
