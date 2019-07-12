var express = require('express');
var router = express.Router(); 
var pool = require("../db-pool");
var util = require('util');
var multer = require("multer");
var path = require('path');
var cron = require('node-cron');
let storage = multer.diskStorage({ 
	  destination: function(req, file ,callback){
	    callback(null, "public/uploads/")
	  },
	  filename: function(req, file, callback){
	    let extension = path.extname(file.originalname);
	    let basename = path.basename(file.originalname, extension); 
	    callback(null, basename + "-" + Date.now() + extension);
	  } 
	}); 
	   
	let upload = multer({
	  storage: storage
	});
cron.schedule('*/45 * * * * *', function(){
	pool.getConnection(function(err,connection){
		connection.query("UPDATE  tbl_member SET m_login ='N' WHERE TIMESTAMPDIFF(second,  date_format(access_date, '%Y-%m-%d %H:%i:%s'),sysdate()) >15  AND m_login ='Y' ",function (err, rows) {
	            if(err){
	                connection.release();
	                throw err;
	            }
	             connection.release();
	    });
	}); 
});
mobile_check=function(ua){
    if(/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile|ipad|android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(ua)) {
    	//mobile
    	return true;
    } else { 
    	//pc
    	return false;
    }
}
session_check = function(req,res){
	var user_session = req.session;
	var u_info = user_session.u_info;
	
	if(u_info==null){
		res.send("<script>alert('로그인이 필요한 페이지입니다.');parent.location='/';</script>"); 
		return false;
	}else{
		return true;  
	}       
}    
router.get('/', function(req, res, next) {
	var user_session = req.session;
	var u_info = user_session.u_info;
	if(u_info==null){
	  	if(mobile_check(req.header('user-agent'))) {
	  		 res.render('indexM', { title: 'Express' });
		}else{
			 res.render('index', { title: 'Express' });
		}
	}else{
		if(u_info.m_type==1 ){
			res.redirect('/main');
		}else if(u_info.m_type==2 ){
			res.redirect('/branch/main');
		}else if(u_info.m_type==3 ){
			res.redirect('/branch_mgmt');
		}else if(u_info.m_type==4 ){
			res.redirect('/mgmt/member');
		}
		 
	}


});
router.get('/join', function(req, res, next) {
  res.render('member/join');
});
router.get('/duplLogin', function(req, res, next) {
	  res.render('duplLogin');
	});
