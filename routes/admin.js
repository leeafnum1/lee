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

session_check_mgmt = function(req,res){
	var user_session = req.session;
	var u_info = user_session.u_info;
	
	if(u_info==null){
		res.send("<script>alert('로그인이 필요한 페이지입니다.');parent.location='/mgmt';</script>"); 
		return false;
	}else if(u_info.m_type != 4){
		res.send("<script>alert('관리자만 접근 할 수 있습니다.');parent.location='/mgmt';</script>"); 
		return false;
	}else{
		return true;  
	}        
}    
router.get('/', function(req, res, next) {
	var user_session = req.session;
	var u_info = user_session.u_info;
	if(u_info==null){
		res.render('mgmt/login', { title: 'Express' });
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
router.post('/login', function(req, res, next) {
	var m_id = req.body.m_id;
	var m_password = req.body.m_password;
	if(req.session.u_info!= null){
		  res.send("<script>alert('1개의 PC로 여러아이디 사용이 불가능합니다.\\n기존 로그인되어있는 아이디 로그아웃 후 이용바랍니다..');parent.location='/';</script>");
	}else{
	
		var selectSql ="SELECT m_no, m_id, m_password, m_gender, m_nickname, m_profile_img, m_point, m_regdate, m_moddate, m_login, m_status,m_type ,video_price,voice_price,freeprice_second	FROM tbl_member WHERE M_ID =? AND M_PASSWORD =? AND m_type=4 ";
		pool.getConnection(function(err,connection){
			var query = connection.query(selectSql,[m_id,m_password], function (err, rows) {
				if(err){
		            connection.release();
		            throw err;
				}else{
					connection.release();
					 if(rows!=null && rows.length>0){
						 if(rows[0].m_type == 2 && rows[0].m_status == 0){
							 res.send("<script>alert('해당 방이 대기상태가 아닙니다. 관리자에가 문의하세요.');parent.location='/';</script>"); 
						 }else{
							 req.session.u_info={
									    m_no : rows[0].m_no ,
					   					m_id : m_id,
					   					m_nickname : rows[0].m_nickname,
					   					m_profile_img : rows[0].m_profile_img , 
					   					m_gender : rows[0].m_gender , 
					   					m_nickname : rows[0].m_nickname ,
					   					m_type :  rows[0].m_type ,
					   					video_price :  rows[0].video_price ,
					   					voice_price :  rows[0].voice_price ,
					   					freeprice_second :  rows[0].freeprice_second 
					   		    };
							   res.redirect('/mgmt/member');
						 }
						   
				          
					 }else{
						 res.send("<script>alert('회원정보가 존재하지 않습니다.');parent.location='/mgmt';</script>"); 
					 }
	
				}
			});
		});
	}
});
router.get('/member', function(req, res, next) {
	var user_session = req.session;
	  var u_info = user_session.u_info;
	  var sql ="";
	/*페이징 변수*/
	var totRecordCnt =0 ;
	var page_per_record_cnt = 10;  
	var group_per_page_cnt =5;  
	var nowPage =1;
	if(req.query.nowPage){
		nowPage = req.query.nowPage;
	}
	var search_type ="";
	var search_text ="";
	
	var whereSql = " ";
	if(req.query.search_type){
		search_type =req.query.search_type;
		search_text = req.query.search_text;
		if (search_type == "s_id"){
			whereSql = " AND m_id ='"+search_text+"'";
		}else{
			whereSql = " AND m_nickname ='"+search_text+"'";
		}
		if(search_text ==""){
			whereSql ="";
		}
			
	}
	var record_end_no ;				
	var record_start_no ;
	var total_page ;
	var group_no ;
	var page_eno ;
	var page_sno ;
	  pool.getConnection(function(err,connection){
		  var query1 = connection.query("SELECT COUNT(*) AS	totRecordCnt FROM tbl_member WHERE 1=1 AND m_status != 99 "+whereSql , function (err, rows,callback) {
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

				sql = " SELECT m_no, m_id,   m_nickname ,branch_name " ;
				sql +="  ,case m_gender ";
				sql +=" when 'M' then '남' ";
				sql +=" when 'F' then '여' ";
				sql +=" end as m_gender_kor ";
				sql +=' FROM tbl_member  WHERE 1=1 AND m_status != 99  '+whereSql+' ORDER BY m_no desc '; 
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
				pageObj.search_type =	search_type;
				pageObj.search_text =	search_text;
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
		        	if(session_check_mgmt(req,res)){
		      		  res.render('mgmt/member',{rows:rows, pageObj:pageObj});
		        	}
					
		
		       });
			}
		}); 
	  

});
router.get('/member_detail', function(req, res, next) {
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = req.query.m_no;
	pool.getConnection(function(err,connection){
		var sql ="";
		sql +="SELECT m_no,m_password, m_id, m_gender, m_nickname, m_profile_img, m_point, m_regdate, m_moddate, m_login, m_status, m_type,video_price,voice_price,freeprice_second ";
		sql +="  ,CASE m_gender ";
		sql +=" WHEN 'M' then '남성' ";
		sql +=" WHEN 'F' then '여성' ";
		sql +=" END AS m_gender_kor ";
		sql +=" FROM tbl_member WHERE  m_no= "+m_no; 
	   var query = connection.query(sql, function (err, rows) { 
           if(err){
               connection.release(); 
               throw err; 
           }
	       connection.release();
		   	if(session_check_mgmt(req,res)){
		   		console.log(rows);
		   		if(rows != null){
		   			var row = rows[0];
		   			res.render('mgmt/member_detail',{row:row});
		   		}else{
		   			res.send("<script>alert('정보가없습니다..');parent.location='/mgmt/meber';</script>"); 
		   			return false;
		   		}
				  
		  	}
        });
	}); 
	

});
router.get('/mgmtpass', function(req, res, next) {
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = u_info.m_no;
	pool.getConnection(function(err,connection){
		var sql ="";
		sql +="SELECT m_no,m_password, m_id, m_gender, m_nickname, m_profile_img, m_point, m_regdate, m_moddate, m_login, m_status, m_type,video_price,voice_price,freeprice_second ";
		sql +="  ,CASE m_gender ";
		sql +=" WHEN 'M' then '남성' ";
		sql +=" WHEN 'F' then '여성' ";
		sql +=" END AS m_gender_kor ";
		sql +=" FROM tbl_member WHERE  m_no= "+m_no; 
	   var query = connection.query(sql, function (err, rows) { 
           if(err){
               connection.release(); 
               throw err; 
           }
	       connection.release();
		   	if(session_check_mgmt(req,res)){
		   		console.log(rows);
		   		if(rows != null){
		   			var row = rows[0];
		   			res.render('mgmt/mgmtpass',{row:row});
		   		}else{
		   			res.send("<script>alert('정보가없습니다..');parent.location='/mgmt/meber';</script>"); 
		   			return false;
		   		}
				  
		  	}
        });
	}); 
	

});
router.post('/member_modify',upload.single("m_profile_img"), function(req, res, next) {
	var user_session = req.session;
	var u_info = user_session.u_info;

	var m_no= req.body.m_no;
	var video_price = req.body.video_price;
	var voice_price = req.body.voice_price;
	var freeprice_second = req.body.freeprice_second;
	var m_password = req.body.m_password;
	var file = req.file;
	var filename ="";
	console.log(file);
	if (file!= null){
		filename = file.filename;
	}else{
		filename = req.body.before_profile_img;
	}
	
	var sql ="";
	sql ="UPDATE tbl_member SET m_profile_img = '"+filename+"',m_password = '"+m_password+"' , video_price = "+video_price+" , voice_price = "+voice_price+", freeprice_second = "+freeprice_second+",  m_moddate = sysdate() WHERE m_no ="+m_no;
	
	pool.getConnection(function(err,connection){
		connection.query(sql, function (err, rows) {
			 if(err){
                 connection.release();
                 throw err;
             }
			 connection.release();
			 res.send("<script>alert('수정되었습니다.');location.href='member_detail?m_no="+m_no+"';</script>"); 
		});
		
	});
});
router.get('/payment', function(req, res, next) {
	var user_session = req.session;
	  var u_info = user_session.u_info;
	  var sql ="";
	/*페이징 변수*/
	var totRecordCnt =0 ;
	var page_per_record_cnt = 10;  
	var group_per_page_cnt =5;  
	var nowPage =1;
	if(req.query.nowPage){
		nowPage = req.query.nowPage;
	}
	var s_s_date ;
	var whereSql = " ";
	if(req.query.s_s_date){
		s_s_date = req.query.s_s_date;
		whereSql += " AND reg_date >=  '"+s_s_date+" 00:00:00' ";
	}
	var s_e_date ;
	if(req.query.s_e_date){
		s_e_date = req.query.s_e_date;
		whereSql += " AND reg_date <=  '"+s_e_date+" 23:59:59' ";
	}
	var record_end_no ;				
	var record_start_no ;
	var total_page ;
	var group_no ;
	var page_eno ;
	var page_sno ;
	  pool.getConnection(function(err,connection){
		  var query1 = connection.query("SELECT COUNT(*) AS	totRecordCnt FROM tbl_payment WHERE 1=1 "+whereSql, function (err, rows,callback) {
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

				sql = " SELECT  payment_idx, tp.m_no, payment_method, payment,  payment_status, t_id,tm.m_nickname,tm.m_id" ;
				sql +="  ,CASE payment_status ";
				sql +=" WHEN 0 THEN '완료' ";
				sql +=" WHEN 1 THEN '취소' ";
				sql +=" END AS payment_status_kor "; 
				sql +=" ,CASE payment_method  ";
				sql +=" WHEN 1 THEN '카드' ";
				sql +=" WHEN 2 THEN '휴대폰' ";
				sql +=" WHEN 3 THEN '무통장입금' ";
				sql +=" WHEN 9 THEN '관리자' ";
				sql +=" END AS payment_method_kor ";
				sql +=" ,DATE_FORMAT(reg_date,'%y.%m.%d') as reg_date ";
				sql +=" ,DATE_FORMAT(reg_date,'%H:%i:%s') as reg_time ";
				sql +=' FROM tbl_payment AS tp LEFT JOIN tbl_member AS tm ON tp.m_no = tm.m_no WHERE 1=1 '+whereSql+' ORDER BY payment_idx desc'; 
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
				pageObj.s_s_date = s_s_date ;
				pageObj.s_e_date = s_e_date ;
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
		        	if(session_check_mgmt(req,res)){
		      		  res.render('mgmt/payment',{rows:rows, pageObj:pageObj});
		        	}
					
		
		       });
			}
		}); 
	  

});
router.get('/exchange', function(req, res, next) {
	var user_session = req.session;
	  var u_info = user_session.u_info;
	  var sql ="";
	/*페이징 변수*/
	var totRecordCnt =0 ;
	var page_per_record_cnt = 10;  
	var group_per_page_cnt =5;  
	var nowPage =1;
	if(req.query.nowPage){
		nowPage = req.query.nowPage;
	}
	var s_s_date ;
	var whereSql = " ";
	if(req.query.s_s_date){
		s_s_date = req.query.s_s_date;
		whereSql += " AND regdate >=  '"+s_s_date+" 00:00:00' ";
	}
	var s_e_date ;
	if(req.query.s_e_date){
		s_e_date = req.query.s_e_date;
		whereSql += " AND regdate <=  '"+s_e_date+" 23:59:59' ";
	}
	var record_end_no ;				
	var record_start_no ;
	var total_page ;
	var group_no ;
	var page_eno ;
	var page_sno ;
	  pool.getConnection(function(err,connection){
		  var query1 = connection.query("SELECT COUNT(*) AS	totRecordCnt FROM tbl_exchange WHERE 1=1  "+whereSql , function (err, rows,callback) {
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

				sql = " SELECT   exchange_idx, te.m_no, exchange_type, exchange_amount, exchange_status,  bank_name, bank_user_name, account_number,tm.m_id,tm.m_nickname " ;
				sql +="  ,CASE exchange_status ";
				sql +=" WHEN 0 THEN '완료' ";
				sql +=" WHEN 1 THEN '취소' ";
				sql +=" END AS exchange_status_kor ";
				sql +=" ,DATE_FORMAT(regdate,'%y.%m.%d') AS regdate ";
				sql +=" FROM tbl_exchange AS te LEFT JOIN tbl_member AS tm ON te.m_no = tm.m_no WHERE 1=1 "+whereSql+"  ORDER BY exchange_idx desc  "; 
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
				pageObj.s_s_date = s_s_date ;
				pageObj.s_e_date = s_e_date ;
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
		        	if(session_check_mgmt(req,res)){
		      		  res.render('mgmt/exchange',{rows:rows, pageObj:pageObj});
		        	}
		       });
			}
		}); 
});
router.get('/history', function(req, res, next) {
	var user_session = req.session;
	  var u_info = user_session.u_info;
	  var sql ="";
	/*페이징 변수*/
	var totRecordCnt =0 ;
	var page_per_record_cnt = 10;  
	var group_per_page_cnt =5;  
	var nowPage =1;
	if(req.query.nowPage){
		nowPage = req.query.nowPage;
	}
	var s_s_date ;
	var whereSql = " ";
	if(req.query.s_s_date){
		s_s_date = req.query.s_s_date;
		whereSql += " AND start_datetime >=  '"+s_s_date+" 00:00:00' ";
	}
	var s_e_date ;
	if(req.query.s_e_date){
		s_e_date = req.query.s_e_date;
		whereSql += " AND start_datetime <=  '"+s_e_date+" 23:59:59' ";
	}
	var record_end_no ;				
	var record_start_no ;
	var total_page ;
	var group_no ;
	var page_eno ;
	var page_sno ;
	  pool.getConnection(function(err,connection){
		  var query1 = connection.query("SELECT COUNT(*) AS	totRecordCnt FROM tbl_history WHERE 1=1  "+whereSql , function (err, rows,callback) {
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

				sql = " SELECT   h_idx, m_no1, m_no2, use_money, tm.m_id as m_id1,tm2.m_id as m_id2 " ;
				sql +="  ,case chat_type ";
				sql +=" when 1 then '영상' ";
				sql +=" when 2 then '전화' ";
				sql +=" end as chat_type_kor ";
				sql +=" ,DATE_FORMAT(start_datetime,'%y.%m.%d') AS start_date ";
				sql +=" ,DATE_FORMAT(start_datetime,'%H:%i:%s') AS start_time ";
				sql +=" ,DATE_FORMAT(end_datetime,'%H:%i:%s') AS end_time ";
				sql +=",SEC_TO_TIME(TIMESTAMPDIFF(second, date_format(start_datetime, '%Y-%m-%d %H:%i:%s'), date_format(end_datetime, '%Y-%m-%d %H:%i:%s'))) AS time_diff";
				sql +=" FROM tbl_history AS th LEFT JOIN tbl_member AS tm ON th.m_no1 = tm.m_no LEFT JOIN tbl_member AS tm2 ON th.m_no2 = tm2.m_no  WHERE 1=1 "+whereSql+"   ORDER BY h_idx DESC  ";
				
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
				pageObj.s_s_date = s_s_date ;
				pageObj.s_e_date = s_e_date ;
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
		        	if(session_check_mgmt(req,res)){
		      		  res.render('mgmt/history',{rows:rows, pageObj:pageObj});
		        	}
		       });
			}
		}); 
});
router.get('/branch', function(req, res, next) {
	if(session_check_mgmt(req,res)){
		  res.render('mgmt/branch');
	}
});
router.post('/branch_insert', function(req, res, next) {
	var branch_code = req.body.branch_code;
	var branch_name= req.body.branch_name;
	var branch_room_no= req.body.branch_room_no;
	
	var m_id ="";
	var m_password = "1234";
	var m_gender = "M";
	var m_nickname = "";
	var m_type = 2;
	var video_price  =250;

	var sql ="";
	sql ="SELECT branch_name,COUNT(m_no) AS branchCnt,COUNT(IF(m_id='"+branch_code+""+branch_room_no+"', m_id, NULL)) AS roomCnt FROM tbl_member WHERE branch_code ="+branch_code;
	
	pool.getConnection(function(err,connection){
		connection.query(sql, function (err, rows) {
			var alertMsg ="";
            if(err){
                connection.release();
                throw err;
            }
            if(rows[0].branchCnt ==0){
            	m_id = branch_code;
            	m_nickname =  branch_name;
            	m_type = 3;
            	video_price  = 0; 
            	voice_price = 0;
            	freeprice_second =0;
            	connection.query('INSERT INTO tbl_member(m_id ,m_password ,m_gender ,m_nickname  ,m_regdate, m_type,video_price,voice_price,freeprice_second,branch_name,branch_code,branch_no) VALUES (?,?,?,?,sysdate(),?,?,?,?,?,?,(SELECT tm.m_no FROM tbl_member AS tm WHERE tm.m_id = ?))',[m_id,m_password,m_gender,m_nickname,m_type,video_price,voice_price,freeprice_second,branch_name,branch_code,branch_code], function (err, rows) {
            		 if(err){
                         connection.release();
                         throw err;
                     }
            	});
            }
            if(rows[0].roomCnt >0){
            	alertMsg="이미 이 지점엔 동일한 방번호가 있습니다.";
            }else if(rows[0].branchCnt !=0 &&rows[0].branch_name != branch_name){
                 	alertMsg="기존 지점명과 동일하지않습니다.";
            }else{
            	
            	m_id = branch_code+""+branch_room_no;
            	m_nickname =  branch_room_no+"번방";
            	m_type = 2;
            	video_price  = 250; 
            	voice_price = 150;
            	freeprice_second =5;
            	connection.query('INSERT INTO tbl_member(m_id ,m_password ,m_gender ,m_nickname  ,m_regdate, m_type,video_price,voice_price,freeprice_second,branch_name,branch_code,branch_no) VALUES (?,?,?,?,sysdate(),?,?,?,?,?,?,(SELECT tm.m_no FROM tbl_member AS tm WHERE tm.m_id = ?))',[m_id,m_password,m_gender,m_nickname,m_type,video_price,voice_price,freeprice_second,branch_name,branch_code,branch_code], function (err, rows) {
           		 if(err){
                        connection.release();
                        throw err;
                    }
            	});
            	alertMsg="방을 생성하였습니다.";
            }
            connection.release();
            res.send(alertMsg);
	            
	    });
	}); 
});

