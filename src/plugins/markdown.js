import Vue from 'vue';
import VueDOMPurifyHTML from 'vue-dompurify-html';
import marked from 'marked';
import hljs from 'highlight.js';

import 'highlight.js/scss/solarized-dark.scss';

Vue.use(VueDOMPurifyHTML, {
    default: {
        ALLOWED_TAGS: ['pre', 'code', 'span', 'a'],
        FORBID_TAGS: ['style']
    }
});

marked.setOptions({
    highlight: function(code, language) {
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
        return hljs.highlight(validLanguage, code).value;
    },
});