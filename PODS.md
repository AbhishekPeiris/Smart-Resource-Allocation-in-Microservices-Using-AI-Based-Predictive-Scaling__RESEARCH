# kubectl get pods -o wide

NAME                                      READY   STATUS             RESTARTS         AGE   IP           NODE             NOMINATED NODE   READINESS GATES
makeline-service-65bb465b7c-ckq47         1/2     Error              735 (49s ago)    47d   10.1.2.160   docker-desktop   <none>           <none>
makeline-service-6c8ffb5857-p4mdw         1/2     Running            1230 (44s ago)   47d   10.1.2.171   docker-desktop   <none>           <none>
mesh-traffic-generator-6b8745d9f8-8pnsf   2/2     Running            2 (20m ago)      23h   10.1.2.170   docker-desktop   <none>           <none>
mongodb-0                                 1/2     CrashLoopBackOff   1543 (83s ago)   48d   10.1.2.165   docker-desktop   <none>           <none>
order-service-778d9645c5-9zbxk            2/2     Running            2 (20m ago)      24h   10.1.2.166   docker-desktop   <none>           <none>
product-service-b89d6f8f9-97m74           2/2     Running            2 (20m ago)      24h   10.1.2.164   docker-desktop   <none>           <none>
rabbitmq-0                                2/2     Running            42 (20m ago)     48d   10.1.2.162   docker-desktop   <none>           <none>
store-admin-79ff45db8c-xhxdq              2/2     Running            2 (20m ago)      24h   10.1.2.159   docker-desktop   <none>           <none>
store-front-7b556f458f-mqbcg              2/2     Running            2 (20m ago)      24h   10.1.2.167   docker-desktop   <none>           <none>
virtual-customer-77d7f9f5-tplzk           2/2     Running            2 (20m ago)      27h   10.1.2.168   docker-desktop   <none>           <none>
virtual-worker-5c785fbcb7-lsr7d           1/2     CrashLoopBackOff   63 (64s ago)     27h   10.1.2.163   docker-desktop   <none>           <none>