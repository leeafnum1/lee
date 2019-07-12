const fs = require('fs');
fs.open('test.txt', 'a', (err, fd) =>{
	if(err) throw err;
	fs.write(fd, "Update", 4, (err, written)=>{
		if(err) throw err;
	console.log(written + "bytes Written");
	fs.close( fd, ()=>{
		console.log('Done');
	});
	});
});
