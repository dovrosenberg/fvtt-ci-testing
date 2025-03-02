# fvtt-ci-testing

This is a model for how you can use docker to wrap testing via Quench inside Foundry VTT as part of a CI pipeline.

Approach:
0. If you haven't already installed and started docker... Install docker and docker-compose plugin.  See [https://docs.docker.com/engine/install/]

1. Get a live Foundry URL from [https://foundryvtt.com/community/me/licenses] for your license key.

    **NOTE! Your license can only run one Foundry server at a time.  So you should not have it running as part of a CI pipeline while also using the same license to host a playable server.**

2. Put your Foundry URL in where indicated. You have 5 minutes from when you download it to get through STEP 3 before it expires.

3. Run docker compose
    ```
    docker compose up -d
    ```

    Note: This maps the foundry data directory from local box... I don't think we want to do that - only the module one

4. Login to localhost:[_______] - this is the exposed port in docker-compose  . Put in your license key. Agree to the terms, etc.

5. Install the systems and modules that you want to exist in your test instance.  Create a new world you want to use.  If testing a module, do not install your module.  If testing a system, [NO IDEA HOW THIS WORKS...BECAUSE NEED TO PROVIDE UPDATED ONE AND THEN CREATE WORLD?  OR JUST UPDATE IT?]  Install Quench.

6. Create the new world [NOTE DIFFERENCE FOR SYSTEM].  Only create a single world

7. Login to the world and clear out any prompts.  Turn on the modules you want and make any config adjustments.  Make sure to include Quench.

8. Need to create a GitHub personal access token with `write:packages` and `read:packages` permissions.  Need to use classic PAT.
  Recommend tying to the specific repo of the system/module.  NOTE YOU CAN ALSO USE SOME OTHER CONTAINER REGISTRY IF YOU WANT, BUT THEN YOU'RE ON YOUR OWN FROM THIS POINT.
  In this command, paste it in.  But then also store it as a github secret for use in the pipeline

  Under the settings for the repository you're building, create an Action Repository Secret.  Call it `CONTAINER_TOKEN` and the value should be the PAT token value from above.

8. Add the test runner script.

Use `docker ps` to find the running container and put its image name in this command.  Run this from the current directory (with `run-tests.js` in it)
```
docker exec [CONTAINER ID] mkdir -p /testScript
docker cp run-tests.js [CONTAINER ID]:/foundryData/Data/modules/simple-weather/
docker exec [CONTAINER ID] npm i -g puppeteer
```

9. Save a snapshot of this container.  Make sure that you're logged into the world when you do this.

Use `docker ps` to find the running container and put its image name in this command:
```
docker commit [CONTAINER ID] [CONTAINER NAME]
```
CONTAINER NAME might be something like 'module-name-testing'.  This is the name you'll use to store it in the container repository and then retrieve it.

10. Upload it to the GitHub Container Repository
```
echo "[PERSONAL ACCESS TOKEN VALUE]" | docker login ghcr.io -u [YOUR GITHUB USERNAME] --password-stdin
```  

You should get a message about login success.

```
docker tag [CONTAINER NAME] ghcr.io/[YOUR GITHUB USERNAME]/[CONTAINER NAME]:latest
docker push ghcr.io/YOUR_GITHUB_USERNAME/[CONTAINER NAME]:latest
```

That last step will take a bit, as it has to upload a lot to GitHub.

11. Inside GitHub, go to "Packages" and open the new package and go to settings.  Add the repository for the module you want to test to the "Manage Actions" section.
12. At this point, we assume you have some sort of GitHub action CI pipeline (or else another one and you can handle it on your own).  The following steps, though, define a new GitHub action workflow that you can use on its own or as a template for integrating into a pipeline.

Create the YAML:
```yml
name: Foundry VTT Quench Tests

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      foundry:
        image: ghcr.io/[YOUR_GITHUB_USERNAME]/[CONTAINER_NAME]:latest
        ports:
          - 30000:30000
        options: --health-cmd "curl -f http://localhost:30000 || exit 1" --health-interval=10s --health-retries=5

    # steps:
    #   - name: Checkout Code
    #     uses: actions/checkout@v4

    #   - name: Run Tests with Puppeteer
    #     run: |
    #       npm install puppeteer
    #       node run-tests.js
```