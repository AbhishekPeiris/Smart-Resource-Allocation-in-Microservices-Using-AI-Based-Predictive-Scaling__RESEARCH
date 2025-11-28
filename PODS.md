# kubectl get pods -o wide

NAME                                READY   STATUS             RESTARTS          AGE   IP           NODE             NOMINATED NODE   READINESS GATES
makeline-service-65bb465b7c-ckq47   1/2     CrashLoopBackOff   571 (107s ago)    45d   10.1.2.99    docker-desktop   <none>           <none>
makeline-service-6c8ffb5857-p4mdw   1/2     Running            941 (10h ago)     45d   10.1.2.103   docker-desktop   <none>           <none>
mongodb-0                           1/2     CrashLoopBackOff   1226 (107s ago)   46d   10.1.2.91    docker-desktop   <none>           <none>
order-service-6cc75c7cff-qhk2g      2/2     Running            16 (10h ago)      8d    10.1.2.100   docker-desktop   <none>           <none>
product-service-5b8794b597-nn29v    2/2     Running            35 (10h ago)      43d   10.1.2.95    docker-desktop   <none>           <none>
rabbitmq-0                          2/2     Running            38 (10h ago)      46d   10.1.2.101   docker-desktop   <none>           <none>
store-admin-5588c957-b9bkd          2/2     Running            49 (10h ago)      46d   10.1.2.98    docker-desktop   <none>           <none>
store-front-6ff78d4f79-m9bsc        2/2     Running            40 (10h ago)      43d   10.1.2.96    docker-desktop   <none>           <none>
virtual-customer-f5d4cd9f7-dbdk5    2/2     Running            36 (10h ago)      45d   10.1.2.102   docker-desktop   <none>           <none>
virtual-worker-7766b5bbf8-27nrt     1/2     CrashLoopBackOff   626 (3m30s ago)   45d   10.1.2.105   docker-desktop   <none>           <none>