namespace=aqukin-dev
microk8s kubectl delete namespace ${namespace}
microk8s kubectl create namespace ${namespace}
microk8s kubectl -n ${namespace} apply -f dev_deployment.yaml
# microk8s kubectl -n ${namespace} apply -f dev_service.yaml