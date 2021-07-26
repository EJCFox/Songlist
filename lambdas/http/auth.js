const axios = require('axios');
const jwt = require('jsonwebtoken');
var jwksClient = require('jwks-rsa');
const response = require('../helpers/apiResponses');
const validation = require('../helpers/parameterValidation');
const ssm = require('../helpers/ssm');

const twitchClientId = process.env.twitchClientId;
const twitchRedirectUri = process.env.twitchRedirectUri;
const adminUsers = process.env.adminUsers.split(',');

exports.handler = async (event) => {
  console.info('Authentication request received:', event);
  var code = event.queryStringParameters && event.queryStringParameters.code;

  if (!validation.isRequiredString(code)) {
    return response.badRequest({ message: 'Invalid code' });
  }

  const twitchClientSecret = await ssm.getDecryptedParameter(
    'TwitchClientSecret'
  );

  console.info('Fetching token from Twitch');
  const authenticationResponse = await axios.post(
    `https://id.twitch.tv/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${twitchRedirectUri}`
  );
  const idToken = authenticationResponse.data.id_token;

  function getSigningKey(header, callback) {
    jwksClient({
      jwksUri: 'https://id.twitch.tv/oauth2/keys',
    }).getSigningKey(header.kid, function (_, key) {
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getSigningKey,
      { audience: twitchClientId, issuer: 'https://id.twitch.tv/oauth2' },
      function (err, decoded) {
        if (err) {
          reject(err);
        } else {
          resolve({
            token: idToken,
            isAdmin: adminUsers.includes(decoded.preferred_username),
          });
        }
      }
    );
  });
};