router.post('/branch_delete', function(req, res, next) {
});
router.get('/woman', function(req, res, next) {
	if(session_check_mgmt(req,res)){
		  res.render('mgmt/woman');
	}
});
router.post('/woman_insert', function(req, res, next) {
	var m_id = req.body.m_id;
	var m_nickname= req.body.m_nickname;
	var m_password= req.body.m_password;
	
	var m_gender = "F";
	var m_type = 1;

	var sql ="";
	sql ="SELECT COUNT(m_no) AS womanCnt FROM tbl_member WHERE m_id ="+m_id;
	
	pool.getConnection(function(err,connection){
		connection.query(sql, function (err, rows) {
			var alertMsg ="";
            if(err){
                connection.release();
                throw err;
            }
            if(rows[0].womanCnt ==0){
            	var video_price  = 0; 
            	var voice_price = 0;
            	var freeprice_second =0;
            	connection.query('INSERT INTO tbl_member(m_id ,m_password ,m_gender ,m_nickname  ,m_regdate, m_type,video_price,voice_price,freeprice_second) VALUES (?,?,?,?,sysdate(),?,?,?,?)',[m_id,m_password,m_gender,m_nickname,m_type,video_price,voice_price,freeprice_second], function (err, rows) {
            		 if(err){
                         connection.release();
                         throw err;
                     }
            	});
            	alertMsg="여성회원을 등록하였습니다.";
            }else{
            	alertMsg="이미 동일한 여성회원 번호가 있습니다.";
            }
            connection.release();
            res.send(alertMsg);
	            
	    });
	}); 
});
router.post('/pointCharge', function(req, res, next) {
	var m_point = req.body.m_point;
	var m_no= req.body.m_no;
	var sql ="";
	sql ="UPDATE tbl_member SET m_point = m_point+"+m_point+" WHERE m_no ="+m_no;
//	
	pool.getConnection(function(err,connection){
		connection.query(sql, function (err, rows) {
			 if(err){
                 connection.release();
                 throw err;
             }

		});
		 sql ="INSERT tbl_payment (m_no,payment_method,payment,reg_date,payment_status) values("+m_no+",9,"+m_point+",sysdate(),1) ";
		connection.query(sql, function (err, rows) {
			 if(err){
                 connection.release();
                 throw err;
             }
			 alertMsg="포인트를 충전했습니다.";
			 connection.release();
	         res.send(alertMsg);
		});
//		
	});
});
router.post('/exchangeOk', function(req, res, next) {
	var idx = req.body.idx;
	var sql ="";
	sql ="UPDATE tbl_exchange SET exchange_status =1 WHERE exchange_idx ="+idx;
	
	pool.getConnection(function(err,connection){
		connection.query(sql, function (err, rows) {
			 if(err){
                 connection.release();
                 throw err;
             } 
			 alertMsg="확인되었습니다.";
			 connection.release();
	         res.send(alertMsg);
		});
		
	});
});
router.post('/paymentOk', function(req, res, next) {
	var idx = req.body.idx;
	var m_no =req.body.m_no;
	var m_point =req.body.m_point;
	var payment_method =req.body.payment_method;
	var sql ="";
	sql ="UPDATE tbl_payment SET payment_status =2 WHERE payment_idx ="+idx;
	console.log(sql);
	pool.getConnection(function(err,connection){
		connection.query(sql, function (err, rows) {
			 if(err){
                 connection.release();
                 throw err;
             }
			
			 
		});
		if(payment_method != 9 ){
			 sql ="UPDATE tbl_member SET m_point =m_point+"+m_point+" WHERE m_no ="+m_no;
			 console.log(sql);
			 connection.query(sql, function (err, rows) {
				 if(err){
	                 connection.release();
	                 throw err;
	             }
				 
			 });
		}
		alertMsg="확인되었습니다.";
		 connection.release();
        res.send(alertMsg);
	});
});
router.post('/deleteMember', function(req, res, next) {
	var m_id = req.body.m_id; 
	var alertMsg ="";
	var sql ="";
	sql ="SELECT COUNT(m_no) AS delCnt FROM tbl_member WHERE m_id ='"+m_id+"'";;

	pool.getConnection(function(err,connection){
		connection.query(sql, function (err, rows) {
            if(err){
                connection.release();
                throw err;
            }
            if(rows[0].delCnt ==0){
            	
            	alertMsg="해당 회원이 존재하지않습니다.";
            	connection.release();
                res.send(alertMsg);
            }else{
            	 sql ="UPDATE tbl_member SET  m_id ='DELETE_MEMBER',m_nickname='삭제아이디',branch_name='',branch_code =null,branch_no=null,m_status =99 WHERE m_id ='"+m_id+"'";
            		console.log(sql);
            	 connection.query(sql, function (err, rows) {
	       			 if(err){
	                        connection.release();
	                        throw err;
	                    }
	       			alertMsg="삭제되었습니다.";
	       			connection.release();
	                res.send(alertMsg);
         		});
            }
            
	            
	    });
	}); 
});
module.exports = router;
