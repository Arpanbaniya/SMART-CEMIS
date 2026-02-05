const mongoose = require('mongoose');
const { User } = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/myevent_db').then(async () => {
  await User.findByIdAndUpdate('69633e0095c28eef069e4880', { role: 'student_admin' });
  console.log('User updated to student_admin');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
