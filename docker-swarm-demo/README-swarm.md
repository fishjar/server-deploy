# docker swarm

## 创建集群

```sh
# 初始化
docker swarm init
# 如果出错
# Error response from daemon: could not choose an IP address
# to advertise since this system has multiple addresses on
# interface eth0 (138.68.58.48 and 10.19.0.5) -
# specify one with --advertise-addr
docker swarm init --advertise-addr 192.168.60.10

# To create a default IP address pool with a /16 (class B)
# for the 10.20.0.0 and 10.30.0.0 networks,
# and to create a subnet mask of /26 for each network looks like this
docker swarm init --default-addr-pool 10.20.0.0/16 --default-addr-pool 10.30.0.0/16 --default-addr-pool-mask-length 26

# Run docker info to view the current state of the swarm:
docker info
```

## 节点管理

```sh
# 检查节点
docker node ls

# 检查某个节点
docker node inspect self --pretty
docker node inspect node0 --pretty

# 查看manager加入连接
docker swarm join-token manager
# 查看worker加入连接
docker swarm join-token worker

# 只打印token
docker swarm join-token --quiet worker
# 使旧token失效
docker swarm join-token --rotate worker

# 更新节点（排空）
docker node update --availability drain node-1
# 更新节点（添加标签）
docker node update --label-add foo --label-add bar=baz node-1

# 升级节点
docker node promote node-3 node-2
docker node update --role manager node-3 node-2
# 降级节点
docker node demote node-3 node-2
docker node update --role worker node-3 node-2

# 移除节点
docker node rm node-2
docker node rm --force node9
# 离开集群
docker swarm leave
```

## 排空/启用节点

```sh
# 查看节点
docker node ls
# 启动测试服务
docker service create --replicas 3 --name redis --update-delay 10s redis:3.0.6
# 查看运行的服务
docker service ps redis

# 排空节点
docker node update --availability drain worker1
# 检查节点情况
docker node inspect --pretty worker1
# 检查服务情况
docker service ps redis

# 启用节点
docker node update --availability active worker1
# 检查节点
docker node inspect --pretty worker1
```

## 部署服务

```sh
# 创建服务
docker service create nginx
docker service create --name my_web nginx
docker service create --name demo alpine:3.5 ping 8.8.8.8
docker service create --name helloworld alpine ping docker.com
docker service create --name helloworld alpine:3.6 ping docker.com
docker service create --replicas 1 --name helloworld alpine ping docker.com
docker service create --name="myservice" ubuntu:16.04
docker service create --name="myservice" ubuntu
docker service create --name="myservice" ubuntu:latest
docker service create \
    --name="myservice" \
    ubuntu:16.04@sha256:35bc48a1ca97c3971611dc4662d08d131869daa692acb281c7e9e052924e38b1

# The following service’s containers have an environment variable $MYVAR set to myvalue,
# run from the /tmp/ directory, and run as the my_user user.
docker service create --name helloworld \
  --env MYVAR=myvalue \
  --workdir /tmp \
  --user my_user \
  alpine ping docker.com

# Connect the service to an overlay network
docker network create --driver overlay my-network
docker service create \
  --replicas 3 \
  --network my-network \
  --name my-web \
  nginx

# 检查服务
docker service ls

# gMSA for Swarm
docker config create credspec credspec.json
docker service create --credential-spec="config://credspec" <your image>

# Create a service using an image on a private registry
docker login registry.example.com
docker service  create \
  --with-registry-auth \
  --name my_service \
  registry.example.com/acme/my_image:latest

# Provide credential specs for managed service accounts
# https://docs.docker.com/engine/swarm/services/#provide-credential-specs-for-managed-service-accounts
docker config create --label com.docker.gmsa.name=mygmsa credspec credspec.json
docker service create --credential-spec="config://credspec" <your image>

# Customize a service’s isolation mode

# For example to start a service that runs alpine on every node in the swarm:
docker service create \
  --name myservice \
  --mode global \
  alpine top

# 约束服务
docker service create \
  --name my-nginx \
  --replicas 5 \
  --constraint node.labels.region==east \
  nginx
docker service create \
  --name my-nginx \
  --mode global \
  --constraint node.labels.region==east \
  --constraint node.labels.type!=devel \
  nginx
# 位置偏好
docker service create \
  --replicas 9 \
  --name redis_2 \
  --placement-pref 'spread=node.labels.datacenter' \
  redis:3.0.6
# 更新配置
docker service create \
  --replicas 10 \
  --name my_web \
  --update-delay 10s \
  --update-parallelism 2 \
  --update-failure-action continue \
  alpine

# Give a service access to volumes or bind mounts
docker service create \
  --mount src=<VOLUME-NAME>,dst=<CONTAINER-PATH> \
  --name myservice \
  <IMAGE>
docker service create \
  --mount type=volume,src=<VOLUME-NAME>,dst=<CONTAINER-PATH>,volume-driver=<DRIVER>,volume-opt=<KEY0>=<VALUE0>,volume-opt=<KEY1>=<VALUE1>
  --name myservice \
  <IMAGE>
# BIND MOUNTS
## To mount a read-write bind
docker service create \
  --mount type=bind,src=<HOST-PATH>,dst=<CONTAINER-PATH> \
  --name myservice \
  <IMAGE>
## To mount a read-only bind
docker service create \
  --mount type=bind,src=<HOST-PATH>,dst=<CONTAINER-PATH>,readonly \
  --name myservice \
  <IMAGE>

# Create services using templates
docker service create \
  --name hosttempl \
  --hostname="{{.Node.ID}}-{{.Service.Name}}"\
    busybox top


# 更新服务
docker service update --publish-add 80 my_web
docker service update --args "ping docker.com" helloworld
docker service update --network-add my-network my-web
docker service update --network-rm my-network my-web
# 查看服务
docker service ls
# 删除服务
docker service remove my_web
```

