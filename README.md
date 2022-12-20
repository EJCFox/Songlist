# Songlist backend

This project is a serverless project that uses [Serverless](https://www.serverless.com/) backed by [AWS](https://aws.amazon.com/) to provide a backend for songlist functionality (intended to be used for [Twitch](https://www.twitch.tv/) live streaming purposes).

## Endpoints

### HTTP API endpoints

| Endpoint                       | Premissions           | Description                                          |
| ------------------------------ | --------------------- | ---------------------------------------------------- |
| GET - /authorize               | None                  | Authenticates the user (see below for details).      |
| GET - /status                  | None                  | Get the status of song requests (open or closed).    |
| POST - /status                 | Authenticated (admin) | Update the status of song requests (open or closed). |
| GET - /list                    | None                  | Fetch all songs in the songlist.                     |
| POST - /list                   | Authenticated (admin) | Add a song to the songlist.                          |
| GET - /queue                   | None                  | Get all songs in the queue.                          |
| POST - /queue/{songId}         | Authenticated         | Add a song to the queue.                             |
| PATCH - /queue/{songId}/bump   | Authenticated (admin) | Bump a song to another position in the queue.        |
| DELETE - /queue/{songId}       | Authenticated (admin) | Remove a song from the queue.                        |
| PATCH - /queue/{songId}/played | Authenticated (admin) | Mark a song as played and remove it from the queue.  |

### Websocket

There is one websocket endpoint that will send notifications of any events (status changes, queue changes, songlist changes) so that a web client can remain in sync without having to poll for changes.

As per [standard AWS limits](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html#apigateway-execution-service-websocket-limits-table), the connection will close after 10 minutes if inactive, and otherwise after 2 hours (if not closed before). The web client should handle this gracefully.

The websocket can be polled to keep it alive. The default route will return the message 'pong' upon any message which can be used for this purpose.

### Authentication

This API uses JWTs to authenticate the user for restricted endpoints.

This app uses [twitch OIDC authentication flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oidc/#oidc-authorization-code-flow). The authorize endpoint accepts the authorisation code and then provides the JWT, along with information about the user's admin status.

Admin status is controlled by the config table in DynamoDB.

## Deployment

- First, [register your app with Twitch](https://dev.twitch.tv/console/apps)
- Then use those credentials/settings to create/edit the .env file with the following:

```
TWITCH_CLIENT_ID=<twitch client ID>
TWITCH_REDIRECT_URI=<your redirect URI>
CORS_ORIGIN=<your web frontend origin>
```

- Create `TwitchClientSecret` parameter in the [AWS parameter store](https://eu-west-2.console.aws.amazon.com/systems-manager/parameters/) and enter your client secret here. (This is fetched at runtime of the app for security purposes.)
- Run `npm install` to install dependencies locally (including serverless), or you can install serverless globally with `npm install -g serverless`.
- Run `sls deploy` (for dev) or `sls deploy --stage prod` (for prod) to deploy the app to AWS. When this is done you should get a list of endpoints.
- (Optional) if you'd like to set some throtting on your API, go to [API Gateway](https://eu-west-2.console.aws.amazon.com/apigateway/main/apis) and update the settings for each API.
  - For HTTP API: go to Throttling -> select stage -> Default Route Throttling.
  - For websocket: go to Stages -> select stage -> Settings -> Default Route Throttling.
