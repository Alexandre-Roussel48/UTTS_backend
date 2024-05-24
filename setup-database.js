const { exec } = require('child_process');

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
};

const main = async () => {
  try {
    console.log('Pushing schema to the database...');
    await runCommand('npx prisma db push');
    console.log('Database schema pushed successfully.');
  } catch (error) {
    if (error.includes('some specific error message related to db already set')) {
      console.log('Database is already set, continuing...');
    } else {
      console.error('Error pushing schema to the database:', error);
      process.exit(1);
    }
  }

  try {
    console.log('Seeding the database...');
    await runCommand('node prisma/seed.js');
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding the database:', error);
    process.exit(1);
  }
};

main();