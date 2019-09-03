const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

const usersTableName = process.env.usersTableName;

exports.handler = async event => {
    console.log('event', event);

    const { connectionId } = event.requestContext;

    await Dynamo.delete(connectionId, usersTableName);

    return Responses._200({ message: 'disconnected' });
};
