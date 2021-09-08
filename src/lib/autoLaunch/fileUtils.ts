


export default {

  createFile({ directory, filePath, data }) {
    // return new Promise((resolve, reject) => mkdirp(directory, function (mkdirErr) {
    //   if (mkdirErr != null) { return reject(mkdirErr); }
    //   return fs.writeFile(filePath, data, function (writeErr) {
    //     if (writeErr != null) { return reject(writeErr); }
    //     return resolve();
    //   });
    // }));
  },

  isEnabled(filePath) {
    // return new Promise((resolve, reject) => {
    //   return fs.stat(filePath, function (err, stat) {
    //     if (err != null) { return resolve(false); }
    //     return resolve(stat != null);
    //   });
    // });
  },

  removeFile(filePath) {
    // return new Promise((resolve, reject) => {
    //   return fs.stat(filePath, function (statErr) {
    //     // If it doesn't exist, this is good so resolve
    //     if (statErr != null) { return resolve(); }

    //     return fs.unlink(filePath, function (unlinkErr) {
    //       if (unlinkErr != null) { return reject(unlinkErr); }
    //       return resolve();
    //     });
    //   });
    // });
  }
};