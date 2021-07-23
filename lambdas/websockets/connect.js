const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');

const usersTableName = process.env.usersTableName;

exports.handler = async (event) => {
  console.info('New client connecting to websocket', event);
  const { connectionId, domainName, stage } = event.requestContext;
  const newConnection = {
    ID: connectionId,
    date: Date.now(),
    domainName,
    stage,
  };
  console.debug('Writing connection to database', newConnection);
  await Dynamo.write(newConnection, usersTableName);
  console.info('Connection details successfully saved', newConnection);
  return Responses._200('Hello');
};
