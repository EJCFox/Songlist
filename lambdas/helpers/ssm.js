const AWS = require('aws-sdk');

var ssm = new AWS.SSM();

const getDecryptedParameter = async (name) => {
  var params = {
    Name: name,
    WithDecryption: true,
  };
  const clientSecretResult = await ssm.getParameter(params).promise();
  return clientSecretResult.Parameter.Value;
};

module.exports = {
  getDecryptedParameter,
};
