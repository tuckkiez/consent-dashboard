const { refetchSingleDate } = require('./scripts/fetch_all');

const date = process.argv[2];
if (!date) {
    console.error('กรุณาระบุวันที่ เช่น: node refetch_one.js 2025-07-02');
    process.exit(1);
}

refetchSingleDate(date)
  .then(() => console.log(`\u2713 Successfully refetched data for ${date}`))
  .catch(err => {
    console.error(`\u2717 Error refetching ${date}:`, err.message || err);
    process.exit(1);
  });