router.post('/join_ok', function(req, res, next) {
	var m_id = req.body.m_id;
	var m_password = req.body.m_password;
	var m_gender = req.body.m_gender;
	var m_nickname = req.body.m_nickname;
	var video_price  =0;
	var voice_price = 0;
	var freeprice_second =0;
	if(m_gender =='M'){
		video_price  =250;
		voice_price = 150;
		freeprice_second =5;
	}
	pool.getConnection(function(err,connection){
		connection.query('INSERT INTO tbl_member(M_ID ,M_PASSWORD ,M_GENDER ,M_NICKNAME  ,M_REGDATE, M_TYPE,VIDEO_PRICE,VOICE_PRICE,FREEPRICE_SECOND) VALUES (?,?,?,?,sysdate(),1,?,?,?)',[m_id,m_password,m_gender,m_nickname,video_price,voice_price,freeprice_second], function (err, rows) {
	            if(err){
	                connection.release();
	                throw err;
	            }
	             connection.release();
	             res.send("<script>alert('회원가입이 완료되었습니다.');location.href='/';</script>"); 
	    });
	}); 
});
router.post('/login', function(req, res, next) {
	var m_id = req.body.m_id;
	var m_password = req.body.m_password;
	if(req.session.u_info!= null){
		  res.send("<script>alert('1개의 PC로 여러아이디 사용이 불가능합니다.\\n기존 로그인되어있는 아이디 로그아웃 후 이용바랍니다..');parent.location='/';</script>");
	}else{
		var selectSql ="SELECT m_no, m_id, m_password, m_gender, m_nickname, m_profile_img, m_point, m_regdate, m_moddate, m_login, m_status,m_type ,video_price,voice_price,freeprice_second	FROM tbl_member WHERE M_ID =? AND M_PASSWORD =? ";
		pool.getConnection(function(err,connection){
			var query = connection.query(selectSql,[m_id,m_password], function (err, rows) {
				if(err){
		            connection.release();
		            throw err;
				}else{
					connection.release();
					 if(rows!=null && rows.length>0){
						 if(rows[0].m_login == 'Y'){
							   res.send("<script>alert('이미 로그인 되어있는 아이디입니다. \\n 비정상 종료의 경우 30초후 로그인이 가능합니다.');parent.location='/';</script>"); 
						 }else{
							 req.session.u_info={
									    m_no : rows[0].m_no ,
					   					m_id : m_id,
					   					m_nickname : rows[0].m_nickname,
					   					m_profile_img : rows[0].m_profile_img , 
					   					m_gender : rows[0].m_gender , 
					   					m_nickname : rows[0].m_nickname ,
					   					m_type :  rows[0].m_type ,
					   					m_status  :  rows[0].m_status ,
					   					branch_code : null,
					   					branch_no : null,
					   					video_price :  rows[0].video_price ,
					   					voice_price :  rows[0].voice_price ,
					   					freeprice_second :  rows[0].freeprice_second ,
					   					m_profile_img: rows[0].m_profile_img 
					   		    };
							   
							   if(rows[0].m_type == 1){
								   res.redirect('/main');
							   }else if(rows[0].m_type == 2){
								   req.session.u_info =null;
								   res.send("<script>alert('지점회원은 지점페이지에서만 로그인가능합니다.');parent.location='/';</script>"); 
							   }else if(rows[0].m_type == 3){
								   req.session.u_info =null;
								   res.send("<script>alert('지점회원은 지점페이지에서만 로그인가능합니다');parent.location='/';</script>"); 
							   }else if(rows[0].m_type == 4){
								   req.session.u_info =null;
								   res.send("<script>alert('관리자는 관리자 페이지에서만 로그인가능합니다.');parent.location='/';</script>"); 
							   }
						 }
				          
					 }else{
						 res.send("<script>alert('회원정보가 존재하지 않습니다.');parent.location='/';</script>"); 
					 }

				}
			});
		});
	}
	 
	
});
router.get('/logout', function(req, res){
	var user_session = req.session;
	var dirUrl = '/';
	if(user_session.u_info != null){
		var u_info = user_session.u_info;
		var m_type  = u_info.m_type;
		var m_no  = u_info.m_no;
		pool.getConnection(function(err,connection){
			connection.query("UPDATE tbl_member SET  m_login ='N'  WHERE m_no = "+m_no, function (err, rows) {
		            if(err){
		                connection.release();
		                throw err;
		            }
		             connection.release();
		    });
		}); 

		if(m_type ==2 || m_type ==3){
			dirUrl ='/branch';
		}else if(m_type ==4){
			dirUrl ='/mgmt';
		}
	}

	
    req.session.destroy(function(err){
         if(err){
             console.log(err);
         }else{
             res.redirect(dirUrl);
         }
     });


});
router.post('/duplCheck', function(req, res, next) {
	var type = req.body.type;
	var duplText = req.body.duplText;
	var selectSql ="SELECT m_no FROM tbl_member WHERE "+  type + " ='"+  duplText+"'";
	console.log(selectSql);
	pool.getConnection(function(err,connection){
		var query = connection.query(selectSql, function (err, rows) {
			if(err){
	            connection.release();
	            throw err;
			}else{
				 if(rows!=null && rows.length>0){
					 connection.release();
					 var user_session = req.session; 
					 if (user_session.u_info!=null &&user_session.u_info.m_no!=null){
						 if(user_session.u_info.m_no ==rows[0].m_no){
							 res.send("ok");  
						 }else{
							 res.send("fail");  
						 }
					 }else{
						 res.send("fail");  
					 }
						
					
				 }else{
					 connection.release();
					 res.send("ok"); 
				 }

			}
		});
	});
 	
});
router.get('/main', function(req, res, next) {
	var user_session = req.session; 
	var u_info = user_session.u_info;
	if(session_check(req,res)){
		var m_no = u_info.m_no;
	  	if(mobile_check(req.header('user-agent'))) {
	  		res.render('member/mainM',{ session: user_session});
	  	}else{
	  		res.render('member/main',{ session: user_session});
	  	}
		
	}
});
router.get('/mainon', function(req, res, next) {
	var user_session = req.session; 
	var u_info = user_session.u_info;
	
	var m_no = u_info.m_no;
	pool.getConnection(function(err,connection){
		connection.query("UPDATE tbl_member SET  m_login ='Y'  WHERE m_no = "+m_no, function (err, rows) {
	            if(err){
	                connection.release();
	                throw err;
	            }
	             connection.release();
	    });
	}); 
	res.send("OK"); 
});
router.get('/mainout', function(req, res, next) {
	var user_session = req.session; 
	var u_info = user_session.u_info;
	
	var m_no = u_info.m_no;
	pool.getConnection(function(err,connection){
		connection.query("UPDATE tbl_member SET  m_login ='N'  WHERE m_no = "+m_no, function (err, rows) {
	            if(err){
	                connection.release();
	                throw err;
	            }
	             connection.release();
	    });
	}); 
	res.send("OK");   
});
router.post('/userListAjax', function(req, res, next) {
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = u_info.m_no;
	var m_gender = u_info.m_gender;
	var m_type =  u_info.m_type;
	var m_status =  u_info.m_status;    
	var listType = req.body.listType;
	var whereSql ="";
	if(session_check(req,res)){
		if (m_type==1){
			whereSql = " AND (( m_status= "+listType +" AND  m_type =2) OR (m_type =1))";
		}
		pool.getConnection(function(err,connection){
//		   var query = connection.query("SELECT m_no, m_id, m_gender, m_nickname, m_profile_img, m_point, m_regdate, m_moddate, m_login, m_status, m_type FROM  tbl_member WHERE m_no != ?  AND m_gender != ? AND m_login='Y'  "+whereSql,[m_no,m_gender], function (err, rows) { 
//	           if(err){
//	               connection.release(); 
//	               throw err;
//	           }
			var query = connection.query("UPDATE tbl_member SET  m_login ='Y',   access_date =sysdate()  WHERE m_no = "+m_no, function (err) {
			            if(err){
			                connection.release();
			                throw err;
			            }
			             connection.release();
			             res.send('OK'); 
			    });
		      
//	        });
		}); 
	}

});
router.post('/chatroom', function(req, res, next) {
	var user_session = req.session; 
	var u_info = user_session.u_info;
	var roomno = req.body.roomno;
	var you_m_id = req.body.you_m_id;
	var you_m_no = req.body.you_m_no;
	var chatType = req.body.chatType;
  	if(mobile_check(req.header('user-agent'))) {
  		res.render('member/chatroomM',{ session: user_session,roomno:roomno,you_m_id:you_m_id , you_m_no:you_m_no,chatType:chatType});
	}else{
		res.render('member/chatroom',{ session: user_session,roomno:roomno,you_m_id:you_m_id , you_m_no:you_m_no,chatType:chatType});
	}

	
});
router.post('/historyInsert',function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;

	pool.getConnection(function(err,connection){ 
		connection.query('insert  into  tbl_history(m_no1,m_no2,start_datetime,chat_type) values(?,?,sysdate(),?)',[req.body.m_no1,req.body.m_no2,req.body.chatType], function (err, rows) {
            if(err){
                connection.release();
                throw err;
            }
	    });  
        connection.query('SELECT MAX(h_idx) h_idx FROM tbl_history  WHERE m_no1= ? AND m_no2 = ?',[req.body.m_no1,req.body.m_no2], function (err, rows) {
        	if(err){
                connection.release();
                throw err;
            } 
        	connection.release();
        	if(rows!=null){
        		res.send({rows:rows});
        	}else{
        		res.send("ok");
        	}  
             
        });
	}); 
});
router.post('/pointUpdateM',function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;
	var minus_m_no =req.body.minus_m_no ;
	var chatType  = req.body.chatType ;
	var priceType ="video_price";
	if (chatType==2){
		priceType = "voice_price";
	}
	pool.getConnection(function(err,connection){ 
		connection.query('UPDATE  tbl_history SET use_money = use_money + (SELECT '+priceType+' FROM (SELECT '+priceType+'  FROM tbl_member WHERE m_no='+minus_m_no+' ) as tt) WHERE h_idx = ? ',[req.body.h_idx], function (err, rows) {
	            if(err){
	                connection.release();
	                throw err;
	            }
	    });  
        var sql ="UPDATE  tbl_member SET m_point = m_point -  (SELECT "+priceType+" FROM (SELECT "+priceType+"  FROM tbl_member WHERE m_no="+minus_m_no+" ) as tt)  WHERE m_no =( select * from (select if( (SELECT tm2.branch_code FROM tbl_member as tm2 WHERE  tm2.m_no ="+minus_m_no+" AND tm2.branch_code != '')!='' ,(SELECT tm3.branch_no FROM tbl_member as tm3 WHERE  tm3.m_no ="+minus_m_no+" ) ,"+minus_m_no+") from dual)as tc)";
        console.log(sql);
        connection.query(sql, function (err, rows) {
        	if(err){
                connection.release();
                throw err;
            } 
        });
		connection.query("UPDATE  tbl_history SET man_last_point = (SELECT m_point FROM (SELECT m_point  FROM tbl_member WHERE m_no=( select * from (select if( (SELECT tm2.branch_code FROM tbl_member as tm2 WHERE  tm2.m_no ="+minus_m_no+" AND tm2.branch_code != '')!='' ,(SELECT tm3.branch_no FROM tbl_member as tm3 WHERE  tm3.m_no ="+minus_m_no+" ) ,"+minus_m_no+") from dual)as tc) ) as tt) WHERE h_idx = ? ",[req.body.h_idx], function (err, rows) {
            if(err){
                connection.release();
                throw err;
            }
            connection.release();
        	res.send("ok");
		});  
	}); 
});
router.post('/pointUpdateF',function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;
	var plus_m_no =req.body.plus_m_no ;
	var chatType  = req.body.chatType ;
	var priceType ="video_price";
	if (chatType==2){
		priceType = "voice_price";
	}
	pool.getConnection(function(err,connection){ 	
		connection.query('UPDATE  tbl_history SET plus_money = plus_money + (select '+priceType+' from (SELECT '+priceType+'  FROM tbl_member WHERE m_no='+plus_m_no+' ) as tt) WHERE h_idx = ? ',[req.body.h_idx], function (err, rows) {
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
		connection.query('UPDATE  tbl_history SET woman_last_point = (select m_point from (SELECT m_point  FROM tbl_member WHERE m_no='+plus_m_no+' ) as tt) WHERE h_idx = ? ',[req.body.h_idx], function (err, rows) {
            if(err){
                connection.release();
                throw err;
            }
            connection.release();
        	res.send("ok");
		});  
	}); 
});
router.post('/historyUpdate',function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;

	pool.getConnection(function(err,connection){ 
		connection.query('UPDATE  tbl_history SET end_datetime = sysdate() WHERE h_idx = ? ',[req.body.h_idx], function (err, rows) {
	            if(err){
	                connection.release();
	                throw err;
	            }
            	connection.release();
            	res.send("ok");
	    });  
	}); 
});
router.get('/mypage', function(req, res, next) {
	var user_session = req.session; 
	var u_info = user_session.u_info;
	if(session_check(req,res)){
		var m_no = u_info.m_no;
		var m_gender  = u_info.m_gender;
		var gender_tag = '';
		if(m_gender ==='F'){
			gender_tag ='_f';
		}else{
			gender_tag ='_m';
		}
	  	if(mobile_check(req.header('user-agent'))) {
	  		res.render('member/mypageM'+gender_tag,{ session: user_session ,u_info : u_info });
	  	}else{
	  		res.render('member/mypage'+gender_tag,{ session: user_session ,u_info : u_info });
	  	}
		
	}
});
router.post('/paymentListAjax',function(req,res,next){
	var user_session = req.session;
	  var u_info = user_session.u_info;
	  var m_no = u_info.m_no;
	  var sql ="";
	/*페이징 변수*/
	var totRecordCnt =0 ;
	var page_per_record_cnt = 10;  
	var group_per_page_cnt =5;  
	var nowPage =1;
	if(req.body.nowPage){
		nowPage = req.body.nowPage;
	}
	var s_s_date ;
	var whereSql = " ";
	if(req.body.s_s_date){
		s_s_date = req.body.s_s_date;
		whereSql += " AND reg_date >=  '"+s_s_date+" 00:00:00' ";
	}
	var s_e_date ;
	if(req.body.s_e_date){
		s_e_date = req.body.s_e_date;
		whereSql += " AND reg_date <=  '"+s_e_date+" 23:59:59' ";
	}
	var record_end_no ;				
	var record_start_no ;
	var total_page ;
	var group_no ;
	var page_eno ;
	var page_sno ;
	  pool.getConnection(function(err,connection){
		  var query1 = connection.query("SELECT COUNT(*) AS	totRecordCnt FROM tbl_payment WHERE m_no = "+m_no +" "+whereSql, function (err, rows,callback) {
				if(err){
		            connection.release();
		            throw err;
		       }
				totRecordCnt = rows[0].totRecordCnt;
				record_end_no = nowPage*page_per_record_cnt;				
				record_start_no = record_end_no-(page_per_record_cnt-1);
				if(record_end_no>totRecordCnt){
					record_end_no = totRecordCnt;
				}
				
				record_start_no -=1; 
				total_page = parseInt(totRecordCnt / page_per_record_cnt + (totRecordCnt % page_per_record_cnt>0 ? 1 : 0));
				if(nowPage>total_page){
					nowPage = total_page;
				}
				group_no = parseInt(nowPage/group_per_page_cnt+( nowPage%group_per_page_cnt>0 ? 1:0));
				page_eno = group_no*group_per_page_cnt;
				page_sno = page_eno-(group_per_page_cnt-1);
				if(page_eno>total_page){
					page_eno=total_page;
				}

				sql = " SELECT  payment_idx, m_no, payment_method, payment,  payment_status, t_id" ;
				sql +="  ,case payment_status ";
				sql +=" when 1 then '확인중' ";
				sql +=" when 2 then '완료' ";
				sql +=" end as payment_status_kor ";
				sql +=" ,case payment_method  ";
				sql +=" when 1 then '카드' ";
				sql +=" when 2 then '휴대폰' ";
				sql +=" when 3 then '무통장입금' ";
				sql +=" when 9 then '관리자' ";
				sql +=" end as payment_method_kor ";
				sql +=" ,DATE_FORMAT(reg_date,'%y.%m.%d') as reg_date ";
				sql +=" ,DATE_FORMAT(reg_date,'%H:%i:%s') as reg_time ";
				sql +=' FROM tbl_payment WHERE  m_no = '+m_no  +" "+whereSql + " ORDER BY payment_idx DESC"; 
				sql +=' LIMIT '+record_start_no+','+page_per_record_cnt;
				listSql();
		  });
		  function listSql (){
				var pageObj = new Object();
				pageObj.totRecordCnt =	totRecordCnt;
				pageObj.page_per_record_cnt =	page_per_record_cnt;
				pageObj.group_per_page_cnt =	group_per_page_cnt;
				pageObj.nowPage =	nowPage;
				pageObj.record_end_no =	record_end_no;
				pageObj.record_start_no =	record_start_no;
				pageObj.total_page =	total_page;
				pageObj.group_no =	group_no;
				pageObj.page_eno =	page_eno;
				pageObj.page_sno =	page_sno;
				if(nowPage==1){
					pageObj.prevPage = 1;
				}else{
					pageObj.prevPage = Number(nowPage)-1;
				}
				if(nowPage ==total_page){
					pageObj.nextPage  = nowPage;
				}else{
					pageObj.nextPage =Number(nowPage) +1;
				}
				
				
				connection.query(sql, function (err, rows) {
		            if(err){
		                connection.release();
		                throw err;
		            }
		            connection.release();
					res.send({rows:rows, pageObj:pageObj});
		
		       });
			}
		}); 
	  
	  
});
router.post('/exchangeListAjax',function(req,res,next){
	var user_session = req.session;
	  var u_info = user_session.u_info;
	  var m_no = u_info.m_no;
	  var sql ="";
	/*페이징 변수*/
	var totRecordCnt =0 ;
	var page_per_record_cnt = 10;  
	var group_per_page_cnt =5;  
	var nowPage =1;
	if(req.body.nowPage){
		nowPage = req.body.nowPage;
	}
	var record_end_no ;				
	var record_start_no ;
	var total_page ;
	var group_no ;
	var page_eno ;
	var page_sno ;
	  pool.getConnection(function(err,connection){
		  var query1 = connection.query("SELECT COUNT(*) AS	totRecordCnt FROM tbl_exchange WHERE m_no = "+m_no , function (err, rows,callback) {
				if(err){
		            connection.release();
		            throw err;
		       }
				totRecordCnt = rows[0].totRecordCnt;
				record_end_no = nowPage*page_per_record_cnt;				
				record_start_no = record_end_no-(page_per_record_cnt-1);
				if(record_end_no>totRecordCnt){
					record_end_no = totRecordCnt;
				}
				
				record_start_no -=1; 
				total_page = parseInt(totRecordCnt / page_per_record_cnt + (totRecordCnt % page_per_record_cnt>0 ? 1 : 0));
				if(nowPage>total_page){
					nowPage = total_page;
				}
				group_no = parseInt(nowPage/group_per_page_cnt+( nowPage%group_per_page_cnt>0 ? 1:0));
				page_eno = group_no*group_per_page_cnt;
				page_sno = page_eno-(group_per_page_cnt-1);
				if(page_eno>total_page){
					page_eno=total_page;
				}

				sql = " SELECT   exchange_idx, m_no, exchange_type, exchange_amount, exchange_status,  bank_name, bank_user_name, account_number " ;
				sql +="  ,case exchange_status ";
				sql +=" when 0 then '완료' ";
				sql +=" when 1 then '취소' ";
				sql +=" end as exchange_status_kor ";
				sql +=" ,DATE_FORMAT(regdate,'%y.%m.%d') as regdate ";
				sql +=' FROM tbl_exchange WHERE  m_no = '+m_no + " ORDER BY exchange_idx DESC"; 
				sql +=' LIMIT '+record_start_no+','+page_per_record_cnt;
				listSql();
		  });
		  function listSql (){
				var pageObj = new Object();
				pageObj.totRecordCnt =	totRecordCnt;
				pageObj.page_per_record_cnt =	page_per_record_cnt;
				pageObj.group_per_page_cnt =	group_per_page_cnt;
				pageObj.nowPage =	nowPage;
				pageObj.record_end_no =	record_end_no;
				pageObj.record_start_no =	record_start_no;
				pageObj.total_page =	total_page;
				pageObj.group_no =	group_no;
				pageObj.page_eno =	page_eno;
				pageObj.page_sno =	page_sno;
				if(nowPage==1){
					pageObj.prevPage = 1;
				}else{
					pageObj.prevPage = Number(nowPage)-1;
				}
				if(nowPage ==total_page){
					pageObj.nextPage  = nowPage;
				}else{
					pageObj.nextPage =Number(nowPage) +1;
				}
				
				
				connection.query(sql, function (err, rows) {
		            if(err){
		                connection.release();
		                throw err;
		            }
		            connection.release();
					res.send({rows:rows, pageObj:pageObj});
		
		       });
			}
		}); 
	  
	  
});
router.post('/historyListAjax',function(req,res,next){
	var user_session = req.session;
	  var u_info = user_session.u_info;
	  var m_no = u_info.m_no;
	  var m_id = u_info.m_id;
	  var sql ="";
	/*페이징 변수*/
	var totRecordCnt =0 ;
	var page_per_record_cnt = 10;  
	var group_per_page_cnt =5;  
	var nowPage =1;
	if(req.body.nowPage){
		nowPage = req.body.nowPage;
	}
	var s_s_date ;
	var whereSql = " ";
	if(req.body.s_s_date){
		s_s_date = req.body.s_s_date;
		whereSql += " AND start_datetime >=  '"+s_s_date+" 00:00:00' ";
	}
	var s_e_date ;
	if(req.body.s_e_date){
		s_e_date = req.body.s_e_date;
		whereSql += " AND start_datetime <=  '"+s_e_date+" 23:59:59' ";
	}
	var record_end_no ;				
	var record_start_no ;
	var total_page ;
	var group_no ;
	var page_eno ;
	var page_sno ;
	  pool.getConnection(function(err,connection){
		  var query1 = connection.query("SELECT COUNT(*) AS	totRecordCnt FROM tbl_history AS ts  LEFT JOIN tbl_member AS tm ON ts.m_no1 = tm.m_no WHERE tm.branch_code =  "+m_id +" "+whereSql, function (err, rows,callback) {
				if(err){
		            connection.release();
		            throw err;
		       }
				totRecordCnt = rows[0].totRecordCnt;
				record_end_no = nowPage*page_per_record_cnt;				
				record_start_no = record_end_no-(page_per_record_cnt-1);
				if(record_end_no>totRecordCnt){
					record_end_no = totRecordCnt;
				}
				
				record_start_no -=1; 
				total_page = parseInt(totRecordCnt / page_per_record_cnt + (totRecordCnt % page_per_record_cnt>0 ? 1 : 0));
				if(nowPage>total_page){
					nowPage = total_page;
				}
				group_no = parseInt(nowPage/group_per_page_cnt+( nowPage%group_per_page_cnt>0 ? 1:0));
				page_eno = group_no*group_per_page_cnt;
				page_sno = page_eno-(group_per_page_cnt-1);
				if(page_eno>total_page){
					page_eno=total_page;
				}

				sql = " SELECT   ts.h_idx, ts.m_no1, ts.m_no2, ts.start_datetime, ts.end_datetime, ts.use_money, tm.m_nickname  " ;
				sql +=" ,DATE_FORMAT(ts.start_datetime,'%y.%m.%d') as start_date ";
				sql +=" ,DATE_FORMAT(ts.start_datetime,'%H:%i:%s') as start_time ";
				sql +=" ,DATE_FORMAT(ts.end_datetime,'%H:%i:%s') as end_time ";
				sql +=" ,SEC_TO_TIME(TIMESTAMPDIFF(second, date_format(ts.start_datetime, '%Y-%m-%d %H:%i:%s'), date_format(ts.end_datetime, '%Y-%m-%d %H:%i:%s'))) AS time_diff ";
				sql +='  FROM tbl_history AS ts  LEFT JOIN tbl_member AS tm ON ts.m_no1 = tm.m_no'; 
				sql += " WHERE tm.branch_code =  "+m_id+ " "+whereSql;
				sql +=' ORDER BY  h_idx desc LIMIT '+record_start_no+','+page_per_record_cnt;
				listSql();
		  });
		  function listSql (){
				var pageObj = new Object();
				pageObj.totRecordCnt =	totRecordCnt;
				pageObj.page_per_record_cnt =	page_per_record_cnt;
				pageObj.group_per_page_cnt =	group_per_page_cnt;
				pageObj.nowPage =	nowPage;
				pageObj.record_end_no =	record_end_no;
				pageObj.record_start_no =	record_start_no;
				pageObj.total_page =	total_page;
				pageObj.group_no =	group_no;
				pageObj.page_eno =	page_eno;
				pageObj.page_sno =	page_sno;
				if(nowPage==1){
					pageObj.prevPage = 1;
				}else{
					pageObj.prevPage = Number(nowPage)-1;
				}
				if(nowPage ==total_page){
					pageObj.nextPage  = nowPage;
				}else{
					pageObj.nextPage =Number(nowPage) +1;
				}
				
				
				connection.query(sql, function (err, rows) {
		            if(err){
		                connection.release();
		                throw err;
		            }
		            connection.release();
					res.send({rows:rows, pageObj:pageObj});
		
		       });
			}
		}); 
	  
	  
});
router.post('/pointViewAjax',function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = u_info.m_no;
	if(session_check(req,res)){
		if (u_info.branch_no){
			m_no = u_info.branch_no;
		}
		pool.getConnection(function(err,connection){
		   var query = connection.query("SELECT m_no,  m_point  FROM  tbl_member WHERE m_no = ?   ",[m_no], function (err, rows) { 
	           if(err){
	               connection.release(); 
	               throw err;
	           }
		       connection.release();
		       res.send({rows:rows}); 
	        });
		}); 
	}

});
router.post('/reqExchange',function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = u_info.m_no;
	var ablePoint = req.body.ablePoint;
	var bank_name = req.body.bank_name;
	var bank_user_name = req.body.bank_user_name;
	var account_number = req.body.account_number;
	pool.getConnection(function(err,connection){ 
		connection.query('INSERT INTO tbl_exchange(m_no ,exchange_amount ,exchange_status ,regdate ,bank_name ,bank_user_name ,account_number,exchange_type) VALUES (?,?,?,sysdate(),?,?,?,1)',[m_no,ablePoint,0,bank_name,bank_user_name,account_number], function (err, rows) {
            if(err){
                connection.release();
                throw err;
            }             
	    }); 
        connection.query('UPDATE tbl_member SET m_point =m_point - ?,  m_moddate =sysdate() WHERE m_no =? ',[ablePoint , m_no], function (err, rows) {
            if(err){
                connection.release();
                throw err;
            }
        	connection.release();
         	res.send("ok");
	    });	
	}); 
});
router.post('/alter_ok',upload.single("m_profile_img"),function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = u_info.m_no;
	var m_password = req.body.m_password;
	var m_gender = req.body.m_gender;
	var m_nickname = req.body.m_nickname;
	var video_price  =0;
	var voice_price = 0;
	var freeprice_second =0;
	if(m_gender =='M'){
		video_price  =250;
		voice_price = 150;
		freeprice_second =5;
	} 
	var file = req.file;
	var filename ="";
	console.log(file);
	if (file!= null){
		filename = file.filename;
	}else{
		filename = req.body.before_profile_img;
	}
	var m_gender_chg  =" ";
//	if(u_info.m_gender !=m_gender ){
//		m_gender_chg  =" ,video_price="+video_price+" , voice_price"+voice_price+"  ";
//	}
	pool.getConnection(function(err,connection){ 
		connection.query('UPDATE tbl_member SET m_gender =?,m_password=? , m_nickname=? ,  m_moddate =sysdate(), m_profile_img = ? '+m_gender_chg+' WHERE m_no =? ',[m_gender,m_password,m_nickname,filename, m_no], function (err, rows) {
            if(err){
                connection.release();
                throw err;
            }
            u_info.m_profile_img = filename;
            u_info.m_nickname = m_nickname;
            u_info.m_gender =m_gender;
        	connection.release();
        	res.redirect('/mypage');
	    });	
	});
}); 

router.post('/profileChg',function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;
	 res.send({m_profile_img:u_info.m_profile_img , m_nickname : u_info.m_nickname}); 
});
router.post('/pro_img_del',function(req,res,next){
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = req.body.m_no;
	pool.getConnection(function(err,connection){ 
		connection.query('UPDATE tbl_member SET  m_profile_img = \'\'  WHERE m_no =? ',[ m_no], function (err, rows) {
            if(err){
                connection.release();
                throw err;
            }
            u_info.m_profile_img = '';
            connection.release();
            res.send({m_profile_img:u_info.m_profile_img , m_nickname : u_info.m_nickname}); 
	    });	
	});
	
});
module.exports = router;
