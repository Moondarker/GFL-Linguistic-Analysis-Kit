import fs from 'fs';
import yauzl from 'yauzl';
import path from 'path';

export default async function unzipFile(archiveName, destFolder) {
  return new Promise((resolve, reject) => {
    try {
      yauzl.open(archiveName, { lazyEntries: true }, function (err, zipfile) {
        if (err) reject(err);
        zipfile.readEntry();
        zipfile.on('entry', function (entry) {
          if (/\/$/.test(entry.fileName)) {
            // Directory file names end with '/'.
            // Note that entries for directories themselves are optional.
            // An entry's fileName implicitly requires its parent directories to exist.
            zipfile.readEntry();
          } else {
            // file entry
            zipfile.openReadStream(entry, function (err, readStream) {
              if (err) reject(err);
              readStream.on('end', function () {
                zipfile.readEntry();
              });
              const fullpath = path.join(destFolder, entry.fileName)
              const dirpath = path.dirname(fullpath)
              if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath, { recursive: true })
              const writeFileStream = fs.createWriteStream(fullpath);
              readStream.pipe(writeFileStream);
            });
          }
        });
        zipfile.on('end', function () {
          resolve();
        });
      });
    } catch (err) {
      reject(new Error(`Error unzipping ${archiveName}: ${err.message}`));
    }
  });
}