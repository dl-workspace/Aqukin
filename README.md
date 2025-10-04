[![License](https://badgen.net/github/license/dl-workspace/Aqukin)](https://github.com/dl-workspace/Aqukin/blob/main/LICENSE) [![Build Status](https://jenkins.viescloud.com/buildStatus/icon?job=vincent-services%2FBE%2Faqukin-dev)](https://jenkins.viescloud.com/job/vincent-services/job/BE/job/aqukin-dev/)

# [Invite Aqukin!](https://discord.com/api/oauth2/authorize?client_id=702620458130079750&permissions=8&scope=bot%20applications.commands)

Your (un)reliable Super Idol Master Gamer Maid♥, a [Discord](https://discord.com/) bot that was created based on a Virtual Youtuber known as [Minato Aqua](https://www.youtube.com/channel/UC1opHUrw8rvnsadT-iGp7Cg)

# Description

For the list of commands or more info on setting Aqukin up, please refer to the [Wiki pages](https://github.com/dl-workspace/Aqukin/wiki)

<p align="center">
  <img src="https://github.com/dl-workspace/Aqukin-old/blob/master/src/utilities/media/background.png"> 
</p>

## Local development

- Copy `.env.example` to `.env` (or create one) and fill in the required Discord credentials.
- To enable the Redis-backed queue cache, start a Redis instance and set `REDIS_URI` (for example, run `docker compose up redis` to use the bundled configuration).
- If `REDIS_URI` is omitted, Aqukin now skips connecting to Redis and falls back to in-memory state for the current process.
- The Graylog transport is optional; leave `LOGGER_URL` unset to disable remote log forwarding during local runs. When enabled, repeated delivery failures automatically pause the transport for a few minutes to keep the console readable.
