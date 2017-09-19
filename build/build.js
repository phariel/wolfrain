({
    baseUrl: "../public/_scripts",
    paths: {
        jquery: 'jquery.min',
        bootstrap: 'bootstrap.min'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        }
    },
    name: "main",
    out: "../public/_scripts/dist/main.min.js"
})