const fs= require('fs');
const http= require('http');
const https= require('https');
const port= 3000;
const server= http.createServer();
const stream = require('stream')

server.on("request", connection_handler);
function connection_handler(req, res){
	console.log(`New Request for ${req.url} from ${req.socket.remoteAddress}`);

	if(req.url==="/"){
		const main= fs.createReadStream('html/main.html');
		res.writeHead(200, {"Content-Type":"text/html"});
		main.pipe(res);
	} 
	else if(req.url==="/favicon.ico"){
		const main= fs.createReadStream('images/favico.ico');
		res.writeHead(200, {"Content-Type":"image/x-ico"});
		main.pipe(res);
	} 
	else if(req.url==="/images/banner.jpg"){
		const main= fs.createReadStream('images/banner.jpg');
		res.writeHead(200, {"Content-Type":"image/jpeg"})	;
		main.pipe(res);
	} 
	else if(req.url.startsWith("/album-art")){
		res.writeHead(200, {"Content-Type":"text/plain"});
		res.end("raplace with album art");	
	}
	else if(req.url.startsWith("/search")){
		const url= new URL(req.url, "https://localhost:3000");
		const Currency= url.searchParams.get("currency");
		console.log(Currency);
		create_search_request(Currency, res);
	}
	else{
		res.writeHead(404, {"Content-Type":"text/plain"});
		res.write("404 Not Found", () => res.end());
	}
}

function stream_to_message(stream, callback, ...args){
	let body= "";
	stream.on("data", chunck=> body+=chunck);
	stream.on("end", ()=> callback(body, ...args));
}

function create_search_request(Currency, res){
	const search_endpoint= 'https://v6.exchangerate-api.com/v6/API-KEY/enriched/USD/'+Currency;
	const search_request= https.request(search_endpoint);
	search_request.once("error", err => {throw err});
	search_request.once("response", (search_result_stream) => stream_to_message(search_result_stream, recived_search_result,Currency, res));
	search_request.end();
}

function recived_search_result(serialzied_search_object, currency, res){
	let search_result= JSON.parse(serialzied_search_object);
	console.log(search_result);
	let code= search_result.target_data.two_letter_code;
	console.log(code);
	const conversion= search_result.conversion_rate;
	create_search_request2(code,currency, conversion, res);
}	

function create_search_request2(code,currency, conversion, res){
	const search_endpoint2= 'https://calendarific.com/api/v2/holidays?&api_key=-API-KEY-&country='+code+'&year=2022';
	const search_request= https.request(search_endpoint2);
	search_request.once("error", err => {throw err});
	search_request.once("response", (search_result_stream2) => stream_to_message(search_result_stream2, recived_search_result2,currency, conversion, res));
	search_request.end();
}

function recived_search_result2(serialzied_search_object, currency, conversion, res){
	let search_result2= JSON.parse(serialzied_search_object);
	console.log(search_result2);
	console.log(currency);
	let hima= search_result2.response.holidays[0];
	console.log(hima);
	gen_webpage(currency, conversion, hima, res);
}	

function gen_webpage(currence, conversion, hima, res){
	res.writeHead(200,"text/plain");
	res.end('<p>'+ `${hima.name}`+ " in "+ `${hima.country.name}`+'.'+'</p>'+
	'<p>'+`The date of the holiday is ${hima.date.iso}.`+'</p>'+
	'<p>'+`The current exchange rate of the ${currence.toUpperCase()} is ${conversion} compared to USD`+'</p>');
}


server.on("listening", listening_handler);
function listening_handler(){
	console.log(`Now Listening on Port ${port}`);
}

server.listen(port);
