var mysql = require('mysql');
db_config = {
	    host:'127.0.0.1',
	    port : 3306,
	    user:'club1004',
	    password:'lamxu##$$',
	    database:'club1004',
	    connectionLimit:20,
	    waitForConnections:false,
	    debug    :  false

	};


var pool = mysql.createPool(db_config);
 
module.exports = pool;