## 检查服务

```sh
# Inspect a service on the swarm
docker service inspect --pretty helloworld
docker service inspect helloworld

# Run docker service ps <SERVICE-ID> to see which nodes are running the service:
docker service ps demo
docker service ps helloworld

# 查看服务日志
docker service logs demo

# Run docker ps on the node where the task is running to see details about the container for the task.
docker ps
```

## 扩展服务

```sh
# Scale the service in the swarm
docker service scale helloworld=5

# 检查结果
docker service ps helloworld
docker ps
```

## 移除服务

```sh
# 移除服务
docker service rm demo
docker service rm helloworld

# 检查是否移除
docker service inspect helloworld
docker ps
```

## 回滚服务

```sh
# 回滚到上一个版本
docker service update \
  --rollback \
  --update-delay 0s
  my_web

# 设置自动回滚
docker service create \
  --name=my_redis \
  --replicas=5 \
  --rollback-parallelism=2 \
  --rollback-monitor=20s \
  --rollback-max-failure-ratio=.2 \
  redis:latest
```

## 滚动更新服务

```sh
# 创建一个服务
# --update-parallelism flag to configure the maximum number of service tasks
docker service create \
  --replicas 3 \
  --name redis \
  --update-delay 10s \
  redis:3.0.6

# 检查服务情况
docker service inspect --pretty redis

# 更新服务
docker service update --image redis:3.0.7 redis

# 检查更新情况
docker service inspect --pretty redis

# 如果暂停或失败
# To restart a paused update run docker service update <SERVICE-ID>. For example
docker service update redis

# 检查更新情况
# Run docker service ps <SERVICE-ID> to watch the rolling update:
docker service ps redis
```

## 暴露服务端口

```sh
# 访问地址 <节点IP>:8080
docker service create \
  --name my-web \
  --publish published=8080,target=80 \
  --replicas 2 \
  nginx
# You can publish a port for an existing service using the following command:
docker service update \
  --publish-add published=<PUBLISHED-PORT>,target=<CONTAINER-PORT> \
  <SERVICE>
# You can use docker service inspect to view the service’s published port. For instance:
docker service inspect --format="{{json .Endpoint.Spec.Ports}}" my-web


# Publish a port for TCP only or UDP only
## TCP ONLY
### Long syntax:
docker service create --name dns-cache \
  --publish published=53,target=53 \
  dns-cache
### Short syntax:
docker service create --name dns-cache \
  -p 53:53 \
  dns-cache
## TCP AND UDP
### Long syntax:
docker service create --name dns-cache \
  --publish published=53,target=53 \
  --publish published=53,target=53,protocol=udp \
  dns-cache
### Short syntax:
docker service create --name dns-cache \
  -p 53:53 \
  -p 53:53/udp \
  dns-cache
## UDP ONLY
### Long syntax:
docker service create --name dns-cache \
  --publish published=53,target=53,protocol=udp \
  dns-cache
### Short syntax:
docker service create --name dns-cache \
  -p 53:53/udp \
  dns-cache

# Bypass the routing mesh
# 必须使用 长语法 --publish 标识，并且mode设为host
# 如果 mode 不设置，或者设为 ingress 则使用routing mesh
docker service create \
  --name dns-cache \
  --publish published=53,target=53,protocol=udp,mode=host \
  --mode global \
  dns-cache
docker service create \
  --mode global \
  --publish mode=host,target=80,published=8080 \
  --name=nginx \
  nginx:latest
```

## 外部负载均衡

参考： https://docs.docker.com/engine/swarm/ingress/#configure-an-external-load-balancer

you could have the following HAProxy configuration in `/etc/haproxy/haproxy.cfg`

```conf
global
        log /dev/log    local0
        log /dev/log    local1 notice
...snip...

# Configure HAProxy to listen on port 80
frontend http_front
   bind *:80
   stats uri /haproxy?stats
   default_backend http_back

# Configure HAProxy to route requests to swarm nodes on port 8080
backend http_back
   balance roundrobin
   server node1 192.168.99.100:8080 check
   server node2 192.168.99.101:8080 check
   server node3 192.168.99.102:8080 check
```

## Configure and run Prometheus （可选）

修改配置`/etc/docker/daemon.json`

```json
{
  "metrics-addr": "127.0.0.1:9323",
  "experimental": true
}
```

```sh
# 重启docker
sudo systemctl daemon-reload && sudo systemctl restart docker

# start a single-replica Prometheus service using this configuration
# docker service create --replicas 1 --name my-prometheus \
#     --mount type=bind,source=/tmp/prometheus.yml,destination=/etc/prometheus/prometheus.yml \
#     --publish published=9090,target=9090,protocol=tcp \
#     prom/prometheus
docker service create --replicas 1 --name my-prometheus \
    --mount type=bind,source=/home/vagrant/prometheus.yml,destination=/etc/prometheus/prometheus.yml \
    --publish published=9090,target=9090,protocol=tcp \
    prom/prometheus

# 查看
# Verify that the Docker target is listed at
# http://localhost:9090/targets/

# 测试
docker service create \
  --replicas 10 \
  --name ping_service \
  alpine ping docker.com

# 移除
docker service remove ping_service
```

## 部署 stack

```sh
# 部署集群服务
docker stack deploy -c bb-stack.yaml demo
# 查看集群服务
docker stack ls
# 移除集群服务
docker stack rm demo

# docker-compose -f docker-compose-whoami.yaml up --scale whoami=2
docker stack deploy -c docker-compose-whoami.yml traefik-consul

# 本机测试
curl -H Host:whoami.localhost http://127.0.0.1
```
