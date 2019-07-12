<?php
require_once('libs/INIStdPayUtil.php');
require_once('libs/sha256.inc.php');
$SignatureUtil = new INIStdPayUtil();


//############################################
// 1.전문 필드 값 설정(***가맹점 개발수정***)
//############################################
// 여기에 설정된 값은 Form 필드에 동일한 값으로 설정
//$mid 			= "BRAtmkorea";  								// 가맹점 ID(가맹점 수정후 고정)					
$mid = "BRAwhatsup";
//인증
//$signKey 		= "SU5JTElURV9UUklQTEVERVNfS0VZU1RS"; 			// 가맹점에 제공된 키(이니라이트키) (가맹점 수정후 고정) !!!절대!! 전문 데이터로 설정금지
$signKey 		= "UE9JWmEyZ3d1R3NOTFhYMStpSE1Ndz09";
$timestamp 		= $SignatureUtil->getTimestamp();   			// util에 의해서 자동생성
$orderNumber 	= $mid . "_" . $timestamp; 						// 가맹점 주문번호(가맹점에서 직접 설정)
//$price 			= $TOTAL;        								// 상품가격(특수기호 제외, 가맹점에서 직접 설정)
$price 			= "1000";        								// 상품가격(특수기호 제외, 가맹점에서 직접 설정)

//
//###################################
// 2. 가맹점 확인을 위한 signKey를 해시값으로 변경 (SHA-256방식 사용)
//###################################
$mKey 			= hash("sha256", $signKey);

/*
 **** 위변조 방지체크를 signature 생성 ***
 * oid, price, timestamp 3개의 키와 값을
 * key=value 형식으로 하여 '&'로 연결한 하여 SHA-256 Hash로 생성 된값
 * ex) oid=INIpayTest_1432813606995&price=819000&timestamp=2012-02-01 09:19:04.004
 * key기준 알파벳 정렬
 * timestamp는 반드시 signature생성에 사용한 timestamp 값을 timestamp input에 그데로 사용하여야함
 */
/*$params = "oid=" . $orderNumber . "&price=" . $price . "&timestamp=" . $timestamp;
$sign = hash("sha256", $params);*/ // order_inipay.php에서 처리
$params = array(
    "oid" => $orderNumber,
    "price" => $price,
    "timestamp" => $timestamp
);

//$sign = $SignatureUtil->makeSignature($params, "sha256");
$sign = $SignatureUtil->makeSignature($params);


/* 기타 */
$siteDomain = "https://".$_SERVER['HTTP_HOST']."/inipay/INIStdPaySample"; //가맹점 도메인 입력

// 페이지 URL에서 고정된 부분을 적는다. 
// Ex) returnURL이 http://localhost:8082/demo/INIpayStdSample/INIStdPayReturn.jsp 라면
//                 http://localhost:8082/demo/INIpayStdSample 까지만 기입한다.
?>


        <!-- 이니시스 표준결제 js -->
         <script language="javascript" type="text/javascript" src="https://stdpay.inicis.com/stdjs/INIStdPay.js" charset="UTF-8"></script>
<!--        <script language="javascript" type="text/javascript" src="https://stdpay.inicis.com/stdjs/INIStdPay.js" charset="UTF-8"></script> -->

        <script type="text/javascript">
            function paybtn() {
                INIStdPay.pay('SendPayForm_id');
            }
			
			function cardShow(){
				document.getElementById("acceptmethod").value = "BILLAUTH(card):FULLVERIFY";
			}

			function hppShow(){
				document.getElementById("acceptmethod").value = "BILLAUTH(HPP):HPP(1)";
			}
        </script>

		<form id="SendPayForm_id" name="SendPayForm_id" method="POST" >
			<!-- 필수 -->
			<input type="hidden" style="width:100%;" name="version" value="1.0" >
			<input type="hidden" style="width:100%;" name="mid" value="<?php echo $mid ?>" >
			<input type="hidden" style="width:100%;" name="goodname" value="테스트" >
			<input type="hidden" style="width:100%;" name="oid" value="<?php echo $orderNumber ?>" >
			<input type="hidden" style="width:100%;" name="price" value="<?php echo $price ?>" >
			<input type="hidden" style="width:100%;" name="currency" value="WON" >
			<input type="hidden" style="width:100%;" name="buyername" value="club1004 회원" >
			<input type="hidden" style="width:100%;" name="buyertel" value="010-1234-5678" >
			<input type="hidden" style="width:100%;" name="buyeremail" value="test@inicis.com" >
			<input type="hidden"  style="width:100%;" name="timestamp" value="<?php echo $timestamp ?>" >
			<input type="hidden" style="width:100%;" name="signature" value="<?php echo $sign ?>" >
			<input type="hidden" style="width:100%;" name="returnUrl" value="<?php echo $siteDomain ?>/INIStdPayReturn.php" >
			<input type="hidden"  name="mKey" value="<?php echo $mKey ?>" >
		   
			 <!-- 기본 옵션-->
			<input type="hidden" style="width:100%;" name="gopaymethod" value="Card:DirectBank" >
			<input  type="hidden" style="width:100%;" name="offerPeriod" value="" >
			<input type="hidden" style="width:100%;" id="acceptmethod" name="acceptmethod" value="HPP(1):no_receipt:va_receipt:vbanknoreg(0):below1000" >
			<!-- <input  style="width:100%;" id="billPrint_msg" name="billPrint_msg" value="고객님의 매월 결제일은 24일 입니다." >     --> 


			<!-- 표시 옵션 -->
		   <input type="hidden" style="width:100%;" name="languageView" value="" >
		   <input type="hidden" style="width:100%;" name="charset" value="" >
		   <input type="hidden" style="width:100%;" name="payViewType" value="popup" >
		   <input type="hidden" style="width:100%;" name="closeUrl" value="<?php echo $siteDomain ?>/close.php" >
		   <input type="hidden" style="width:100%;" name="popupUrl" value="<?php echo $siteDomain ?>/popup.php" >

		   <!--추가 옵션 -->
		   <input type="hidden" style="width:100%;" name="merchantData" value="<?php echo $_GET['m_no']?>" >
		  
		</form>
