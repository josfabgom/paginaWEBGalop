const Client = require('ssh2-sftp-client');
const sftp = new Client();

const config = {
  host: '179.199.138.79',
  port: 22,
  username: 'root',
  password: 'herrera4480'
};

async function main() {
  try {
    console.log("Connecting...");
    await sftp.connect(config);
    console.log("Connected.");
    
    // Check root directories
    const rootFiles = await sftp.list('/');
    let pathsToCheck = ['/var/www/html', '/var/www/galopsrl.com.ar', '/home'];
    
    for (let p of pathsToCheck) {
      try {
        const type = await sftp.exists(p);
        console.log(`Exists ${p}:`, type);
        if (type === 'd') {
            const contents = await sftp.list(p);
            console.log(`Contents of ${p}:`);
            for(let c of contents) {
                console.log(`  - ${c.name} (${c.type})`);
            }
        }
      } catch(err) {}
    }
    
  } catch (err) {
    console.error(err.message);
  } finally {
    await sftp.end();
  }
}

main();
