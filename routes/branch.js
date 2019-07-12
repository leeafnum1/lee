var express = require('express');
var router = express.Router();
var pool = require("../db-pool");
var util = require('util');


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
		 res.render('branch/login', { title: 'Express' });
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
	
		var selectSql ="SELECT m_no, m_id, m_password, m_gender, if(m_type =2 , concat(branch_name, m_nickname) , m_nickname) m_nickname,branch_code,branch_no, m_profile_img, m_point, m_regdate, m_moddate, m_login, m_status,m_type ,video_price,voice_price,freeprice_second	FROM tbl_member WHERE M_ID =? AND M_PASSWORD =? AND (m_type=2 OR m_type=3) ";
		pool.getConnection(function(err,connection){
			var query = connection.query(selectSql,[m_id,m_password], function (err, rows) {
				if(err){
		            connection.release();
		            throw err;
				}else{
					connection.release();
					 if(rows!=null && rows.length>0){
						 if(rows[0].m_type == 2 && rows[0].m_status == 0){
							 res.send("<script>alert('해당 방이 대기상태가 아닙니다. 관리자에가 문의하세요.');parent.location='/branch';</script>"); 
						 }else if(rows[0].m_login == 'Y'){
							   res.send("<script>alert('이미 로그인 되어있는 아이디입니다. \\n 비정상 종료의 경우 30초후 로그인이 가능합니다.');parent.location='/branch';</script>"); 
						 }else{
							 req.session.u_info={
									    m_no : rows[0].m_no ,
					   					m_id : m_id,
					   					m_nickname : rows[0].m_nickname,
					   					m_profile_img : rows[0].m_profile_img , 
					   					m_gender : rows[0].m_gender , 
					   					m_nickname : rows[0].m_nickname ,
					   					m_type :  rows[0].m_type ,
					   					m_status :rows[0].m_status ,
					   					branch_code : rows[0].branch_code ,
					   					branch_no : rows[0].branch_no ,
					   					video_price :  rows[0].video_price ,
					   					voice_price :  rows[0].voice_price ,
					   					freeprice_second :  rows[0].freeprice_second 
					   		    };
							   if(rows[0].m_type == 2){
								   res.redirect('/branch/main');
							   }else if(rows[0].m_type == 3){
								   res.redirect('/branch_mgmt');
							   }
						 }
						   
				          
					 }else{
						 res.send("<script>alert('회원정보가 존재하지 않습니다.');parent.location='/branch';</script>"); 
					 }
	
				}
			});
		});
	}
});
router.get('/main', function(req, res, next) {
	var user_session = req.session; 
	var u_info = user_session.u_info;
	if(session_check(req,res)){
		var m_no = u_info.m_no;
	  	res.render('branch/main',{ session: user_session});
	}
});
router.post('/chatroom', function(req, res, next) {
	var user_session = req.session; 
	var u_info = user_session.u_info;
	var roomno = req.body.roomno;
	var you_m_id = req.body.you_m_id;
	var you_m_no = req.body.you_m_no;
	res.render('member/chatroom',{ session: user_session,roomno:roomno,you_m_id:you_m_id , you_m_no:you_m_no});

	
});
module.exports = router;
