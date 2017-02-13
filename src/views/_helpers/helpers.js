module.exports.register = function (Handlebars, opts, params)  { 
  Handlebars.registerHelper('json', function(obj) {
    return JSON.stringify(obj);
  });
};