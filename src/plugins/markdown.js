import Vue from 'vue';
import VueDOMPurifyHTML from 'vue-dompurify-html';
import marked from 'marked';
import hljs from 'highlight.js';

import 'highlight.js/scss/solarized-dark.scss';

Vue.use(VueDOMPurifyHTML, {
    default: {
        ALLOWED_TAGS: ['pre', 'code', 'span', 'a'],
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['style']
    }
});

const renderer = new marked.Renderer();
const linkRenderer = renderer.link;
renderer.link = (href, title, text) => {
    const html = linkRenderer.call(renderer, href, title, text);
    return html.replace(/^<a /, '<a target="_blank" ');
};

marked.setOptions({
    renderer,
    highlight: function(code, language) {
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
        return hljs.highlight(validLanguage, code).value;
    },
});