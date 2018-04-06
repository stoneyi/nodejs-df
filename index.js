const express = require('express');
const app = express();
const fs = require("fs");
const readline = require('readline');

const bodyParser = require('body-parser');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/', fileFilter: fileFilter})
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const AVAIL_THRESHOLD = 1024*1024*3;  //3GB
const USED_PERCENT = 75;   //75%


// check file type, only allow plain/text file
function fileFilter (req, file, cb){
  var type = file.mimetype;
  var typeArray = type.split("/");
  if (typeArray[0] == "text") {
    cb(null, true);
  }else {
    cb(null, false);
  }
}

app.use(express.static(__dirname + '/static'));


// routing
app.get('/', (req, res) => res.sendFile('index.html'))

app.post('/process', urlencodedParser, (req, res) => {
	
	response = [];
    data = req.body.data;
    lines = data.split('\n');
    // response.push(lines[0]);
    for (let i=1; i<lines.length; i++) {
   	    if(validate_line(lines[i])){
   	    	response.push(lines[i]);
   	    }
    }
   // console.log(response);
   res.json(response);
})

app.post('/upload', upload.single('file'), function (req, res) {
	response = [];
	if(!req.file){
		throw new Error("File type not supported!");
	}
	// console.log(req.file.filename);
    file = __dirname + "/" + req.file.path;
    const rl = readline.createInterface({
    	input: fs.createReadStream(file)
    });
    rl.on('line', function (line) {
    	if(validate_line(line)){
    		response.push(line);
    	}
    }).on('close', function(){
    	res.json(response);
    });
})

function validate_line(line){
	let cols = line.split(/\s+/);
	if (parseInt(cols[3]) < AVAIL_THRESHOLD && parseInt(cols[4].slice(0, cols[4].length-1)) > USED_PERCENT){
		return true;
   	}
   	return false;
}

// express error-handling middleware
app.use(function (err, req, res, next) {
  // console.log(err);
  // to the next or the default error handler
  // next(err);
  res.status(500).json({error: err.message});
})

app.listen(3000, () => console.log('df_web app listening on port 3000!'))
