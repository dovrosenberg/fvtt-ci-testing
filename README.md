# fvtt-ci-testing

This is a model for how you can use docker to wrap testing via Quench inside Foundry VTT as part of a CI pipeline.

Approach:
0. If you haven't already installed and started docker... Install docker and docker-compose plugin.  See [https://docs.docker.com/engine/install/]

1. Get a live Foundry URL from [https://foundryvtt.com/community/me/licenses].

2. Put your Foundry URL in where indicated. You have 5 minutes from when you download it to get through STEP 3 before it expires.

3. Run docker compose to create the initial image
    ```
    docker compose up -d
    ```

4. Login to localhost:30000. Put in your license key. Agree to the terms, etc.

    **NOTE! Your license can only run one Foundry server at a time.  So you should not have it running as part of a CI pipeline while also using the same license to host a playable server.**

5. Install the systems and modules that you want to exist in your test instance.  Create a new world you want to use.  If testing a module, do not install your module.  If testing a system, [NO IDEA HOW THIS WORKS...BECAUSE NEED TO PROVIDE UPDATED ONE AND THEN CREATE WORLD?  OR JUST UPDATE IT?]  Install Quench.

6. Create the new world [NOTE DIFFERENCE FOR SYSTEM].  Only create a single world

7. Login to the world and clear out any prompts.  Leave user as Gamemaster and no password.  If you need to test a different user, you'll have to update `run-tests.js`.  Turn on the modules you want and make any config adjustments.  Make sure to include Quench.

8. Need to create a GitHub personal access token with `write:packages` and `read:packages` permissions.  Need to use classic PAT.
  Recommend tying to the specific repo of the system/module.  NOTE YOU CAN ALSO USE SOME OTHER CONTAINER REGISTRY IF YOU WANT, BUT THEN YOU'RE ON YOUR OWN FROM THIS POINT.
  In this command, paste it in.  But then also store it as a github secret for use in the pipeline

  Under the settings for the repository you're building, create an Action Repository Secret.  Call it `CONTAINER_TOKEN` and the value should be the PAT token value from above.

9. Save a snapshot of this container.

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
docker push ghcr.io/[YOUR GITHUB USERNAME]/[CONTAINER NAME]:latest
```

That last step will take a bit, as it has to upload a lot to GitHub.

You can now stop the container.
```
docker stop [CONTAINER ID]
```

11. Inside GitHub, go to "Packages" and open the new package and go to settings.  Add the repository for the module you want to test to the "Manage Actions" section.

12. At this point, we assume you have some sort of GitHub Action CI pipeline (or else another one and you can handle it on your own). You'll need to incorporate the testing into your pipeline.  

See `sample-github-action.yml` for a sample GitHub action YAML that just runs the tests.

