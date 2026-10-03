const TZ = () => process.env.TZ_OFFSET || '+05:30';
const toDate = (date, time) => new Date(`${date}T${time}:00${TZ()}`);
const dayOfWeek = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();
module.exports = { toDate, dayOfWeek };
