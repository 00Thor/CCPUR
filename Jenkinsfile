pipeline {
    agent any
    environment {
        DOCKER_IMAGE = "ccpurv1" // Lowercase name for the Docker image
        DOCKER_REGISTRY = "paubiaksang/ccpurv1" // Docker Hub repository
    }
    stages {
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t $DOCKER_IMAGE .'
            }
        }
        stage('Push to Docker Registry') {
            steps {
                echo 'Pushing Docker image to registry...'
                withCredentials([usernamePassword(credentialsId: 'docker-registry-details', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh '''
                        docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
                        docker tag $DOCKER_IMAGE $DOCKER_REGISTRY
                        docker push $DOCKER_REGISTRY
                        docker logout
                    '''
                }
            }
        }
    }
}
