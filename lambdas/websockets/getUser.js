const Responses = require("../common/API_Responses");

exports.handler = async (event) => {
  console.info("User ID request received", event);
  return Responses._200({
    action: "getUser",
    data: {
      isAuthenticated: event.requestContext.authorizer.isAuthenticated,
      username: event.requestContext.authorizer.username,
    },
  });
};
