<?include_once $_SERVER["DOCUMENT_ROOT"]."/include/dbconnect.php";?>
<?


					$user_idx = $_REQUEST["P_NOTI"];
					$P_TID = $_REQUEST["P_TID"];

					if($_REQUEST["P_STATUS"] == "00"){
						
						$pay_point = $_REQUEST["P_AMT"];

						if($pay_point == "5000"){
							$rose_change=500;
						}elseif($pay_point == "9500"){
							$rose_change=1000;
						}elseif($pay_point == "18000"){
							$rose_change=2000;
						}elseif($pay_point == "42500"){
							$rose_change=5000;
						}elseif($pay_point == "80000"){
							$rose_change=10000;
						}else{
							$rose_change=500;
						}
						
						$sql_rose_cnt = "select rose_cnt from tbl_user where user_idx =".$user_idx;
						$result_rose_cnt = mysqli_query($connect, $sql_rose_cnt);

						$row_rose_cnt = mysqli_fetch_array($result_rose_cnt);
						$rose_cnt = $row_rose_cnt["rose_cnt"];

						mysqli_free_result($result_rose_cnt); 


						$rose = $rose_cnt + $rose_change;
						
						$sql = "UPDATE tbl_user SET rose_cnt = ".$rose." where user_idx =".$user_idx;
						$result = mysqli_query($connect, $sql);

						if ($result) {
							if(mysqli_affected_rows($connect) > 0 ){
								$sql1 = "Insert into tbl_rose_history(use_user_idx, rose_cnt, use_code, reg_date, rose_balance) value($user_idx, $rose_change, 0, now(), $rose )";
								$result1 = mysqli_query($connect, $sql1);

								$sql2 = "Insert into tbl_payment(user_idx, Payment_method, payment, reg_date, Payment_status, t_id) value($user_idx, 2, $pay_point, now(), 0, '$P_TID')";
								$result2 = mysqli_query($connect, $sql2);

								echo "OK";
												
							}else{
						
								echo "FAIL";
							}


							mysqli_free_result($result); 
							mysqli_close($connect);
						} else {
								echo "FAIL";
							
						}	


						mysqli_free_result($result); 
						mysqli_close($connect);

						 //echo "<script>alert('결제가 완료되었습니다.');self.close();</script>";

					}else{
						 //echo "<script>alert('결제가 실패했습니다. 잠시후 다시 이용하세요.');self.close();</script>";
						 echo "FAIL";
					}
					

					  


?>

