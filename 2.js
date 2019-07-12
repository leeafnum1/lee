const fs = require('fs');
fs.open('test.txt', 'w', (err, fd) =>{
	if(err) throw err;
	fs.write(fd, "Hello world",(err, written)=>{
		if(err) throw err;
	console.log(written + "bytes Written");
	fs.close( fd, ()=>{
		console.log('Done');
	});
	});
});
