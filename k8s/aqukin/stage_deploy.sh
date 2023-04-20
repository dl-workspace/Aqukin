namespace=authenticator-stage
microk8s kubectl delete namespace ${namespace}
microk8s kubectl create namespace ${namespace}
microk8s kubectl -n ${namespace} apply -f stage_deployment.yaml
microk8s kubectl -n ${namespace} apply -f stage_service.yaml