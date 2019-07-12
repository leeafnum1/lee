<?include_once $_SERVER["DOCUMENT_ROOT"]."/include/dbconnect.php";?>
<?php
	require("./libs/INImx.php");
	
	$result = false;
	$inimx = new INImx;


	/////////////////////////////////////////////////////////////////////////////
	///// 1. 변수 초기화 및 POST 인증값 받음                                 ////
	/////////////////////////////////////////////////////////////////////////////
	
	$inimx->reqtype 		= "PAY";  //결제요청방식
	$inimx->inipayhome 	= ""; //로그기록 경로 (이 위치의 하위폴더에 log폴더 생성 후 log폴더에 대해 777 권한 설정)
	$inimx->status			= $P_STATUS;
	$inimx->rmesg1			= $P_RMESG1;
	$inimx->tid		= $P_TID;
	$inimx->req_url		= $P_REQ_URL;
	$inimx->noti		= $P_NOTI;
	
	
	/////////////////////////////////////////////////////////////////////////////
	///// 2. 상점 아이디 설정 :                                              ////
	/////    결제요청 페이지에서 사용한 MID값과 동일하게 세팅해야 함...      ////
	/////    인증TID를 잘라서 사용가능 : substr($P_TID,'10','10');           ////
	/////////////////////////////////////////////////////////////////////////////
	$inimx->id_merchant = substr($P_TID,'10','10');  //
	
	
	
	
	/////////////////////////////////////////////////////////////////////////////
	///// 3. 인증결과 확인 :                                                 ////
	/////    인증값을 가지고 성공/실패에 따라 처리 방법                      ////
	/////////////////////////////////////////////////////////////////////////////
  if($inimx->status =="00")   // 모바일 인증이 성공시
  {


	/////////////////////////////////////////////////////////////////////////////
	///// 4. 승인요청 :                                                      ////
	/////    인증성공시  P_REQ_URL로 승인요청을 함...                        ////
	/////////////////////////////////////////////////////////////////////////////
	  $inimx->startAction();  // 승인요청
	  
	  
	  
	  $inimx->getResult();  //승인결과 파싱, P_REQ_URL에서 내려준 결과값 파싱 
	  
	  
	  /**
	  결과값 파싱 전문은 INImx내 변수로 담아 표현하고 있습니다. ( 메뉴얼얼내 값 대조하여 필요한 값 저장할 수 있도록 부탁드립니다.)
	  
	      --공통
				$this->m_tid  = $resultString['P_TID'];                                     // 거래번호
				$this->m_resultCode = $resultString['P_STATUS'];                            // 거래상태 - 지불결과 성공:00, 실패:00 이외 실패
				$this->m_resultMsg  = $resultString['P_RMESG1'];                            // 지불 결과 메시지
				$this->m_cardQuota  = $resultString['P_RMESG2'];                            // 신용카드 할부 개월 수 (메뉴얼 확인 필요)
				$this->m_payMethod = $resultString['P_TYPE'];                               // 지불수단 
				$this->m_mid  = $resultString['P_MID'];                                     // 상점아이디
				$this->m_moid  = $resultString['P_OID'];                                    // 상점주문번호
				$this->m_resultprice = $resultString['P_AMT'];                              // 거래금액
				$this->m_buyerName  = $resultString['P_UNAME'];                             // 구매자명
				$this->m_nextUrl  = $resultString['P_NEXT_URL'];                            // 가맹점 전달 P_NEXT_URL 
				$this->m_notiUrl  = $resultString['P_NOTEURL'];                             // 가맹점 전달 NOTE_URL --->>이거도 설명 에매하네 
				$this->m_authdt  = $resultString['P_AUTH_DT'];                              // 승인일자(YYYYmmddHHmmss)
				$this->m_pgAuthDate  = substr($resultString['P_AUTH_DT'],'0','8');          
				$this->m_pgAuthTime  = substr($resultString['P_AUTH_DT'],'8','6');          
				$this->m_mname  = $resultString['P_MNAME'];                                 // 가맹점명
				$this->m_noti  = $resultString['P_NOTI'];                                   // 기타주문정보
				$this->m_authCode = $resultString['P_AUTH_NO'];                             // 신용카드 승인번호 - 신용카드 거래에서만 사용		
				$this->m_cardCode = $resultString['P_FN_CD1'];                              // 카드코드 
				
				
				--신용카드		
        $this->m_cardIssuerCode = $resultString['P_CARD_ISSUER_CODE'];              // 발급사 코드 
				$this->m_cardNum  = $resultString['P_CARD_NUM'];                            // 카드번호 
				$this->m_cardMumbernum  = $resultString['P_CARD_MEMBER_NUM'];               // 가맹점번호
				$this->m_cardpurchase  = $resultString['P_CARD_PURCHASE_CODE'];             // 매입사 코드 
				$this->m_prtc  = $resultString['P_CARD_PRTC_CODE'];                         // 부분취소 가능 여부
				$this->m_cardinterest  = $resultString['P_CARD_INTEREST'];                  // 무이자 할부여부 (일반 : 0, 무이자 : 1)
				$this->m_cardcheckflag  = $resultString['P_CARD_CHECKFLAG'];                // 체크카드여부 (신용카드:0, 체크카드:1, 기프트카드:2)
				$this->m_cardName  = $resultString['P_FN_NM'];                              // 결제카드한글명
				$this->m_cardSrcCode  = $resultString['P_SRC_CODE'];                        // 앱연동 여부 P : 페이핀, K : 국민앱카드
				
				
				--휴대폰
				$this->m_codegw  = $resultString['P_HPP_CORP'];                             // 휴대폰 통신사코드
				$this->m_hppapplnum  = $resultString['P_APPL_NUM'];                         // 휴대폰결제 승인번호
				$this->m_hppnum  = $resultString['P_HPP_NUM'];                              // 고객 휴대폰 번호
				
				
				--가상계좌
				$this->m_vacct  = $resultString['P_VACT_NUM'];                              // 입금할 계좌 번호
				$this->m_dtinput = $resultString['P_VACT_DATE'];                            // 입금마감일자(YYYYmmdd)
        $this->m_tminput = $resultString['P_VACT_TIME'];                            // 입금마감시간(hhmmss)
				$this->m_nmvacct = $resultString['P_VACT_NAME'];                            // 계좌주명
				$this->m_vcdbank = $resultString['P_VACT_BANK_CODE'];                       // 은행코드
	  */
	  $user_idx = $inimx->m_noti;
   	  $P_TID = $inimx->m_tid;


	  if($inimx->m_resultCode == "00"){ //성공
			$pay_point = $inimx->m_resultprice;

			if($pay_point == "10000"){
				$change_point=10000;
			}elseif($pay_point == "50000"){
				$change_point=50000;
			
			}
			

			$sql2 = "Insert into tbl_payment(m_no, Payment_method, payment, reg_date, Payment_status) value($user_idx, 1, $pay_point, now(), 0 )";
			echo $sql2;
			$result2 = mysqli_query($connect, $sql2);

		
			if($result2 ){
			
				$sql = "UPDATE tbl_member SET M_POINT = M_POINT + ".$change_point." where m_no =".$user_idx;
				echo $sql;
				$result = mysqli_query($connect, $sql);
		
				echo "<script>alert('결제가 완료되었습니다');opener.location.href='javascript:goParent();';self.close();</script>";
				exit;
		
			//	echo "<script>alert('Rose가 변경되었습니다.');location.href='admin1_2.php?user_idx=$user_idx';</script>";
			}else{
				echo "<script>alert('결제 오류가 있습니다');self.close();";
				echo "Error: " . $sql . "<br>";
				exit;
			}


		
			$result = true;
	  }else{
			$result = false;
			
	  }
  }else{
	$result = false;
	echo "<script>alert('결제 승인 실패되었습니다.');opener.top.location.href='https://www.club1004.kr/main';self.close();</script>";		
  }
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
<title>What`s up</title>
<link rel="stylesheet" href="/css/reset_m.css" type="text/css"/>
<script>
function goExchange(){
	parent.postMessage( "goExchagne", "*" );
}
</script>
<script type="application/x-javascript">
    
    addEventListener("load", function()
    {
        setTimeout(updateLayout, 0);
    }, false);
 
    var currentWidth = 0;
    
    function updateLayout()
    {
        if (window.innerWidth != currentWidth)
        {
            currentWidth = window.innerWidth;
 
            var orient = currentWidth == 320 ? "profile" : "landscape";
            document.body.setAttribute("orient", orient);
            setTimeout(function()
            {
                window.scrollTo(0, 1);
            }, 100);            
        }
    }
 
    setInterval(updateLayout, 400);
    
</script>

<script language=javascript>
window.name = "BTPG_CLIENT";

var width = 330;
var height = 480;
var xpos = (screen.width - width) / 2;
var ypos = (screen.width - height) / 2;
var position = "top=" + ypos + ",left=" + xpos;
var features = position + ", width=320, height=440";

	function on_load() { 
		myform = document.mobileweb_form; 
	/**************************************************************************** 
	OID(상점주문번호)를 랜덤하게 생성시키는 루틴
	상점에서 각 거래건마다 부여하는 고유의 주문번호가 있다면 이 루틴은 필요없고, 
	해당 값을 P_OID에 세팅해서 사용하면 된다.
	****************************************************************************/ 
		curr_date = new Date(); 
		year = curr_date.getYear(); 
		month = curr_date.getMonth(); 
		day = curr_date.getDay(); 
		hours = curr_date.getHours(); 
		mins = curr_date.getMinutes(); 
		secs = curr_date.getSeconds(); 
		myform.P_OID.value = year.toString() + month.toString() + day.toString() + hours.toString() + mins.toString() + secs.toString();
} 


	function on_pay() { 
		myform = document.mobileweb_form; 
		
	/**************************************************************************** 
	결제수단 action url을 아래와 같이 설정한다
	URL끝에 /를 삭제하면 다음과 같은 오류가 발생한다.
	"일시적인 오류로 결제시도가 정상적으로 처리되지 않았습니다.(MX1002) 자세한 사항은 이니시스(1588-4954)로 문의해주세요."
	****************************************************************************/ 
		if(myform.P_GOPAYMETHOD.value == "CARD") {
			myform.action = "https://mobile.inicis.com/smart/wcard/"; //신용카드
			}
		else if(myform.P_GOPAYMETHOD.value == "VBANK") {
			myform.action = "https://mobile.inicis.com/smart/vbank/"; //가상계좌
			}
		else if(myform.P_GOPAYMETHOD.value == "BANK") {
			myform.action = "https://mobile.inicis.com/smart/bank/"; //계좌이체
		}
		else if(myform.P_GOPAYMETHOD.value == "HPP") {
			myform.action = "https://mobile.inicis.com/smart/mobile/"; //휴대폰
			}
		else if(myform.P_GOPAYMETHOD.value == "CULTURE") {
			myform.action = "https://mobile.inicis.com/smart/culture/"; //문화 상품권
			}
		else if(myform.P_GOPAYMETHOD.value == "HPMN") {
			myform.action = "https://mobile.inicis.com/smart/hpmn/"; //해피머니 상품권
			}
		else {
			myform.action = "https://mobile.inicis.com/smart/wcard/"; // 엉뚱한 값이 들어오면 카드가 기본이 되게 함
			}
		
		myform.P_RETURN_URL.value = myform.P_RETURN_URL.value + "?P_OID=" + myform.P_OID.value; // 계좌이체 결제시 P_RETURN_URL로 P_OID값 전송(GET방식 호출)
		myform.target = "_blank"; // 주석 혹은 제거 시 self 로 지정됨
		myform.submit(); 
		} 		
</script>

<script language="javascript">
	<!--
	function goHome(){
		top.location.href='https://www.club1004.kr/main';
	}
		
	//-->
</script>


</head>

<body>

	 <div id="right_main ">
            <div class="right_contents">
					
                	<div class="rose_top">
						<?if($result == true){?>
							<span>결제가 완료되었습니다.</span>
						<?}else{?>
							<span>결제가 실패했습니다.</span>	
						<?}?>
                    	
                        
                    </div>
                   
					<div align="center"> <a href="javascript:goHome(); "><button>홈으로 이동하기</button></a></div>
             </div>

                    <!---->
                    
     </div>
</body>
</html>
