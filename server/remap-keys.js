var mapShortToLong = {
    "$": "_meta",
};

function remap_keys(o){
    var build, key, destKey, ix, value;

    build = {};
    for (key in o) {
        // Get the destination key
        destKey = mapShortToLong[key] || key;

        // Get the value
        value = o[key];

        // If this is an object, recurse
        if (typeof value === "object") {
            value = remap_keys(value);
        }

        // Set it on the result using the destination key
        build[destKey] = value;
    }
    return build;
}

export default {
    remap_keys
}