var xml2js = require('xml2js');
var fs = require('fs');
var mkdirp = require('mkdirp');
var util = require('util');
var toMarkdown = require('to-markdown');
var http = require('http');

processExport();

function processExport() {
	var args = process.argv.slice(2);
	var parser = new xml2js.Parser();
	mkdirp.sync('posts');

	fs.readFile(args[0], function(err, data) {
		if(err) {
			console.log('Error: ' + err);
		}

	    parser.parseString(data, function (err, result) {
	    	if(err) {
	    		console.log('Error parsing xml: ' + err);
	    	}
	    	console.log('Parsed XML');
	        //console.log(util.inspect(result.rss.channel));

	        var posts = result.rss.channel[0].item;

			
			fs.mkdir('out', function() {
		        for(var i = 0; i < posts.length; i++) {
	        		processPost(posts[i]);

	        		// if(i == 10) return;
		        	//console.log(util.inspect(posts[i]));
		        }
			});
	    });
	});
}

function processPost(post) {
	// 只处理文章类型
	if (post['wp:post_type'].toString() !== 'post') {
		return;
	}

	var filePath = 'posts/' + formatTime(post.pubDate, 'yyyy-MM-') + post.title + '.md';
	var postData = post['content:encoded'][0];

	var markdown = toMarkdown.toMarkdown(postData, {
		gfm: true
	});

	//Fix characters that markdown doesn't like
	// smart single quotes and apostrophe
	markdown = markdown.replace(/[\u2018|\u2019|\u201A]/g, "\'");
	// smart double quotes
	markdown = markdown.replace(/&quot;/g, "\"");
	markdown = markdown.replace(/[\u201C|\u201D|\u201E]/g, "\"");
	// ellipsis
	markdown = markdown.replace(/\u2026/g, "...");
	// dashes
	markdown = markdown.replace(/[\u2013|\u2014]/g, "-");
	// circumflex
	markdown = markdown.replace(/\u02C6/g, "^");
	// open angle bracket
	markdown = markdown.replace(/\u2039/g, "<");
	markdown = markdown.replace(/&lt;/g, "<");
	// close angle bracket
	markdown = markdown.replace(/\u203A/g, ">");
	markdown = markdown.replace(/&gt;/g, ">");
	// spaces
	markdown = markdown.replace(/[\u02DC|\u00A0]/g, " ");
	// ampersand
	markdown = markdown.replace(/&amp;/g, "&");

	var content = getBlogMetaInfo(post) + markdown;

	// console.log('content: ' + content);

	fs.writeFile(filePath, content, function(err) {
		err && console.log('failed to output file: ' + filePath + ', message: ' + err.message);
	});
}

function getTagCat (cats) {
	var c = [], t = [], r = [];
	if (!cats) return r;
	for (var i = 0; i < cats.length; i++) {
		var cat = cats[i];
		if (cat.$.domain == 'category') {
			c.push(cat._);
		} else {
			t.push(cat._);
		}
	}
	if (c.length) {
		r.push( 'categories: \n - ' + c.join('\n - ') );
	}
	if (t.length) {
		r.push( 'tags: \n - ' + t.join('\n - ') );
	}
	return r;
}

function getBlogMetaInfo (post) {
	var metaInfo =[
    'title: "' + post.title + '"',
    'date: ' + formatTime(post.pubDate),
    'uri: ' + post['wp:post_name']
  ];
  metaInfo = metaInfo.concat(getTagCat(post.category));
  return metaInfo.join('\n') + '\n---\n\n';
}

function downloadFile(url, path) {
	 //console.log("Attempt downloading " + url + " to " + path + ' ' + url.indexOf("https:") );
	if (url.indexOf("https:")  == -1) {
		if (url.indexOf(".jpg") >=0 || url.indexOf(".png") >=0 || url.indexOf(".png") >=0) {
			var file = fs.createWriteStream(path).on('open', function() {
				var request = http.get(url, function(response) {
				console.log("Response code: " + response.statusCode);
				response.pipe(file);
			}).on('error', function(err) {
				console.log('error downloading url: ' + url + ' to ' + path);
		});
		}).on('error', function(err) {
				console.log('error downloading url2: ' + url + ' to ' + path);

		});
	}
	else {
	  console.log ('passing on: ' + url + ' ' + url.indexOf('https:')); 
	}
	}
	else {
	  console.log ('passing on: ' + url + ' ' + url.indexOf('https:')); 
	}
}

function formatTime (timeStamp, format) {
  var D, H, M, m, ms, s, t, tt;
  if (format == null) {
    format = 'yyyy-MM-dd hh:mm:ss';
  }
  t = new Date(timeStamp);
  if (!format || isNaN(t.valueOf())) {
    return '';
  }
  M = t.getMonth() + 1;
  D = t.getDate();
  H = t.getHours();
  m = t.getMinutes();
  s = t.getSeconds();
  ms = t.getMilliseconds();
  tt = {
    yy: prefix0(t.getYear() % 100),
    yyyy: t.getFullYear(),
    MM: prefix0(M),
    M: M,
    dd: prefix0(D),
    d: D,
    hh: prefix0(H),
    h: H,
    mm: prefix0(m),
    m: m,
    ss: prefix0(s),
    s: s,
    ms: ms
  };
  return format.replace(/[a-z]+/ig, function($0) {
    var _ref;
    return (_ref = tt[$0]) != null ? _ref : $0;
  });
}

function prefix0 (n, len) {
  if (len == null) {
    len = 2;
  }
  n = "" + n;
  if (n.length < len) {
    n = Array(len - n.length + 1).join('0') + n;
  }
  return n;
}
