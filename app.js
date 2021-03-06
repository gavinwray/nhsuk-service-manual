// Core dependencies
const path = require('path');
const fs = require('fs');

// External dependencies
const express = require('express');
const nunjucks = require('nunjucks');
const chalk = require('chalk');
const highlightjs = require('highlight.js');

// Set configuration variables
const port = process.env.PORT || 3000;

// Local dependencies
const authentication = require('./middleware/authentication');
const config = require('./app/config');
const fileHelper = require('./middleware/file-helper.js');
const locals = require('./app/locals');
const routing = require('./middleware/routing.js');

// Initialise applications
const app = express()

// Authentication middleware
app.use(authentication);

// Use local variables
app.use(locals(config));

// Middleware to serve static assets
app.use('/service-manual', express.static(path.join(__dirname, 'public')));
app.use('/service-manual/nhsuk-frontend', express.static(path.join(__dirname, '/node_modules/nhsuk-frontend/dist')));
app.use('/service-manual/nhsuk-frontend', express.static(path.join(__dirname, '/node_modules/nhsuk-frontend/packages')));
app.use('/service-manual/iframe-resizer', express.static(path.join(__dirname, 'node_modules/iframe-resizer/')))

// View engine (nunjucks)
app.set('view engine', 'njk');

// Nunjucks configuration
var appViews = [
  path.join(__dirname, '/app/views/'),
  path.join(__dirname, '/node_modules/nhsuk-frontend/packages/components')
]

var env = nunjucks.configure(appViews, {
  autoescape: true,
  express: app,
  noCache: true,
  watch: true
})

/*
 * Add some global nunjucks helpers
 */
env.addGlobal('getHTMLCode', fileHelper.getHTMLCode)
env.addGlobal('getNunjucksCode', fileHelper.getNunjucksCode)
env.addFilter('highlight', function(code, language) {
  const languages = language ? [language] : false
  return highlightjs.highlightAuto(code.trim(), languages).value
})

// Render standalone design examples
app.get('/service-manual/design-example/:example', function(req, res) {
  var example = req.params.example
  var examplePath = path.join(__dirname, `/app/components/${example}.njk`)

  // Get the given example as HTML.
  exampleHtml = fileHelper.getHTMLCode(examplePath)

  // Wrap the example HTML in a basic html base template.
  res.render('includes/design-example-wrapper.njk', { body: exampleHtml })
})

app.get('/', (req, res) => {
  res.redirect('/service-manual');
});

// The content style guide pages have moved to /content
// Temporary redirect incase anyone still visits /content-style-guide
app.get('/service-manual/content-style-guide', (req, res) => {
  res.redirect('/service-manual/content');
});

// The grid page has moved to /layout
// Temporary redirect incase anyone still visits /grid
app.get('/service-manual/styles-components-patterns/grid', (req, res) => {
  res.redirect('/service-manual/styles-components-patterns/layout');
});

// Automatically route pages
app.get(/^([^.]+)$/, function (req, res, next) {
  routing.matchRoutes(req, res, next)
})

app.get('*', function(req, res){
  res.statusCode = 404;
  res.render('page-not-found');
});

// Run the application
app.listen(port, () => {
  console.log(chalk.green(`App is running and watching for changes at http://localhost:${port}/service-manual`));
});

module.exports = app;
