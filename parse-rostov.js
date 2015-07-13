console.log('Parsing started');

var _ = require('lodash');
var Horseman = require("node-horseman"); // требует PhantomJS!
var cheerio = require('cheerio');
var fs = require('fs');

var joinLines = function(lines){
    return [].join.call(lines, '\r\n');
};

var parseToCsv = function(html){
    var $ = cheerio.load(html);
    var lines = $('.rgRow, .rgAltRow').map(
        function(index, tr){
            var tds = $(tr.children).map(function(index, td){
                if (td.children){
                    var data = td.children[0].data.trim();
                    if (data) return ('"'+(td.children[0].data)+'"');
                }
            });
            return [].join.call(tds, ', ');
        });
    return joinLines(lines);
};

var horseman = new Horseman();
var page = horseman.open('http://mindortrans.donland.ru/Default.aspx?pageid=103322');

var lines = _.times(10, function(index){
    console.log('Page #'+ (1+index) + ' parsing...');
    var html = page.html('#ctl01_mainContent_ctl00_carryPermissionsList_RadGrid1_ctl00');
    if (!html) throw new Error("html match error");
    var csv = parseToCsv(html);
    if (!csv) throw new Error("html parse error");
    page.click('.rgPageNext').waitForNextPage();
    // Запрос новой страницы занимает на порядок больше времени чем ее парсинг,
    // поэтому от распараллеливания не будет большой пользы.
    return csv;
});

fs.writeFile('./rostov20-15.csv', joinLines(lines), function(err){
    if (err) throw new Error(err);
    console.log('Parsing finished!');
});

horseman.close();