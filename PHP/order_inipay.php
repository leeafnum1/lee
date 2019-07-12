<?
header("Content-Type: text/html; charset=UTF-8");
?>
<?include_once $_SERVER["DOCUMENT_ROOT"]."/include/dbconnect.php";?>
<?php	/* 주문처리가 이루어지는 페이지 */
$sessionid = session_id();
	$totalpay = $_POST["price"];
	$paymethod = $_POST["paymethod"];
	$user_idx = $_POST["user_idx"];

	if($totalpay == "10000"){
		$goodname = "1만포인트";
	}else if($totalpay == "50000"){
		$goodname = "5만포인트";
	}
	

	//$goodname = $_POST["goodname"];

	$order_no = "S".date("ymdHis"); // 주문번호

	// 무통장 입금분
	if($paymethod == "bank"){
		$sql2 = "Insert into tbl_payment(m_no, Payment_method, payment, reg_date, Payment_status) value($user_idx, 3, $totalpay, now(), 1 )";
		echo $sql2;
		$result2 = mysqli_query($connect, $sql2);


		if($result2 ){
		
			//$sql = "UPDATE tbl_member SET M_POINT = M_POINT + ".$totalpay." where m_no =".$user_idx;
			//echo $sql;
			//$result = mysqli_query($connect, $sql);

			echo "<script>alert('신청 완료되었습니다. 지정계좌로 입금 후 승인시 지급됩니다. ');window.close();</script>";
			exit;

		//	echo "<script>alert('Rose가 변경되었습니다.');location.href='admin1_2.php?user_idx=$user_idx';</script>";
		}else{
			echo "<script>alert('신청 오류가 있습니다.');self.close();";
			echo "Error: " . $sql . "<br>";
			exit;
		}


		mysqli_free_result($result2); 
		mysqli_close($connect);
	}

	// 무통장 입금분
		/*
 **** 위변조 방지체크를 signature 생성 ***
 * oid, price, timestamp 3개의 키와 값을
 * key=value 형식으로 하여 '&'로 연결한 하여 SHA-256 Hash로 생성 된값
 * ex) oid=INIpayTest_1432813606995&price=819000&timestamp=2012-02-01 09:19:04.004
 * key기준 알파벳 정렬
 * timestamp는 반드시 signature생성에 사용한 timestamp 값을 timestamp input에 그데로 사용하여야함
 */
		require_once('./inipay/libs/INIStdPayUtil.php');
		require_once('./inipay/libs/sha256.inc.php');
		$SignatureUtil = new INIStdPayUtil();

		$timestamp = $SignatureUtil->getTimestamp();
		$params = "oid=" . $order_no . "&price=" . $totalpay . "&timestamp=" . $timestamp;
		$signature = hash("sha256", $params);
		$send_name = "club1004 회원";
		$email = "";
		$hphone = "010-1234-5678";
		$p_model_name = $goodname;


		 //"parent.goPay('" & strOredrNO & "', '"&totSumAmt&"', '"&orderName&"', '"&orderEmail&"', '"&strgoodsName&"', '"&orderPhone&"','"&signature&"','"&timestamp&"');" &_

		 echo $order_no ."-". $totalpay ."-". $receive_name ."-". $send_name ."-". $send_name ."-". $email ."-". $hphone ;
		 echo "<script language='javascript'> parent.goPay('" .$order_no. "', '". $totalpay ."', '". $send_name ."', '". $email ."', '".$p_model_name."', '".$hphone."','".$signature."','".$timestamp."');</script>";

		  	


		 exit;  
				

		
	
?>