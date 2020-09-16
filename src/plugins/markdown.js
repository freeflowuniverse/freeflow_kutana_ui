import Vue from 'vue';
import VueDOMPurifyHTML from 'vue-dompurify-html';
import marked from 'marked';
import hljs from 'highlight.js';

import 'highlight.js/scss/solarized-dark.scss';

Vue.use(VueDOMPurifyHTML, {
    default: {
        USE_PROFILES:  {
            html: true
        },
        ADD_ATTR:['target', 'noreferrer']
    }
});

const renderer = new marked.Renderer();
const linkRenderer = renderer.link;
renderer.link = (href, title, text) => {
    const html = linkRenderer.call(renderer, href, title, text);
    return html.replace(/^<a /, '<a target="_blank" rel="noopener" noreferrer ');
};

renderer.html = (html => {
    return html.replace(/[\u00A0-\u9999<>&](?!#)/gim, function(i) {
        return '&#' + i.charCodeAt(0) + ';';
    });
})

marked.setOptions({
    renderer,
    highlight: function(code, language) {
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
        return hljs.highlight(validLanguage, code).value;
    },
});