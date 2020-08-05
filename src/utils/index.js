function getBoolFromStorage(itemKey) {
    try {
        const active = JSON.parse(localStorage.getItem(itemKey));
        if (!active instanceof Boolean || active === null) {
            return true;
        }
        return active;
    } catch (e) {
        return true;
    }
}

export {
    getBoolFromStorage
}