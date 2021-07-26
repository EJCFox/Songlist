const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');

const configTableName = process.env.configTableName;

exports.handler = async (event) => {
  console.info('Get status request event received', event);
  const config = await dynamo.getIfExists(
    { ConfigKey: 'RequestsOpen' },
    configTableName
  );
  return response.success({
    requestsOpen: config ? config.ConfigValue : false,
  });
};
