import MarkdownIt from 'markdown-it'
import markdownItLatex from 'markdown-it-latex'
import 'markdown-it-latex/dist/index.css'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

const mdParser = new MarkdownIt({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str, true).value;
            } catch (__) {}
        }
        return ''; // use external default escaping
    }
})
mdParser.use(markdownItLatex)

export { mdParser }
