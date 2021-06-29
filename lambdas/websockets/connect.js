const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

const usersTableName = process.env.usersTableName;

exports.handler = async event => {
    console.info('Client connecting', event);
    const { connectionId, domainName, stage } = event.requestContext;
    const newConnection = {
        ID: connectionId,
        date: Date.now(),
        domainName,
        stage,
    };
    console.debug('Writing new connection', newConnection);
    await Dynamo.write(newConnection, usersTableName);
    return Responses._200({ message: 'connected' });
};
