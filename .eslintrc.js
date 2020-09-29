module.exports = {
    root: true,
    ignorePatterns: ['**/tests/**/*.js'],
    env: {
        node: true,
    },
    extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/prettier'],
    parserOptions: {
        parser: 'babel-eslint',
    },
    rules: {
        'no-unused-vars': [
            'warn',
            {
                vars: 'all',
                args: 'none',
                ignoreRestSiblings: false,
            },
        ],
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-useless-escape': 'off',
        semi: 'error',
    },
};
