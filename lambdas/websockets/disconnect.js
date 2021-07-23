const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');

const usersTableName = process.env.usersTableName;

exports.handler = async (event) => {
  console.info('Client disconnecting', event);
  const { connectionId } = event.requestContext;
  console.debug(`Removing connection with ID ${connectionId}`);
  await Dynamo.delete({ ID: connectionId }, usersTableName);
  console.info('Successfully deleted connection', connectionId);
  return Responses._200('Goodbye');
};
