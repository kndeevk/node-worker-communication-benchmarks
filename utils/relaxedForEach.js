function relaxedForEach(array, fn, maxBlock) {
    return new Promise(resolve => {
        maxBlock = maxBlock || 1; // in milliseconds
        var index = 0;

        function now() {
            return new Date().getTime();
        }

        let unblockCount = 0;

        function doChunk() {
            var startTime = now();
            while (index < array.length && (now() - startTime) <= maxBlock) {
                fn(array[index]);
                ++index;
            }
            if (index < array.length) {
                unblockCount += 1;
                // setTimeout(doChunk, 1);
                setImmediate(doChunk)
            } else {
                // console.log(`Unblocked ${unblockCount} times`)
                resolve();
            }
        }    
        doChunk(); 
    });
}

module.exports = { relaxedForEach };