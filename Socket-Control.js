var WebSocket = require('ws');
var url = require('url');
var pool = require("./db-pool");
var cron = require('node-cron');

var socketList=[]; 
//cron.schedule('*/10 * * * * *', function(){
//	socketList.forEach(function(data,i) {
//		var now = new Date();
//		var pingDate =socketList[i].pingDate;
//		if(pingDate !=null){
//			var gap = now.getTime()- pingDate.getTime();
//			var sec_gap = gap /1000;
//			if(socketList[i] !=null){
//				var delRno =socketList[i].roomno;
//				if(sec_gap >15){
//					console.log('delete Socket = '+ socketList[i].nickname);
//					socketList.splice(i,1);
//					socketList.forEach(function(data2,y) {
//						if(delRno !=socketList[y].roomno)return;
//						
//						socketList[y].ws.send(JSON.stringify( {type:'sendMyInfo',data:{action:"del"}}));
//					});
//				}
//			}
//		}
//
//	});
//});
cron.schedule('*/3 * * * * *', function(){
	var m_no =[];
	var m_id = [];
	var m_nickname = [];
	var m_gender =[];
	var m_status =[];
	var roomno =[]; 
	var m_profile_img =[];
	var y= 0;
	var now = new Date();
	var tempSocketList =socketList;
	tempSocketList.forEach(function(data,i) { 
		console.log(i + " - " + y + " - "+ data.m_nickname + " = " + data.m_type);
		if(data.m_type != 3){
			roomno[y] =data.roomno;
			m_no[y]= data.m_no;
			m_id[y]= data.m_id;
			m_nickname[y]= data.m_nickname;
			m_gender[y]= data.m_gender;
			m_status[y]=data.m_status;
			m_profile_img[y] = data.m_profile_img;
			y = y+ 1 ;
		}

	});
	console.log(m_nickname);
	socketList.forEach(function(data,i) { 
		
		socketList[i].ws.send(JSON.stringify({
			type:'userList',
			roomno:roomno,
			m_no:m_no ,
			m_id:m_id,
			m_nickname:m_nickname,
			m_gender:m_gender,
			m_status:m_status,
			m_profile_img:m_profile_img
		}));
	});
});
module.exports =exports = function(server, socketCallback) {
	var wss = new WebSocket.Server({ server });
	
	
	wss.broadcast = function broadcast(data) {
		wss.clients.forEach(function each(client) {

//			console.log(data);
			client.send(data);
		});
	};

	wss.on('connection', function(ws,req) {
		var q = url.parse(req.url, true);
		
		console.log("pathName:"+q.pathname);
		console.log("host:"+q.host);
		console.log("query:"+JSON.stringify(q.query));
		console.log("accept:"+JSON.stringify(req.headers));
		var duplCheck=socketList.findIndex(i => String(i.m_no) === String(q.query.m_no));
		if(duplCheck != -1){
			ws.send("duplLogin");
			return;
		}
		var myInfo={ws:ws,
				host:q.host,
				roomno:q.query.roomno,
				m_no:q.query.m_no,
				m_id:q.query.m_id,
				m_nickname:q.query.m_nickname,
				m_gender:q.query.m_gender,
				m_status:q.query.m_status,
				m_profile_img :q.query.m_profile_img,
				m_type :q.query.m_type,
				branch_code :q.query.branch_code,
				you_m_no :q.query.you_m_no,
				h_idx : null,
				pingDate : null,
				status:true
			};

		var count=0;
		socketList.push(myInfo);
		var my_ws=ws;
		
		var newArr = socketList.filter(function(item){ 
				if(item.roomno == q.query.roomno ){
					return true;
				}else{
					return false;
				}
			  
			});  
		
//		ws.send(JSON.stringify({type:'userCount',data:{roomUserCount:newArr.length,serverUserCount:socketList.length}}));
		ws.on('message', function(message) {
			
			//wss.broadcast(message);
			
			
			var receiveData;
			try {
				receiveData=JSON.parse(message);
				
			}catch(e){
				
				receiveData = message;
			}
			//message_data.event.data.data= message
			if(receiveData=='ping'){
//				console.log(myInfo);
				myInfo.pingDate = new Date();
			}
			if(receiveData=='userList'){
				var m_no =[];
				var m_id = [];
				var m_nickname = [];
				var m_gender =[];
				var m_status =[];
				var roomno =[]; 
				var m_profile_img =[];
				var y= 0;
				var tempSocketList =socketList;
				tempSocketList.forEach(function(data,i) { 
//					console.log(y + " -"+ data.m_nickname);
					if(data.m_type != 3){
						
						roomno[y] =data.roomno;
						m_no[y]= data.m_no;
						m_id[y]= data.m_id;
						
						m_nickname[y]= data.m_nickname;
						m_gender[y]= data.m_gender;
						m_status[y]=data.m_status;
						m_profile_img[y] = data.m_profile_img;
						y = y+ 1 ;
					}

				});
				ws.send(JSON.stringify({
					type:'userList',
					roomno:roomno,
					m_no:m_no ,
					m_id:m_id,
					m_nickname:m_nickname,
					m_gender:m_gender,
					m_status:m_status,
					m_profile_img:m_profile_img
				}));
				return;
			}
			if(receiveData.type=='getUserStatus'){
				var data = receiveData.data;
				for(var y = 0 ; y <data.length ; y++){
					var check=socketList.findIndex(i => String(i.m_no) === String(data[y]));
					if(check != -1){
						var chatYn ='N';
						if(socketList[check].roomno != socketList[check].m_id){
							 chatYn ='Y';
						}
						ws.send(JSON.stringify({
							type:'getUserStatus',
							m_no:socketList[check].m_no ,
							m_status:socketList[check].m_status ,
							chatYn:chatYn
						}));
					}
				}
				return;
			}
			if(receiveData.type=='waitPing'){
				var you_m_no = receiveData.you_m_no;
				var check=socketList.findIndex(i => String(i.m_no) === String(you_m_no));
				if(check != -1){
					ws.send(JSON.stringify({
						type:'waitPong',
						data:socketList[check].roomno 
					}));
				}else{
//					ws.send(JSON.stringify({
//						type:'waitPong',
//						data:'NOT'
//					}));
				}
				return;
			}
			if(receiveData.type=='rejectRoom'){
				var check=socketList.findIndex(i => String(i.m_no) === String(receiveData.m_no));
				if(check != -1){
					socketList[check].ws.send(JSON.stringify(receiveData));
				}
				return;
			}
			if(receiveData.type=='profie_chg'){
				
				var check=socketList.findIndex(i => String(i.m_no) === String(receiveData.m_no));
//				console.log(socketList);
//				console.log(receiveData.m_no);
				if(check != -1){
					socketList[check].m_profile_img = receiveData.m_profile_img;
					socketList[check].m_nickname = receiveData.m_nickname;
//					console.log(socketList[check].m_profile_img);
				}
				
				return;
			}
			if(receiveData.type=='chatRequest'){
				
				var check=socketList.findIndex(i => String(i.m_no) === String(receiveData.target_m_no));
				if(check != -1){
					socketList[check].ws.send(JSON.stringify(receiveData));
				}
				
				return;
			}
			if(receiveData.type=='requestRefusal'){
				
				var check=socketList.findIndex(i => String(i.roomno) === String(receiveData.roomno));
				if(check != -1){
					socketList[check].ws.send(JSON.stringify(receiveData));
				}
				
				return;
			}
			if(receiveData.type=='hIdxSend'){
				socketList.forEach(function(data,i) {
					if(receiveData.r_id ==socketList[i].roomno){
						socketList[i].h_idx = receiveData.data;
//						console.log(socketList[i].h_idx);
//						console.log(socketList[i].roomno);
					}
				});
			}
			if(receiveData.type=='pointUpdateM'){
				
				var minus_m_no =receiveData.minus_m_no ;
				var chatType  = receiveData.chatType ;
				var priceType ="video_price";
				if (chatType==2){
					priceType = "voice_price";
				}
				pool.getConnection(function(err,connection){ 
					connection.query('UPDATE  tbl_history SET use_money = use_money + (SELECT '+priceType+' FROM (SELECT '+priceType+'  FROM tbl_member WHERE m_no='+minus_m_no+' ) as tt) WHERE h_idx = ? ',[receiveData.h_idx], function (err, rows) {
				            if(err){
				                connection.release();
				                throw err;
				            }
				    });  
			        var sql ="UPDATE  tbl_member SET m_point = m_point -  (SELECT "+priceType+" FROM (SELECT "+priceType+"  FROM tbl_member WHERE m_no="+minus_m_no+" ) as tt)  WHERE m_no =( select * from (select if( (SELECT tm2.branch_code FROM tbl_member as tm2 WHERE  tm2.m_no ="+minus_m_no+" AND tm2.branch_code != '')!='' ,(SELECT tm3.branch_no FROM tbl_member as tm3 WHERE  tm3.m_no ="+minus_m_no+" ) ,"+minus_m_no+") from dual)as tc)";
//			        console.log(sql);
			        connection.query(sql, function (err, rows) {
			        	if(err){
			                connection.release();
			                throw err;
			            } 
			        });
					connection.query("UPDATE  tbl_history SET man_last_point = (SELECT m_point FROM (SELECT m_point  FROM tbl_member WHERE m_no=( select * from (select if( (SELECT tm2.branch_code FROM tbl_member as tm2 WHERE  tm2.m_no ="+minus_m_no+" AND tm2.branch_code != '')!='' ,(SELECT tm3.branch_no FROM tbl_member as tm3 WHERE  tm3.m_no ="+minus_m_no+" ) ,"+minus_m_no+") from dual)as tc) ) as tt) WHERE h_idx = ? ",[receiveData.h_idx], function (err, rows) {
			            if(err){
			                connection.release();
			                throw err;
			            }
			            connection.release();
					});  
				}); 
				ws.send("pointUpdateOK");
				return;
			}
			if(receiveData.type=='pointUpdateF'){
				var plus_m_no =receiveData.plus_m_no ;
				var chatType  =receiveData.chatType ;
				var priceType ="video_price";
				if (chatType==2){
					priceType = "voice_price";
				}
				pool.getConnection(function(err,connection){ 	
					connection.query('UPDATE  tbl_history SET plus_money = plus_money + (select '+priceType+' from (SELECT '+priceType+'  FROM tbl_member WHERE m_no='+plus_m_no+' ) as tt) WHERE h_idx = ? ',[receiveData.h_idx], function (err, rows) {
			            if(err){
			                connection.release();
			                throw err;
			            }
					});  

			        connection.query("UPDATE  tbl_member SET m_point = m_point +  (select "+priceType+" from (SELECT "+priceType+"  FROM tbl_member WHERE m_no="+plus_m_no+" ) as tt) WHERE m_no ="+plus_m_no+" ",function (err, rows) {
			        	if(err){
			                connection.release();
			                throw err;
			            } 
			        });
					connection.query('UPDATE  tbl_history SET woman_last_point = (select m_point from (SELECT m_point  FROM tbl_member WHERE m_no='+plus_m_no+' ) as tt) WHERE h_idx = ? ',[receiveData.h_idx], function (err, rows) {
			            if(err){
			                connection.release();
			                throw err;
			            }
			            connection.release();
					});  
				}); 
				ws.send("pointUpdateOK");
				return;
			}
//			console.log("query:"+JSON.stringify(q.query) +"\n"+"data:"+receiveData);
			socketList.forEach(function(data,i) {
				
				try{
					if(!socketList[i].status)return;
					if(ws==socketList[i].ws)return;
					//console.log(q.host+":"+socketList[i].host);
					if(q.host!=socketList[i].host)return;
					//console.log(q.pathname+":"+socketList[i].roomno);
					if(q.query.roomno!=socketList[i].roomno)return;

				
					socketList[i].ws.send(JSON.stringify(receiveData));
				}catch(e){
					console.log("e.name:"+e.name);
					console.log("e.message:"+e.message);
					console.log("e.description:"+e.description);
					console.log("catch:"+socketList.length+"/"+socketList[i].m_id);
					if(e.message=="not opened")return;
					
//					console.log(socketList.length);
				}
			});
		});
		ws.on('close', function() {
//			console.log(socketList.length);
			//socketList.splice(index,1);
			
			var my_idx=socketList.findIndex(i => i.ws === my_ws);
			var m_hidx = null;
			var m_you_m_no =null;
			
			if(my_idx != -1){
				m_hidx =socketList[my_idx].h_idx ;
				m_you_m_no = socketList[my_idx].you_m_no;
			}
			
			if(m_hidx!=null && m_hidx!=""){
				var sql ="";
				sql ="UPDATE  tbl_history SET end_datetime = sysdate() WHERE end_datetime IS NULL AND h_idx =  "+m_hidx;
//				console.log(sql);
				pool.getConnection(function(err,connection){
					connection.query(sql, function (err, rows) {
						 if(err){
			                 connection.release();
			                 throw err;
			             }
						 connection.release();
					});
					
				});
			}
			if(m_you_m_no !=null && m_you_m_no !=""){
				var check=socketList.findIndex(i => String(i.m_no) === String(m_you_m_no));
				if(check != -1){
					socketList[check].ws.send(JSON.stringify({
						type:'ClosePOP'
					}));
				}
			}
			socketList.splice(my_idx,1);
//			console.log(socketList.length);
			

			socketList.forEach(function(data,i) {
				try{
					if(!socketList[i].status)return;
					if(ws==socketList[i].ws)return;
					if(q.host!=socketList[i].host)return;
					if(q.query.roomno!=socketList[i].roomno)return;
					

					
					socketList[i].ws.send(JSON.stringify( {type:'sendMyInfo',data:{action:"del"}}));
					
				}catch(e){
					console.log("e.name:"+e.name);
					console.log("e.message:"+e.message);
					console.log("e.description:"+e.description);
					console.log("catch:"+socketList.length+"/"+socketList[i].userid);
					if(e.message=="not opened")return;
					
//					console.log(socketList.length);
				}
			});
		});
		ws.on('error', function(e) {
			console.log("ws.on('error:"+e);
		});
		//ws.send('You successfully connected to the websocket.');
		if(socketCallback){socketCallback}
	});
	
}
