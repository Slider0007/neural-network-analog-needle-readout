var http = require('http');
var url = require('url');
var fs = require('fs');
var opencv = require('opencv4nodejs');

var readNeedle = require("./lib/lib_read_analog_needle");

var ImageResize = function(input, output)
{
    // Resize Image to 32x32 pixel - required input for the neural network
    var im = opencv.imread(input).resize(32,32);
    opencv.imwrite(output, im);
}

var abfrage = function(req, res) {
    var q = url.parse(req.url, true).query;
    var filename = q.url;

    if (filename)
    {
        console.log(filename);
        var file_download = fs.createWriteStream("./image_tmp/original.jpg");
        http.get(filename, (response) => {response.pipe(file_download);});

        file_download.on('finish', function(){
            file_download.end();

            ImageResize("./image_tmp/original.jpg", "./image_tmp/resize.jpg");
            images = [];
            images[0] = "./image_tmp/original.jpg"
     
//            readNeedle.AnalogReadout('./image_tmp/resize.jpg').then(result => {
            readNeedle.Readout(images).then(result => {
                console.log('Counter Readout: ' + result[0]);

                res.writeHead(200, {'Content-Type': 'text/html'});
                var txt = "";
                txt += 'Original: <p><img src=/image_tmp/original.jpg></img><p>';
                txt += 'Resize (32x32): <p><img src=/image_tmp/resize.jpg></img><p>';
                txt += "Counter_Readout:\t" + result[0].toFixed(1);

                res.end(txt);}
                )
        });
    }

    if ((req.url == '/image_tmp/resize.jpg') || (req.url == '/image_tmp/original.jpg'))
    {
        var s = fs.createReadStream("." + req.url);
        s.on('open', function () {
            res.setHeader('Content-Type', 'image/jpeg');
            s.pipe(res);
        });
    }
}

http.createServer(abfrage).listen(3000);
