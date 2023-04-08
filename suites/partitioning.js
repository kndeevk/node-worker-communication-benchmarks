const { Suite } = require('benchmark')
const prettierBytes = require('prettier-bytes')
const { relaxedForEach } = require('../utils/relaxedForEach')

const allData = require('../data')

function asyncForEach(array, fn) {
  return new Promise(resolve => {
      var index = 0;
      function doChunk() {
          fn(array[index]);
          ++index;
          if (index < array.length) {
              setImmediate(doChunk)
          } else {
              resolve();
          }
      }    
      doChunk();    
  });
}


module.exports = Object.entries(allData).map(([ size, data ]) => {
  const byteSize = data.asPrettyJSONString.length
  const times = Math.round((1 * 1024 * 1024) / byteSize)
  const totalSize = times * byteSize

  const maxBlockValues = [0.001, 0.1, 1, 5, 10]

  const suite =  new Suite(`partitioning ${prettierBytes(totalSize)} of ${size} ${prettierBytes(byteSize)} JSON strings serialization`)
    .on('start', () => {
    });

    const testData = []
    for (let i=0;i<times;i++) {
        testData.push(data.asParsedObjects);
    }
  

    suite.add(`sync version`, async deferred => {
      testData.forEach((elem) => {
        JSON.parse(JSON.stringify(elem));
      })

      deferred.resolve()

    }, { defer: true })

    suite.add(`async version`, async deferred => {
      await asyncForEach(testData, (elem) => {
        JSON.parse(JSON.stringify(elem));
      });

      deferred.resolve()

    }, { defer: true })

    for (let maxBlock of maxBlockValues) {
      suite.add(`unblocking every ${maxBlock} ms`, async deferred => {     
        await relaxedForEach(testData, (elem) => {
          JSON.parse(JSON.stringify(elem));
        }, maxBlock);

        deferred.resolve()

      }, { defer: true })
    }
    suite.on('complete', () => {
    });

    return suite;
})
