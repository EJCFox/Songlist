const https = require('https');
const response = require('../helpers/apiResponses');
const validation = require('../helpers/parameterValidation');
const ssm = require('../helpers/ssm');

const twitchClientId = process.env.twitchClientId;
const twitchRedirectUri = process.env.twitchRedirectUri;

exports.handler = async (event) => {
  console.log('Authentication request received:', event);
  var code = event.queryStringParameters && event.queryStringParameters.code;

  if (!validation.isRequiredString(code)) {
    return response.badRequest({ message: 'Invalid code' });
  }

  const twitchClientSecret = await ssm.getDecryptedParameter(
    'TwitchClientSecret'
  );
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
        resolve({ token: JSON.parse(chunk).id_token, isAdmin: true });
      });
    });
    tokenRequest.on('error', (e) => {
      reject(e);
    });
    tokenRequest.end();
  });
};
