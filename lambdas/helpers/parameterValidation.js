const isRequiredString = (value) => value && typeof value === 'string';

const isPositiveInteger = (value) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isValidId = (value) =>
  value && typeof value === 'string' && /^[a-zA-Z0-9\-]+$/.test(value);

const isRequiredBoolean = (value) => typeof value === 'boolean';

module.exports = {
  isRequiredString,
  isPositiveInteger,
  isValidId,
  isRequiredBoolean,
};
