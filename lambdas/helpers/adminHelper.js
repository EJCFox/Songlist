const adminUsers = process.env.adminUsers.split(',');

const isAdminRequest = (event) => {
  const user = event.requestContext.authorizer.jwt.claims.preferred_username;
  return adminUsers.includes(user);
};

module.exports = {
  isAdminRequest,
};
