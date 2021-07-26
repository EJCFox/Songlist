const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');

const usersTableName = process.env.usersTableName;

exports.handler = async (event) => {
  console.info('Client disconnecting', event);
  const { connectionId } = event.requestContext;
  console.debug(`Removing connection with ID ${connectionId}`);
  await dynamo.delete({ ID: connectionId }, usersTableName);
  console.info('Successfully deleted connection', connectionId);
  return response.success('Goodbye');
};
