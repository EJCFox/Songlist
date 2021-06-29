const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

const usersTableName = process.env.usersTableName;

exports.handler = async event => {
    console.info('Client disconnecting', event);
    const { connectionId } = event.requestContext;
    console.debug(`Removing connection with ID ${connectionId}`);
    await Dynamo.delete({ ID: connectionId }, usersTableName);
    return Responses._200({ message: 'disconnected' });
};
