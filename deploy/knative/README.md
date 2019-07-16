# Run on Knative
This document describes how to run `graffiticode/api` on Knative.
[Knative](https://Knative.dev) is a Kubernetes-based platform to build, deploy,
and manage modern serverless workloads. [Kubernetes](https://kubernetes.io) is
an open-source system for automating deployment, scaling, and management of
containerized applications.

## Install Knative
The Knative project provides [documentation](https://Knative.dev/docs/install/)
on how to install Knative on many different platforms and cloud providers.
Reference Knative's install instructions to for details on hwo to install
Knative.

### Amazon EKS
These are instructions to run Knative with gloo on Amazon EKS.

1. Follow the instructions [here](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-eksctl.html)
to create an Amazon EKS cluster.
1. Follow the instructions [here](https://knative.dev/docs/install/knative-with-gloo/)
to install Knative with gloo on the Amazon EKS cluster.
   1. (optional) Configure custom domain [here](https://knative.dev/docs/serving/using-a-custom-domain/)
   1. (optional) Configure outbound network access [here](https://knative.dev/docs/serving/outbound-network-access/)

## Build `api`
1. Start by creating a docker account [here](https://hub.docker.com/signup).
1. Build, tag, and push docker image
   ``` bash
   docker build -t graffiticode/api .
   docker tag graffiticode/api <your_username>/api
   docker push <your_username>/api
   ```

## Deploy `api`
1. Modify `service.yaml` to reference the image tag created during the build
step.
   ```bash
   sed -i 's|<IMAGE>|<your_username>/api|' deploy/knative/service.yaml
   ```

1. Apply the service config
   ``` bash
   kubectl apply --filename deploy/knative/service.yaml
   ```

## Test
1. Find the url of the Knative service by running `kubectl get ksvc`. Use the url
in the `Host` header.
   **Example output**:
   ``` bash
   NAME   URL                                          LATESTCREATED   LATESTREADY   READY   REASON
   api    http://api.default.staging.aws.kevindy.com   api-s2xhw       api-s2xhw     True
   ```

1. Find the external IP of the ingress load balancer by running `kubectl get
svc --all-namespaces`. Use this IP address as the target of the curl command.
   **Example output**:
   ``` bash
   NAMESPACE         NAME                   TYPE           CLUSTER-IP       EXTERNAL-IP                                                               PORT(S)                      AGE
   default           api                    ExternalName   <none>           clusteringress-proxy.gloo-system.svc.cluster.local                        <none>                       22m
   default           api-s2xhw              ClusterIP      10.100.147.137   <none>                                                                    80/TCP                       22m
   default           api-s2xhw-5pg56        ClusterIP      10.100.138.214   <none>                                                                    80/TCP                       22m
   default           api-s2xhw-tlhvr        ClusterIP      10.100.255.53    <none>                                                                    9090/TCP,9091/TCP            22m
   default           kubernetes             ClusterIP      10.100.0.1       <none>                                                                    443/TCP                      63m
   gloo-system       clusteringress-proxy   LoadBalancer   10.100.194.184   a01c09106a66611e9bf6606a613a3a90-1877282972.us-east-2.elb.amazonaws.com   80:31670/TCP,443:32658/TCP   46m
   gloo-system       gloo                   ClusterIP      10.100.193.198   <none>                                                                    9977/TCP                     46m
   knative-serving   activator-service      ClusterIP      10.100.115.162   <none>                                                                    80/TCP,81/TCP,9090/TCP       46m
   knative-serving   autoscaler             ClusterIP      10.100.74.11     <none>                                                                    8080/TCP,9090/TCP,443/TCP    46m
   knative-serving   controller             ClusterIP      10.100.115.148   <none>                                                                    9090/TCP                     46m
   knative-serving   webhook                ClusterIP      10.100.84.159    <none>                                                                    443/TCP                      46m
   kube-system       kube-dns               ClusterIP      10.100.0.10      <none>                                                                    53/UDP,53/TCP                63m
   ```
1. Make request to `api` using the Knative service url and the load balancer
external IP. The request should return `OK`.
   **Example**
   ``` bash
   curl -i -H 'Host: api.default.staging.aws.kevindy.com' a01c09106a66611e9bf6606a613a3a90-1877282972.us-east-2.elb.amazonaws.com
   ```
   **Example Output**
   ``` bash
   HTTP/1.1 200 OK
   content-length: 2
   content-type: text/plain; charset=utf-8
   date: Sun, 14 Jul 2019 19:24:02 GMT
   etag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
   x-powered-by: Express
   x-envoy-upstream-service-time: 2700
   server: envoy

   OK
   ```
