export default {
    stringGenerator(length = 20) {
        let random = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            random += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return random;
    },
};
