namespace=aqukin-prod
microk8s kubectl delete namespace ${namespace}
microk8s kubectl create namespace ${namespace}
microk8s kubectl -n ${namespace} apply -f prod_deployment.yaml
microk8s kubectl -n ${namespace} apply -f prod_service.yaml