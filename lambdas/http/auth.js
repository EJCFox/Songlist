const AWS = require('aws-sdk');
const https = require('https');

const twitchClientId = process.env.twitchClientId;
const twitchRedirectUri = process.env.twitchRedirectUri;

exports.handler = async (event) => {
  console.log('Authentication request received:', event);
  var code = event.queryStringParameters.code;

  var ssm = new AWS.SSM();
  var params = {
    Name: 'TwitchClientSecret',
    WithDecryption: true,
  };
  console.info('Fetching client secret');
  const clientSecretResult = await ssm.getParameter(params).promise();
  const twitchClientSecret = clientSecretResult.Parameter.Value;
  const path = `/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${twitchRedirectUri}`;
  const options = {
    hostname: 'id.twitch.tv',
    path,
    method: 'POST',
  };

  console.info('Fetching token from Twitch');
  return new Promise((resolve, reject) => {
    const tokenRequest = https.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        resolve(JSON.parse(chunk).id_token);
      });
    });
    tokenRequest.on('error', (e) => {
      reject(Error(e));
    });
    tokenRequest.end();
  });
};
