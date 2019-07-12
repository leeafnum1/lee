var express = require('express');
var router = express.Router();
var pool = require("../db-pool");
var util = require('util');
 

session_check_branch_mgmt = function(req,res){
	var user_session = req.session;
	var u_info = user_session.u_info;
	 
	if(u_info==null){
		res.send("<script>alert('로그인이 필요한 페이지입니다.');parent.location='/';</script>"); 
		return false;
	}else if(u_info.m_type != 3){
		res.send("<script>alert('지점 관리자만 접근 할 수 있습니다.');parent.location='/';</script>"); 
		return false;
	}else{
		return true;  
	}       
}    
router.get('/', function(req, res, next) {
	var user_session = req.session;  
	var u_info = user_session.u_info;
	if(session_check_branch_mgmt(req,res)){
		res.render('branch_mgmt/index',{ session: user_session , u_info :u_info});
	}
});
router.post('/branchRoomList', function(req, res, next) {
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = u_info.m_no;
	var m_id = u_info.m_id;
	pool.getConnection(function(err,connection){
	   var query = connection.query("SELECT m_no, m_id, m_gender, m_nickname, m_profile_img, m_point, m_regdate, m_moddate, m_login, m_status, m_type FROM  tbl_member WHERE branch_code = ? and m_type =2  ORDER BY   cast(m_id as unsigned)    ",[m_id], function (err, rows) { 
           if(err){
               connection.release(); 
               throw err;
           }
	       connection.release();
	       res.send({rows:rows}); 
        });
	}); 
});
router.post('/roomStatusChg', function(req, res, next) {
	var user_session = req.session;
	var u_info = user_session.u_info;
	var m_no = u_info.m_no;
	var m_id = u_info.m_id;
	var room_m_no = req.body.room_m_no;
	var statusCode = req.body.statusCode;
	pool.getConnection(function(err,connection){
	   var query = connection.query("UPDATE tbl_member SET m_status = ? WHERE m_no  = ?   ",[statusCode,room_m_no], function (err, rows) { 
           if(err){
               connection.release(); 
               throw err;
           }
	       connection.release();
	       res.send("ok"); 
        });
	}); 
});
module.exports = router;
