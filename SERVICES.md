# kubectl get svc -n default

NAME               TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)                          AGE
front-end          NodePort       10.99.234.146    <none>        80:30080/TCP,15090:31913/TCP     61d
hello-k8s          NodePort       10.103.43.248    <none>        8080:32123/TCP                   61d
kubernetes         ClusterIP      10.96.0.1        <none>        443/TCP                          244d
makeline-service   ClusterIP      10.110.237.66    <none>        3001/TCP                         61d
mongodb            ClusterIP      10.111.111.23    <none>        27017/TCP                        48d
order-service      ClusterIP      10.100.0.144     <none>        3000/TCP,15090/TCP               61d
product-service    ClusterIP      10.111.127.103   <none>        3002/TCP,15090/TCP               61d
rabbitmq           NodePort       10.104.253.76    <none>        5672:30221/TCP,15672:31572/TCP   61d
store-admin        LoadBalancer   10.97.232.217    localhost     80:30081/TCP,15090:30500/TCP     61d
store-front        LoadBalancer   10.104.180.45    localhost     80:32325/TCP,15090:32563/TCP     61d