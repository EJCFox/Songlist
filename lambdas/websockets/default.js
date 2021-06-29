const Responses = require('../common/API_Responses');

exports.handler = async event => {
    console.info('Default hander called - unknown route', event);
    return Responses._404({ message: 'Unknown route' });
};
