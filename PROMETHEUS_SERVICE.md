# kubectl get svc -n monitoring

NAME                                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
alertmanager-operated                     ClusterIP   None             <none>        9093/TCP,9094/TCP,9094/UDP   57d
cadvisor                                  ClusterIP   10.102.205.57    <none>        8080/TCP                     14d
prometheus-grafana                        ClusterIP   10.110.252.64    <none>        80/TCP                       57d
prometheus-kube-prometheus-alertmanager   ClusterIP   10.99.233.76     <none>        9093/TCP,8080/TCP            57d
prometheus-kube-prometheus-operator       ClusterIP   10.110.217.237   <none>        443/TCP                      57d
prometheus-kube-prometheus-prometheus     ClusterIP   10.111.15.123    <none>        9090/TCP,8080/TCP            57d
prometheus-kube-state-metrics             ClusterIP   10.101.13.172    <none>        8080/TCP                     57d
prometheus-operated                       ClusterIP   None             <none>        9090/TCP                     57d
prometheus-prometheus-node-exporter       ClusterIP   10.96.179.170    <none>        9100/TCP                     57d