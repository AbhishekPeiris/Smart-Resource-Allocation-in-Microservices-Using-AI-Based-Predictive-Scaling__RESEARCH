# kubectl get pods -o wide

NAME                                READY   STATUS             RESTARTS           AGE     IP           NODE             NOMINATED NODE   READINESS GATES
makeline-service-65bb465b7c-ckq47   1/2     CrashLoopBackOff   694 (4m53s ago)    46d     10.1.2.111   docker-desktop   <none>           <none>
makeline-service-6c8ffb5857-p4mdw   1/2     CrashLoopBackOff   1157 (2m26s ago)   46d     10.1.2.122   docker-desktop   <none>           <none>
mongodb-0                           1/2     CrashLoopBackOff   1461 (4m35s ago)   47d     10.1.2.124   docker-desktop   <none>           <none>
order-service-6f5f4ccf8-7zxfp       2/2     Running            0                  3h49m   10.1.2.132   docker-desktop   <none>           <none>
product-service-8675474b7b-pgt5r    2/2     Running            0                  3h49m   10.1.2.131   docker-desktop   <none>           <none>
rabbitmq-0                          2/2     Running            40 (11h ago)       47d     10.1.2.117   docker-desktop   <none>           <none>
store-admin-5745665f66-zqk4m        2/2     Running            0                  3h49m   10.1.2.130   docker-desktop   <none>           <none>
store-front-5574f7b8c-j2g5z         2/2     Running            0                  3h49m   10.1.2.129   docker-desktop   <none>           <none>
virtual-customer-77d7f9f5-tplzk     2/2     Running            0                  177m    10.1.2.135   docker-desktop   <none>           <none>
virtual-worker-5c785fbcb7-lsr7d     1/2     CrashLoopBackOff   20 (3m14s ago)     177m    10.1.2.136   docker-desktop   <none>           <none>