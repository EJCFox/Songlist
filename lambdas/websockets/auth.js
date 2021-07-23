const AWS = require("aws-sdk");
const https = require("https");
var jwt = require("jsonwebtoken");

const twitchClientId = process.env.twitchClientId;
const twitchRedirectUri = process.env.twitchRedirectUri;

exports.handler = async function (event, _, callback) {
  console.log("Received event in authoriser:", JSON.stringify(event, null, 2));

  var queryStringParameters = event.queryStringParameters;

  var condition = {};
  condition.IpAddress = {};

  if (queryStringParameters.auth === "anonymous") {
    callback(null, generateAllow(queryStringParameters.auth, event.methodArn));
  } else {
    var ssm = new AWS.SSM();
    var params = {
      Name: "TwitchClientSecret",
      WithDecryption: true,
    };
    const clientSecretResult = await ssm.getParameter(params).promise();
    console.log(clientSecretResult);
    const twitchClientSecret = clientSecretResult.Parameter.Value;
    const path = `/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&code=${queryStringParameters.auth}&grant_type=authorization_code&redirect_uri=${twitchRedirectUri}`;
    console.log(path);

    const options = {
      hostname: "id.twitch.tv",
      path,
      method: "POST",
    };

    const req = https.request(options, (res) => {
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        const decoded = jwt.decode(JSON.parse(chunk).id_token, {
          complete: true,
        });
        console.log(decoded);
        const username = decoded.payload.preferred_username;
        console.log(username);
        callback(null, generateAllow(username, event.methodArn));
      });
    });
    req.on("error", (e) => {
      console.log("error", e);
      callback("Unauthorized");
    });
    req.end();
  }
};

var generatePolicy = function (principalId, effect, resource) {
  var authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    var policyDocument = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    var statementOne = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  authResponse.context = {
    isAuthenticated: principalId !== "anonymous",
    username: principalId !== "anonymous" ? principalId : undefined,
  };
  return authResponse;
};

var generateAllow = function (principalId, resource) {
  return generatePolicy(principalId, "Allow", resource);
};
