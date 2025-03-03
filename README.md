# fvtt-ci-testing

This library will help you use docker to wrap testing via Quench inside Foundry VTT as part of a CI pipeline.  You can do the steps below to create a standalone `test` workflow inside GitHub actions, or modify it as needed to deploy the container 

The instructions below are for testing a module.  If anyone would like to figure out how to translate it to a system, please file an issue to let me know how to update this documentation.

Note: It is likely that future versions of Foundry will break this.  So be aware, and once this module is updated, you'll need to redo the steps in *Part One* below to create a new container.

**Note: in all commands shown below, when you replace [SOME VARIABLE], you should not include the brackets.**

## How to use
### Part One - Create the Docker container
This section outlines how to create a Docker container that funds Foundry and executes your Quench tests.  It should be fairly portable to any CI setup.

1. You'll want to clone this repo and **execute all the commands below from inside the cloned repo directory**.

    - If you haven't already installed and started docker... Install docker and docker-compose plugin.  See [https://docs.docker.com/engine/install/]

1. Get a live Foundry URL from [https://foundryvtt.com/community/me/licenses].

1. Edit `Dockerfile` and ut your Foundry URL in where indicated. You have 5 minutes from when you download it to get through this step before it expires.

1. Run docker compose to create the initial image
    ```
    docker compose up -d
    ```

    Errors like these indicate your URL timed out:
    ```
    25.38 Connecting to r2.foundryvtt.com (r2.foundryvtt.com)|104.22.60.89|:443... connected.
    25.49 HTTP request sent, awaiting response... 403 Forbidden
    25.52 2025-03-03 14:13:42 ERROR 403: Forbidden.
    25.52 
    ------
    failed to solve: ... did not complete successfully: exit code: 8
    ```

1. Login to [https://localhost:30000]. Put in your license key. Agree to the terms, etc.

    **NOTE! Your license can only run one Foundry server at a time.  So you should not have it running as part of a CI pipeline while also using the same license to host a playable server.**

1. Setup Foundry
    - Install the modules you want to exist in your test instance.  Make sure to include the module you want to test so you can activate it in the world below.  If you don't have a published version yet, you can just give it a URL to a module.json (ex. in a release). Note that it just needs to exist with the same module name - this DOES NOT need to be (and generally won't be) the version you want to test.
    - Also make sure to install Quench.
    - Install the system (you can only test one per container) you want to exist in your test instance.  
    - Create a new world you want to use (again only one per container).    
    
1. Login to the world and clear out any prompts.  Leave user as Gamemaster and no password.  If you need to test a different user, you'll have to update `run-tests.js`.  Turn on the modules you want and make any config adjustments.  Make sure to include Quench and your module.  Exit back to the setup.

1. Save a snapshot of this container.

    Use `docker ps` to find the running container and put its image name in this command:
    ```
    docker commit [CONTAINER ID] [CONTAINER NAME]
    ```

    CONTAINER NAME is a name you'll make up (ex. something like 'module-name-testing').  This is the name you'll use to store it in the container repository and then retrieve it.

### Part Two - deploy to GitHub (or another repo of your choice)
These are the steps to deploy your new container to the GitHub container registry.  If you know what you're doing, you can push it somewhere else instead, but in that case you're on your own from this point.

1. Need to create a GitHub personal access token (the classic type) with `write:packages` and `read:packages` permissions.  **I highly recommend limiting it to the repo(s) you want to test.**
    - Copy the token somewhere temporarily (you should never store it in plaintext permanently).  You'll need it to login to the container registry in the next step and to put into the repository secret.
    - Under the settings for the repository you're building, create an Action Repository Secret.  Call it `CONTAINER_TOKEN` and the value should be the PAT token value from above.

1. Upload it to the GitHub Container Repository
    ```
    echo "[PERSONAL ACCESS TOKEN VALUE]" | docker login ghcr.io -u [YOUR GITHUB USERNAME] --password-stdin
    ```  

    You should get a message about login success.

    ```
    docker tag [CONTAINER NAME] ghcr.io/[YOUR GITHUB USERNAME]/[CONTAINER NAME]:latest
    
    docker push ghcr.io/[YOUR GITHUB USERNAME]/[CONTAINER NAME]:latest
    ```

    That last step will take a bit, as it has to upload a lot to GitHub.

    You can now stop the container.
    ```
    docker stop [CONTAINER ID]
    ```

### Part Three - GitHub workflow setup
These are the instructions to create a standalong testing workflow in GitHub Actions. But you can take a similar approach in another CI environment if desired

1. Inside GitHub, go to "Packages" and open the new package and go to settings.  Add the repository for the module you want to test to the "Manage Actions" section.

1. At this point, we assume you have some sort of GitHub Action CI pipeline (or else another one and you can handle it on your own). You'll need to incorporate the testing into your pipeline.  

    See `sample-github-action.yml` for a sample GitHub action YAML that just runs the tests.  This file should be put into a `.github/workflows` directory in the project you want to test.

## Known issues

* You can only test one system/world per container.  If that's a problem for some reason, let me know and perhaps it can be made more robust.